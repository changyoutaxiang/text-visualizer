#!/usr/bin/env node

/**
 * 成本监控和优化脚本
 * 监控部署成本并提供优化建议
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CostMonitor {
  constructor() {
    this.config = this.loadConfig();
    this.usage = this.loadUsageData();
    this.alerts = [];
  }

  loadConfig() {
    const configPath = path.join(__dirname, '..', 'cost-optimization.json');
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  loadUsageData() {
    const usagePath = path.join(__dirname, '..', 'usage-data.json');
    if (fs.existsSync(usagePath)) {
      return JSON.parse(fs.readFileSync(usagePath, 'utf8'));
    }
    return {
      daily: [],
      monthly: [],
      platforms: {
        vercel: { usage: 0, cost: 0 },
        netlify: { usage: 0, cost: 0 },
        aws: { usage: 0, cost: 0 },
        cloudflare: { usage: 0, cost: 0 }
      }
    };
  }

  saveUsageData() {
    const usagePath = path.join(__dirname, '..', 'usage-data.json');
    fs.writeFileSync(usagePath, JSON.stringify(this.usage, null, 2));
  }

  // 分析构建大小
  async analyzeBundleSize() {
    console.log('分析构建大小...');
    
    try {
      const stats = JSON.parse(
        execSync('npm run build -- --mode analyze --json', { encoding: 'utf8' })
      );

      const bundleSize = this.calculateBundleSize(stats);
      const recommendations = this.getOptimizationRecommendations(stats);

      return {
        totalSize: bundleSize.total,
        gzipSize: bundleSize.gzip,
        brotliSize: bundleSize.brotli,
        recommendations
      };
    } catch (error) {
      console.error('构建分析失败:', error.message);
      return null;
    }
  }

  calculateBundleSize(stats) {
    const assets = stats.assets || [];
    const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0);
    
    return {
      total: totalSize,
      gzip: Math.round(totalSize * 0.3), // 估算 gzip 压缩后大小
      brotli: Math.round(totalSize * 0.25) // 估算 brotli 压缩后大小
    };
  }

  getOptimizationRecommendations(stats) {
    const recommendations = [];
    const chunks = stats.chunks || [];
    
    chunks.forEach(chunk => {
      if (chunk.size > 500000) { // 500KB
        recommendations.push({
          type: 'large_chunk',
          chunk: chunk.names?.[0] || 'unknown',
          size: chunk.size,
          suggestion: '考虑代码分割或延迟加载'
        });
      }
    });

    return recommendations;
  }

  // 监控 CDN 使用情况
  async monitorCDNUsage() {
    console.log('监控 CDN 使用情况...');
    
    // 这里可以集成实际的 CDN API
    // 例如 CloudFlare Analytics API
    const mockCDNData = {
      requests: Math.floor(Math.random() * 100000),
      bandwidth: Math.floor(Math.random() * 10000),
      cacheHitRate: 0.85 + Math.random() * 0.1
    };

    return {
      ...mockCDNData,
      estimatedCost: this.calculateCDNCost(mockCDNData),
      efficiency: this.calculateEfficiency(mockCDNData)
    };
  }

  calculateCDNCost(cdnData) {
    // 基于使用量的成本估算
    const costPerGB = 0.085; // CloudFlare 价格
    const costPerRequest = 0.00005;
    
    return {
      bandwidth: (cdnData.bandwidth / 1024) * costPerGB,
      requests: cdnData.requests * costPerRequest,
      total: (cdnData.bandwidth / 1024) * costPerGB + cdnData.requests * costPerRequest
    };
  }

  calculateEfficiency(cdnData) {
    return {
      cacheHitRate: cdnData.cacheHitRate,
      bandwidthSaved: cdnData.bandwidth * cdnData.cacheHitRate,
      costSaved: (cdnData.bandwidth * cdnData.cacheHitRate / 1024) * 0.085
    };
  }

  // 生成成本报告
  async generateCostReport() {
    console.log('生成成本报告...');
    
    const bundleAnalysis = await this.analyzeBundleSize();
    const cdnUsage = await this.monitorCDNUsage();
    
    const report = {
      timestamp: new Date().toISOString(),
      bundle: bundleAnalysis,
      cdn: cdnUsage,
      recommendations: this.generateOptimizationRecommendations(bundleAnalysis, cdnUsage),
      budget: this.getBudgetStatus()
    };

    this.saveReport(report);
    return report;
  }

  generateOptimizationRecommendations(bundle, cdn) {
    const recommendations = [];

    if (bundle?.totalSize > 1000000) { // 1MB
      recommendations.push({
        priority: 'high',
        category: 'bundle_size',
        message: '构建包超过 1MB，建议启用代码分割',
        action: 'npm run build:analyze'
      });
    }

    if (cdn?.cacheHitRate < 0.8) {
      recommendations.push({
        priority: 'medium',
        category: 'cdn',
        message: 'CDN 缓存命中率低于 80%',
        action: '优化缓存策略和 TTL 设置'
      });
    }

    if (this.isBudgetExceeded()) {
      recommendations.push({
        priority: 'high',
        category: 'budget',
        message: '预算已超出，需要立即优化',
        action: 'review cost-optimization.json'
      });
    }

    return recommendations;
  }

  getBudgetStatus() {
    const today = new Date();
    const dailyUsage = this.usage.daily.filter(d => 
      new Date(d.date).toDateString() === today.toDateString()
    );
    
    const monthlyUsage = this.usage.monthly.filter(m => 
      new Date(m.date).getMonth() === today.getMonth() && 
      new Date(m.date).getFullYear() === today.getFullYear()
    );

    return {
      daily: {
        spent: dailyUsage.reduce((sum, d) => sum + d.total, 0),
        budget: this.config.budget.daily
      },
      monthly: {
        spent: monthlyUsage.reduce((sum, m) => sum + m.total, 0),
        budget: this.config.budget.monthly
      }
    };
  }

  isBudgetExceeded() {
    const status = this.getBudgetStatus();
    return status.daily.spent > status.daily.budget || 
           status.monthly.spent > status.monthly.budget;
  }

  saveReport(report) {
    const reportPath = path.join(__dirname, '..', 'cost-reports');
    
    if (!fs.existsSync(reportPath)) {
      fs.mkdirSync(reportPath, { recursive: true });
    }

    const filename = `cost-report-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(path.join(reportPath, filename), JSON.stringify(report, null, 2));
    
    console.log(`成本报告已保存: ${filename}`);
  }

  // 发送告警
  async sendAlerts() {
    const alerts = this.generateAlerts();
    
    if (alerts.length > 0) {
      console.log('发送成本告警...');
      
      // 可以集成 Slack、邮件等通知系统
      alerts.forEach(alert => {
        console.warn(`告警: ${alert.message}`);
      });
    }
  }

  generateAlerts() {
    const alerts = [];
    const status = this.getBudgetStatus();

    if (status.daily.spent > status.daily.budget * 0.8) {
      alerts.push({
        type: 'warning',
        message: `今日支出已达预算的 ${((status.daily.spent / status.daily.budget) * 100).toFixed(1)}%`
      });
    }

    if (status.monthly.spent > status.monthly.budget * 0.9) {
      alerts.push({
        type: 'critical',
        message: `本月支出已达预算的 ${((status.monthly.spent / status.monthly.budget) * 100).toFixed(1)}%`
      });
    }

    return alerts;
  }

  // 优化构建配置
  async optimizeBuild() {
    console.log('优化构建配置...');
    
    const optimizations = [
      {
        name: '启用压缩',
        command: 'npm run build -- --minify terser'
      },
      {
        name: '代码分割',
        command: 'npm run build -- --split-chunks'
      },
      {
        name: 'Tree Shaking',
        command: 'npm run build -- --tree-shaking'
      }
    ];

    for (const optimization of optimizations) {
      console.log(`执行: ${optimization.name}`);
      try {
        execSync(optimization.command, { stdio: 'inherit' });
      } catch (error) {
        console.warn(`${optimization.name} 失败:`, error.message);
      }
    }
  }
}

// CLI 接口
if (require.main === module) {
  const monitor = new CostMonitor();
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'report':
      monitor.generateCostReport();
      break;
    case 'optimize':
      monitor.optimizeBuild();
      break;
    case 'check':
      monitor.sendAlerts();
      break;
    default:
      console.log('使用方法:');
      console.log('  node cost-monitor.js report   - 生成成本报告');
      console.log('  node cost-monitor.js optimize - 优化构建');
      console.log('  node cost-monitor.js check    - 检查预算状态');
  }
}

module.exports = CostMonitor;