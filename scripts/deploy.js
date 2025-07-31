#!/usr/bin/env node

/**
 * 多环境部署脚本
 * 支持 Vercel、Netlify、AWS、Docker 等多种部署方式
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DeploymentManager {
  constructor() {
    this.config = this.loadConfig();
    this.environment = process.env.NODE_ENV || 'development';
    this.platform = this.getPlatform();
  }

  loadConfig() {
    const configPath = path.join(__dirname, '..', 'deployment-config.json');
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  getPlatform() {
    if (process.env.VERCEL) return 'vercel';
    if (process.env.NETLIFY) return 'netlify';
    if (process.env.AWS_REGION) return 'aws';
    return 'local';
  }

  async deploy() {
    console.log(`🚀 开始部署到 ${this.environment} 环境...`);
    console.log(`📍 平台: ${this.platform}`);

    try {
      // 1. 环境检查
      await this.checkEnvironment();
      
      // 2. 构建应用
      await this.build();
      
      // 3. 运行测试
      await this.runTests();
      
      // 4. 部署到指定平台
      await this.deployToPlatform();
      
      // 5. 健康检查
      await this.healthCheck();
      
      // 6. 通知团队
      await this.notify();
      
      console.log('✅ 部署成功！');
      
    } catch (error) {
      console.error('❌ 部署失败:', error.message);
      await this.handleFailure(error);
      process.exit(1);
    }
  }

  async checkEnvironment() {
    console.log('🔍 检查环境配置...');
    
    const envConfig = this.config.environments[this.environment];
    if (!envConfig) {
      throw new Error(`未找到 ${this.environment} 环境配置`);
    }

    // 检查必需的环境变量
    const requiredVars = this.config.variables[this.environment];
    const missingVars = Object.keys(requiredVars).filter(key => !process.env[key]);
    
    if (missingVars.length > 0) {
      throw new Error(`缺少环境变量: ${missingVars.join(', ')}`);
    }

    console.log('✅ 环境检查通过');
  }

  async build() {
    console.log('🔨 构建应用...');
    
    const buildCommand = this.config.platforms[this.platform]?.buildCommand || 'npm run build';
    
    try {
      execSync(buildCommand, { stdio: 'inherit' });
      console.log('✅ 构建成功');
    } catch (error) {
      throw new Error(`构建失败: ${error.message}`);
    }
  }

  async runTests() {
    if (this.environment === 'development') {
      console.log('⏭️  跳过测试（开发环境）');
      return;
    }

    console.log('🧪 运行测试...');
    
    try {
      execSync('npm test', { stdio: 'inherit' });
      console.log('✅ 测试通过');
    } catch (error) {
      throw new Error(`测试失败: ${error.message}`);
    }
  }

  async deployToPlatform() {
    switch (this.platform) {
      case 'vercel':
        await this.deployToVercel();
        break;
      case 'netlify':
        await this.deployToNetlify();
        break;
      case 'aws':
        await this.deployToAWS();
        break;
      case 'docker':
        await this.deployToDocker();
        break;
      default:
        await this.deployToLocal();
    }
  }

  async deployToVercel() {
    console.log('🚀 部署到 Vercel...');
    
    const vercelConfig = this.config.platforms.vercel;
    const envVars = this.config.variables[this.environment];
    
    // 设置环境变量
    Object.entries(envVars).forEach(([key, value]) => {
      process.env[key] = value;
    });

    try {
      const command = this.environment === 'production' 
        ? 'vercel --prod --yes'
        : 'vercel --yes';
      
      execSync(command, { stdio: 'inherit' });
    } catch (error) {
      throw new Error(`Vercel 部署失败: ${error.message}`);
    }
  }

  async deployToNetlify() {
    console.log('🚀 部署到 Netlify...');
    
    try {
      const command = this.environment === 'production'
        ? 'netlify deploy --prod --dir=dist'
        : 'netlify deploy --dir=dist';
      
      execSync(command, { stdio: 'inherit' });
    } catch (error) {
      throw new Error(`Netlify 部署失败: ${error.message}`);
    }
  }

  async deployToAWS() {
    console.log('🚀 部署到 AWS...');
    
    const awsConfig = this.config.platforms.aws;
    
    try {
      // 上传到 S3
      const s3Command = `aws s3 sync dist/ s3://${awsConfig.bucket} --delete`;
      execSync(s3Command, { stdio: 'inherit' });
      
      // 刷新 CloudFront
      if (awsConfig.cloudfront?.distributionId) {
        const cfCommand = `aws cloudfront create-invalidation --distribution-id ${awsConfig.cloudfront.distributionId} --paths "/*"`;
        execSync(cfCommand, { stdio: 'inherit' });
      }
      
    } catch (error) {
      throw new Error(`AWS 部署失败: ${error.message}`);
    }
  }

  async deployToDocker() {
    console.log('🚀 构建 Docker 镜像...');
    
    const imageName = `text-visualizer:${this.environment}`;
    const containerName = `text-visualizer-${this.environment}`;
    
    try {
      // 构建镜像
      execSync(`docker build -t ${imageName} .`, { stdio: 'inherit' });
      
      // 停止现有容器
      try {
        execSync(`docker stop ${containerName}`, { stdio: 'pipe' });
        execSync(`docker rm ${containerName}`, { stdio: 'pipe' });
      } catch (error) {
        // 容器不存在，忽略错误
      }
      
      // 启动新容器
      const runCommand = `docker run -d --name ${containerName} -p 3000:3000 ${imageName}`;
      execSync(runCommand, { stdio: 'inherit' });
      
    } catch (error) {
      throw new Error(`Docker 部署失败: ${error.message}`);
    }
  }

  async deployToLocal() {
    console.log('🚀 本地部署...');
    
    const distPath = path.join(__dirname, '..', 'dist');
    if (!fs.existsSync(distPath)) {
      throw new Error('构建目录不存在，请先运行构建');
    }
    
    console.log('✅ 本地部署完成');
    console.log(`📁 构建文件位于: ${distPath}`);
  }

  async healthCheck() {
    if (this.environment === 'development') {
      console.log('⏭️  跳过健康检查（开发环境）');
      return;
    }

    console.log('🏥 执行健康检查...');
    
    const envConfig = this.config.environments[this.environment];
    const healthUrl = `${envConfig.url}/health`;
    
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const { default: fetch } = await import('node-fetch');
        const response = await fetch(healthUrl, { timeout: 10000 });
        
        if (response.ok) {
          console.log('✅ 健康检查通过');
          return;
        }
        
        throw new Error(`HTTP ${response.status}`);
      } catch (error) {
        if (i === maxRetries - 1) {
          throw new Error(`健康检查失败: ${error.message}`);
        }
        
        console.log(`重试健康检查 (${i + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  async notify() {
    console.log('📢 发送通知...');
    
    const envConfig = this.config.environments[this.environment];
    
    // 发送 Slack 通知
    if (process.env.SLACK_WEBHOOK) {
      try {
        const { default: fetch } = await import('node-fetch');
        await fetch(process.env.SLACK_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `✅ 部署成功！\n环境: ${this.environment}\n平台: ${this.platform}\nURL: ${envConfig.url}\n时间: ${new Date().toISOString()}`
          })
        });
        console.log('✅ Slack 通知已发送');
      } catch (error) {
        console.warn('Slack 通知失败:', error.message);
      }
    }
  }

  async handleFailure(error) {
    console.log('🔄 处理部署失败...');
    
    // 发送失败通知
    if (process.env.SLACK_WEBHOOK) {
      try {
        const { default: fetch } = await import('node-fetch');
        await fetch(process.env.SLACK_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `❌ 部署失败！\n环境: ${this.environment}\n平台: ${this.platform}\n错误: ${error.message}\n时间: ${new Date().toISOString()}`
          })
        });
      } catch (notifyError) {
        console.warn('失败通知发送失败:', notifyError.message);
      }
    }
    
    // 尝试回滚
    if (this.config.deployment.rollback.enabled) {
      console.log('🔄 尝试回滚...');
      try {
        const rollbackScript = path.join(__dirname, 'rollback.js');
        execSync(`node ${rollbackScript}`, { stdio: 'inherit' });
      } catch (rollbackError) {
        console.warn('回滚失败:', rollbackError.message);
      }
    }
  }

  async createDockerfile() {
    const dockerfile = `
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
    `.trim();

    fs.writeFileSync(path.join(__dirname, '..', 'Dockerfile'), dockerfile);
    console.log('✅ Dockerfile 已创建');
  }

  async createNginxConfig() {
    const nginxConfig = `
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;
        
        location / {
            try_files $uri $uri/ /index.html;
        }
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
    `.trim();

    fs.writeFileSync(path.join(__dirname, '..', 'nginx.conf'), nginxConfig);
    console.log('✅ nginx.conf 已创建');
  }
}

// CLI 接口
if (require.main === module) {
  const deploymentManager = new DeploymentManager();
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'deploy':
      deploymentManager.deploy();
      break;
    case 'docker':
      deploymentManager.createDockerfile();
      deploymentManager.createNginxConfig();
      break;
    case 'build':
      deploymentManager.build();
      break;
    case 'health':
      deploymentManager.healthCheck();
      break;
    default:
      console.log('使用方法:');
      console.log('  node deploy.js deploy    - 部署到当前环境');
      console.log('  node deploy.js docker    - 创建 Docker 配置');
      console.log('  node deploy.js build     - 构建应用');
      console.log('  node deploy.js health    - 健康检查');
  }
}

module.exports = DeploymentManager;