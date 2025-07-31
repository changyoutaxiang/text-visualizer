#!/usr/bin/env node

/**
 * 安全扫描脚本
 * 自动化安全检查和漏洞扫描
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class SecurityScanner {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        passed: 0,
        failed: 0,
        warnings: 0
      },
      details: []
    };
  }

  async runFullScan() {
    console.log('🔍 开始安全扫描...');
    
    const scans = [
      this.scanDependencies(),
      this.scanSecrets(),
      this.scanCodeQuality(),
      this.checkSecurityHeaders(),
      this.scanFilePermissions(),
      this.checkEnvironmentVariables(),
      this.scanForVulnerabilities()
    ];

    for (const scan of scans) {
      await scan;
    }

    this.generateReport();
    return this.results;
  }

  async scanDependencies() {
    console.log('📦 扫描依赖安全...');
    
    try {
      const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
      const audit = JSON.parse(auditResult);
      
      const vulnerabilities = audit.metadata?.vulnerabilities || {};
      const totalVulnerabilities = Object.values(vulnerabilities).reduce((sum, count) => sum + count, 0);
      
      this.results.details.push({
        type: 'dependency_audit',
        status: totalVulnerabilities === 0 ? 'passed' : 'failed',
        details: vulnerabilities,
        recommendation: totalVulnerabilities > 0 ? '运行 npm audit fix 修复漏洞' : '无漏洞'
      });

      if (totalVulnerabilities === 0) {
        this.results.summary.passed++;
      } else {
        this.results.summary.failed++;
      }

    } catch (error) {
      this.results.details.push({
        type: 'dependency_audit',
        status: 'failed',
        error: error.message,
        recommendation: '检查 npm audit 输出'
      });
      this.results.summary.failed++;
    }
  }

  async scanSecrets() {
    console.log('🔑 扫描敏感信息...');
    
    const secretPatterns = [
      /api[_-]?key\s*[:=]\s*['"][a-zA-Z0-9]{20,}['"]/gi,
      /secret\s*[:=]\s*['"][a-zA-Z0-9]{20,}['"]/gi,
      /password\s*[:=]\s*['"][^'"]{8,}['"]/gi,
      /token\s*[:=]\s*['"][a-zA-Z0-9]{20,}['"]/gi,
      /private[_-]?key\s*[:=]\s*['"][^-]+['"]/gi,
      /-----BEGIN [A-Z ]+ PRIVATE KEY-----/g,
      /github[_-]?token\s*[:=]\s*['"][a-zA-Z0-9_]+['"]/gi,
      /openai[_-]?key\s*[:=]\s*['"]sk-[a-zA-Z0-9]{20,}['"]/gi
    ];

    const filesToScan = this.getFilesToScan();
    let secretsFound = [];

    filesToScan.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        secretPatterns.forEach((pattern, index) => {
          const matches = content.match(pattern);
          if (matches) {
            secretsFound.push({
              file,
              pattern: `pattern_${index}`,
              matches: matches.length
            });
          }
        });
      } catch (error) {
        // 跳过无法读取的文件
      }
    });

    this.results.details.push({
      type: 'secrets_scan',
      status: secretsFound.length === 0 ? 'passed' : 'failed',
      findings: secretsFound,
      recommendation: secretsFound.length > 0 
        ? '发现敏感信息，请检查并移除' 
        : '未发现敏感信息'
    });

    if (secretsFound.length === 0) {
      this.results.summary.passed++;
    } else {
      this.results.summary.failed++;
    }
  }

  async scanCodeQuality() {
    console.log('🔍 扫描代码质量...');
    
    try {
      // ESLint 检查
      execSync('npm run lint -- --format json --output-file eslint-report.json', { stdio: 'pipe' });
      
      const eslintReport = JSON.parse(fs.readFileSync('eslint-report.json', 'utf8')));
      const totalErrors = eslintReport.reduce((sum, file) => sum + file.errorCount, 0);
      const totalWarnings = eslintReport.reduce((sum, file) => sum + file.warningCount, 0);

      this.results.details.push({
        type: 'code_quality',
        status: totalErrors === 0 ? 'passed' : 'failed',
        details: { errors: totalErrors, warnings: totalWarnings },
        recommendation: totalErrors > 0 
          ? `修复 ${totalErrors} 个 ESLint 错误` 
          : '代码质量良好'
      });

      if (totalErrors === 0) {
        this.results.summary.passed++;
      } else {
        this.results.summary.failed++;
      }

    } catch (error) {
      this.results.details.push({
        type: 'code_quality',
        status: 'warning',
        error: 'ESLint 检查失败',
        recommendation: '安装并配置 ESLint'
      });
      this.results.summary.warnings++;
    }
  }

  async checkSecurityHeaders() {
    console.log('🛡️ 检查安全头部...');
    
    // 检查是否存在安全配置文件
    const securityConfigPath = path.join(__dirname, '..', 'security-config.js');
    
    if (fs.existsSync(securityConfigPath)) {
      this.results.details.push({
        type: 'security_headers',
        status: 'passed',
        details: '安全配置文件已存在',
        recommendation: '配置已在 security-config.js 中设置'
      });
      this.results.summary.passed++;
    } else {
      this.results.details.push({
        type: 'security_headers',
        status: 'failed',
        details: '缺少安全配置文件',
        recommendation: '创建 security-config.js 文件'
      });
      this.results.summary.failed++;
    }
  }

  async scanFilePermissions() {
    console.log('🔐 检查文件权限...');
    
    const sensitiveFiles = [
      '.env',
      '.env.local',
      '.env.production',
      'package.json',
      'vite.config.js',
      'security-config.js'
    ];

    const permissionIssues = [];

    sensitiveFiles.forEach(file => {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const mode = stats.mode & parseInt('777', 8);
        
        // 检查是否过于开放（组和其他用户可写）
        if (mode & parseInt('022', 8)) {
          permissionIssues.push({
            file,
            mode: mode.toString(8),
            issue: '文件权限过于开放'
          });
        }
      }
    });

    this.results.details.push({
      type: 'file_permissions',
      status: permissionIssues.length === 0 ? 'passed' : 'warning',
      issues: permissionIssues,
      recommendation: permissionIssues.length > 0 
        ? '使用 chmod 修复文件权限' 
        : '文件权限配置正确'
    });

    if (permissionIssues.length === 0) {
      this.results.summary.passed++;
    } else {
      this.results.summary.warnings++;
    }
  }

  async checkEnvironmentVariables() {
    console.log('🔧 检查环境变量...');
    
    const requiredEnvVars = [
      'NODE_ENV',
      'VITE_OPENROUTER_API_KEY'
    ];

    const optionalEnvVars = [
      'VITE_SENTRY_DSN',
      'VITE_GA_TRACKING_ID',
      'SENTRY_AUTH_TOKEN'
    ];

    const missingRequired = requiredEnvVars.filter(env => !process.env[env]);
    const missingOptional = optionalEnvVars.filter(env => !process.env[env]);

    this.results.details.push({
      type: 'environment_variables',
      status: missingRequired.length === 0 ? 'passed' : 'failed',
      missing: {
        required: missingRequired,
        optional: missingOptional
      },
      recommendation: missingRequired.length > 0 
        ? `设置必需的环境变量: ${missingRequired.join(', ')}` 
        : '环境变量配置正确'
    });

    if (missingRequired.length === 0) {
      this.results.summary.passed++;
    } else {
      this.results.summary.failed++;
    }
  }

  async scanForVulnerabilities() {
    console.log('🐛 扫描已知漏洞...');
    
    // 检查常见漏洞模式
    const vulnerabilityPatterns = [
      {
        name: 'XSS 漏洞',
        pattern: /innerHTML\s*=|document\.write|eval\s*\(/gi,
        severity: 'high'
      },
      {
        name: 'SQL 注入风险',
        pattern: /query\s*\(\s*["'].*\$\{.*\}.*["']\s*\)/gi,
        severity: 'high'
      },
      {
        name: '路径遍历',
        pattern: /\.\.\/|\.\.\\/gi,
        severity: 'medium'
      }
    ];

    const filesToScan = this.getFilesToScan();
    let vulnerabilities = [];

    filesToScan.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        vulnerabilityPatterns.forEach(({ name, pattern, severity }) => {
          const matches = content.match(pattern);
          if (matches) {
            vulnerabilities.push({
              file,
              vulnerability: name,
              severity,
              matches: matches.length
            });
          }
        });
      } catch (error) {
        // 跳过无法读取的文件
      }
    });

    this.results.details.push({
      type: 'vulnerability_scan',
      status: vulnerabilities.length === 0 ? 'passed' : 'failed',
      findings: vulnerabilities,
      recommendation: vulnerabilities.length > 0 
        ? '发现潜在漏洞，请检查并修复' 
        : '未发现已知漏洞'
    });

    if (vulnerabilities.length === 0) {
      this.results.summary.passed++;
    } else {
      this.results.summary.failed++;
    }
  }

  getFilesToScan() {
    const extensions = ['.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.json'];
    const files = [];
    
    const scanDir = (dir) => {
      try {
        const items = fs.readdirSync(dir);
        items.forEach(item => {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            if (!['node_modules', '.git', 'dist', 'coverage'].includes(item)) {
              scanDir(fullPath);
            }
          } else {
            if (extensions.some(ext => fullPath.endsWith(ext))) {
              files.push(fullPath);
            }
          }
        });
      } catch (error) {
        // 跳过无法访问的目录
      }
    };

    scanDir(path.join(__dirname, '..'));
    return files;
  }

  generateReport() {
    const reportPath = path.join(__dirname, '..', 'security-report.json');
    
    console.log('\n📊 安全扫描结果:');
    console.log('==================');
    console.log(`✅ 通过: ${this.results.summary.passed}`);
    console.log(`❌ 失败: ${this.results.summary.failed}`);
    console.log(`⚠️  警告: ${this.results.summary.warnings}`);
    
    if (this.results.summary.failed > 0) {
      console.log('\n🔴 需要立即处理的问题:');
      this.results.details
        .filter(item => item.status === 'failed')
        .forEach(item => {
          console.log(`  - ${item.type}: ${item.recommendation}`);
        });
    }

    if (this.results.summary.warnings > 0) {
      console.log('\n🟡 建议处理的问题:');
      this.results.details
        .filter(item => item.status === 'warning')
        .forEach(item => {
          console.log(`  - ${item.type}: ${item.recommendation}`);
        });
    }

    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 详细报告已保存: ${reportPath}`);

    // 根据结果设置退出码
    process.exit(this.results.summary.failed > 0 ? 1 : 0);
  }
}

// CLI 接口
if (require.main === module) {
  const scanner = new SecurityScanner();
  scanner.runFullScan();
}

module.exports = SecurityScanner;