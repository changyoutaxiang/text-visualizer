#!/usr/bin/env node

/**
 * 自动化回滚脚本
 * 支持多种部署平台的回滚策略
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class RollbackManager {
  constructor() {
    this.config = this.loadConfig();
    this.deployments = this.loadDeploymentHistory();
  }

  loadConfig() {
    const configPath = path.join(__dirname, '..', 'deployment-config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    return {
      platforms: ['vercel', 'netlify'],
      rollbackLimit: 5,
      healthCheck: {
        url: 'https://yourdomain.com/health',
        timeout: 30000,
        expectedStatus: 200
      }
    };
  }

  loadDeploymentHistory() {
    const historyPath = path.join(__dirname, '..', 'deployments.json');
    if (fs.existsSync(historyPath)) {
      return JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    }
    return [];
  }

  saveDeploymentHistory(history) {
    const historyPath = path.join(__dirname, '..', 'deployments.json');
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
  }

  // 显示可用回滚版本
  async listAvailableRollbacks() {
    console.log('可用的回滚版本：');
    console.log('==================');
    
    this.deployments
      .slice(-this.config.rollbackLimit)
      .reverse()
      .forEach((deployment, index) => {
        console.log(`${index + 1}. ${deployment.commit} - ${deployment.timestamp}`);
        console.log(`   平台: ${deployment.platform}`);
        console.log(`   状态: ${deployment.status}`);
        console.log(`   版本: ${deployment.version}`);
        console.log('');
      });
  }

  // 执行回滚
  async rollback(targetIndex = 1) {
    const targetDeployment = this.deployments[this.deployments.length - targetIndex];
    
    if (!targetDeployment) {
      console.error('找不到指定的部署版本');
      process.exit(1);
    }

    console.log(`准备回滚到版本: ${targetDeployment.commit}`);
    console.log(`目标平台: ${targetDeployment.platform}`);

    try {
      // 执行平台特定的回滚
      await this.performPlatformRollback(targetDeployment);
      
      // 健康检查
      const isHealthy = await this.performHealthCheck();
      if (!isHealthy) {
        throw new Error('健康检查失败');
      }

      // 更新部署历史
      this.updateDeploymentHistory(targetDeployment);
      
      console.log('回滚成功！');
      console.log(`已回滚到版本: ${targetDeployment.commit}`);
      
    } catch (error) {
      console.error('回滚失败:', error.message);
      await this.handleRollbackFailure(targetDeployment, error);
      process.exit(1);
    }
  }

  // 平台特定回滚
  async performPlatformRollback(deployment) {
    switch (deployment.platform) {
      case 'vercel':
        await this.rollbackVercel(deployment);
        break;
      case 'netlify':
        await this.rollbackNetlify(deployment);
        break;
      case 'aws':
        await this.rollbackAWS(deployment);
        break;
      default:
        throw new Error(`不支持的平台: ${deployment.platform}`);
    }
  }

  async rollbackVercel(deployment) {
    console.log('执行 Vercel 回滚...');
    
    const command = `vercel --prod --force --token=${process.env.VERCEL_TOKEN}`;
    
    // 切换到目标版本
    execSync(`git checkout ${deployment.commit}`, { stdio: 'inherit' });
    
    // 重新部署
    execSync(command, { stdio: 'inherit' });
    
    // 切回主分支
    execSync('git checkout main', { stdio: 'inherit' });
  }

  async rollbackNetlify(deployment) {
    console.log('执行 Netlify 回滚...');
    
    const command = `netlify deploy --prod --dir=dist --message="Rollback to ${deployment.commit}"`;
    
    execSync(`git checkout ${deployment.commit}`, { stdio: 'inherit' });
    execSync('npm run build', { stdio: 'inherit' });
    execSync(command, { stdio: 'inherit' });
    execSync('git checkout main', { stdio: 'inherit' });
  }

  async rollbackAWS(deployment) {
    console.log('执行 AWS 回滚...');
    
    const command = `aws s3 sync dist/ s3://${deployment.bucket} --delete`;
    
    execSync(`git checkout ${deployment.commit}`, { stdio: 'inherit' });
    execSync('npm run build', { stdio: 'inherit' });
    execSync(command, { stdio: 'inherit' });
    execSync('git checkout main', { stdio: 'inherit' });
  }

  // 健康检查
  async performHealthCheck() {
    console.log('执行健康检查...');
    
    const { default: fetch } = await import('node-fetch');
    
    try {
      const response = await fetch(this.config.healthCheck.url, {
        timeout: this.config.healthCheck.timeout
      });
      
      const isHealthy = response.status === this.config.healthCheck.expectedStatus;
      console.log(`健康检查: ${isHealthy ? '通过' : '失败'}`);
      
      return isHealthy;
    } catch (error) {
      console.error('健康检查失败:', error.message);
      return false;
    }
  }

  // 更新部署历史
  updateDeploymentHistory(targetDeployment) {
    const newDeployment = {
      ...targetDeployment,
      timestamp: new Date().toISOString(),
      type: 'rollback',
      originalCommit: targetDeployment.commit,
      rollbackFrom: this.deployments[this.deployments.length - 1]?.commit
    };

    this.deployments.push(newDeployment);
    this.saveDeploymentHistory(this.deployments);
  }

  // 处理回滚失败
  async handleRollbackFailure(deployment, error) {
    console.error('回滚失败，执行应急措施...');
    
    // 发送告警通知
    await this.sendAlert({
      type: 'rollback_failed',
      deployment: deployment,
      error: error.message,
      timestamp: new Date().toISOString()
    });

    // 可以尝试其他回滚策略
    console.log('尝试备用回滚策略...');
    
    // 这里可以添加更复杂的回滚逻辑
    // 比如：使用不同的部署平台、使用缓存版本等
  }

  async sendAlert(alert) {
    // 发送 Slack 通知
    if (process.env.SLACK_WEBHOOK) {
      await fetch(process.env.SLACK_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 部署回滚失败！
平台: ${alert.deployment.platform}
版本: ${alert.deployment.commit}
错误: ${alert.error}
时间: ${alert.timestamp}
          `
        })
      });
    }

    // 发送邮件通知（可以集成邮件服务）
    console.log('已发送告警通知');
  }

  // 创建回滚点
  async createRollbackPoint(platform, commit = null) {
    const currentCommit = commit || execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    
    const deployment = {
      commit: currentCommit,
      timestamp: new Date().toISOString(),
      platform: platform,
      status: 'success',
      version: require('../package.json').version,
      branch: execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim()
    };

    this.deployments.push(deployment);
    this.saveDeploymentHistory(this.deployments);
    
    console.log(`已创建回滚点: ${currentCommit}`);
  }

  // 清理旧版本
  async cleanupOldDeployments() {
    const cutoff = this.deployments.length - this.config.rollbackLimit;
    if (cutoff > 0) {
      this.deployments = this.deployments.slice(cutoff);
      this.saveDeploymentHistory(this.deployments);
      console.log(`已清理 ${cutoff} 个旧部署记录`);
    }
  }
}

// CLI 接口
if (require.main === module) {
  const rollbackManager = new RollbackManager();
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'list':
      rollbackManager.listAvailableRollbacks();
      break;
    case 'rollback':
      const targetIndex = parseInt(args[1]) || 1;
      rollbackManager.rollback(targetIndex);
      break;
    case 'create':
      const platform = args[1] || 'vercel';
      rollbackManager.createRollbackPoint(platform);
      break;
    case 'cleanup':
      rollbackManager.cleanupOldDeployments();
      break;
    default:
      console.log('使用方法:');
      console.log('  node rollback.js list          - 显示可用回滚版本');
      console.log('  node rollback.js rollback [n]  - 回滚到第n个版本');
      console.log('  node rollback.js create [平台] - 创建回滚点');
      console.log('  node rollback.js cleanup       - 清理旧版本');
  }
}

module.exports = RollbackManager;