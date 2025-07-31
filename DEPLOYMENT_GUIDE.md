# Text Visualizer 部署指南

本文档提供了 text-visualizer 项目的完整部署和优化方案，包括构建配置、CDN部署、监控和自动化流程。

## 📋 快速开始

### 1. 环境准备

```bash
# 安装依赖
npm install

# 设置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入你的配置
```

### 2. 本地开发

```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 3. 构建和预览

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 🚀 部署方案

### Vercel 部署（推荐）

#### 一键部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/text-visualizer)

#### 手动部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署到预览环境
npm run deploy:staging

# 部署到生产环境
npm run deploy:production
```

#### 环境变量配置

在 Vercel 控制台设置以下环境变量：

- `VITE_OPENROUTER_API_KEY`: OpenRouter API 密钥
- `VITE_SENTRY_DSN`: Sentry 监控 DSN（可选）
- `VITE_GA_TRACKING_ID`: Google Analytics ID（可选）

### Netlify 部署

#### 一键部署

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-repo/text-visualizer)

#### 手动部署

```bash
# 安装 Netlify CLI
npm i -g netlify-cli

# 登录
netlify login

# 部署
netlify deploy --prod --dir=dist
```

### AWS S3 + CloudFront 部署

#### 使用 AWS CLI

```bash
# 配置 AWS CLI
aws configure

# 构建并部署
npm run build
aws s3 sync dist/ s3://your-bucket-name --delete

# 刷新 CloudFront
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### Docker 部署

#### 构建和运行

```bash
# 构建 Docker 镜像
npm run docker:build

# 运行容器
npm run docker:run

# 访问 http://localhost:3000
```

#### 使用 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  text-visualizer:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - VITE_OPENROUTER_API_KEY=your-api-key
```

## 🔧 构建配置优化

### 代码分割

项目已配置智能代码分割策略：

- **vendor**: 第三方库（axios 等）
- **codemirror**: 代码编辑器相关代码
- **components**: 业务组件
- **services**: 服务层代码

### 压缩优化

- 使用 Terser 进行 JavaScript 压缩
- 支持 Gzip 和 Brotli 压缩
- 自动移除 console.log 和 debugger

### 缓存策略

- 静态资源：1 年缓存
- HTML 文件：1 小时缓存
- API 响应：根据内容类型设置不同缓存时间

## 📊 性能监控

### 集成 Web Vitals

自动收集 Core Web Vitals：

- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### 监控工具

```bash
# 运行 Lighthouse 测试
npm run test:e2e

# 查看性能报告
npm run build:analyze
```

## 🔍 安全部署

### 安全扫描

```bash
# 运行安全扫描
npm run security-scan

# 检查依赖漏洞
npm audit
npm audit fix
```

### 安全头部

已配置的安全头部包括：

- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security

## 💰 成本控制

### 成本监控

```bash
# 检查成本使用情况
npm run cost-check

# 生成成本报告
node scripts/cost-monitor.js report
```

### 优化建议

1. **CDN 优化**: 使用 CloudFlare 免费计划
2. **构建优化**: 启用压缩和代码分割
3. **缓存优化**: 合理设置缓存时间
4. **图片优化**: 使用 WebP 格式和懒加载

## 🔄 自动化部署

### GitHub Actions

已配置的工作流：

- **测试**: 代码质量检查和测试
- **构建**: 多平台构建
- **部署**: 自动部署到 staging/production
- **回滚**: 快速回滚机制

### 部署流程

1. **代码提交** → 触发 GitHub Actions
2. **自动测试** → 运行测试套件
3. **构建应用** → 生成优化构建
4. **部署到 Staging** → 预发布环境
5. **健康检查** → 验证部署成功
6. **部署到 Production** → 生产环境

## 📈 监控和告警

### 错误监控

集成 Sentry 进行实时错误监控：

```bash
# 设置 Sentry
export SENTRY_DSN=your-sentry-dsn
npm run deploy:production
```

### 性能监控

- **前端性能**: Web Vitals
- **API 性能**: 响应时间监控
- **用户体验**: 页面加载时间

## 🚨 回滚策略

### 自动回滚

部署失败时自动回滚到上一版本：

```bash
# 手动回滚
npm run rollback

# 回滚到指定版本
node scripts/rollback.js rollback 2
```

### 回滚命令

```bash
# 查看可用版本
node scripts/rollback.js list

# 创建回滚点
node scripts/rollback.js create

# 清理旧版本
node scripts/rollback.js cleanup
```

## 🌍 多环境配置

### 环境变量

每个环境有独立的配置文件：

- **开发环境**: `.env.development`
- **预发布**: `.env.staging`
- **生产环境**: `.env.production`

### 环境特性

| 环境 | 调试 | 监控 | 缓存 | 安全 |
|------|------|------|------|------|
| 开发 | ✅ | ❌ | ❌ | ❌ |
| 预发布 | ✅ | ✅ | ✅ | ✅ |
| 生产 | ❌ | ✅ | ✅ | ✅ |

## 📞 故障排查

### 常见问题

1. **构建失败**: 检查依赖版本和 Node.js 版本
2. **部署失败**: 验证环境变量配置
3. **性能问题**: 使用 Lighthouse 进行分析
4. **安全警告**: 运行安全扫描

### 获取帮助

- 查看构建日志：`npm run build -- --verbose`
- 检查部署状态：查看对应平台控制台
- 监控错误：查看 Sentry 仪表板

## 🔗 相关资源

- [Vercel 文档](https://vercel.com/docs)
- [Netlify 文档](https://docs.netlify.com/)
- [AWS 部署指南](https://docs.aws.amazon.com/s3/)
- [Docker 部署指南](https://docs.docker.com/)
- [性能优化最佳实践](https://web.dev/performance/)

## 📞 支持

如有部署问题，请：

1. 查看 [故障排除指南](#故障排查)
2. 检查相关日志
3. 提交 GitHub Issue
4. 联系开发团队