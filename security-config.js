/**
 * 安全部署配置
 * 包含 CSP、安全头部、身份验证等安全配置
 */

const securityConfig = {
  // 内容安全策略 (CSP)
  contentSecurityPolicy: {
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // 用于内联脚本（生产环境应禁用）
        'https://cdn.jsdelivr.net',
        'https://www.googletagmanager.com',
        'https://www.google-analytics.com',
        'https://browser.sentry-cdn.com'
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com'
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com'
      ],
      'img-src': [
        "'self'",
        'data:',
        'https:',
        'http:'
      ],
      'connect-src': [
        "'self'",
        'https://api.openrouter.ai',
        'https://*.sentry.io',
        'https://www.google-analytics.com',
        'https://vitals.vercel-insights.com'
      ],
      'media-src': ["'self'"],
      'object-src': ["'none'"],
      'child-src': ["'none'"],
      'worker-src': ["'self'"],
      'manifest-src': ["'self'"],
      'frame-ancestors': ["'none'"],
      'form-action': ["'self'"],
      'base-uri': ["'self'"],
      'upgrade-insecure-requests': []
    }
  },

  // 安全头部配置
  securityHeaders: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'cross-origin'
  },

  // API 安全配置
  apiSecurity: {
    rateLimiting: {
      windowMs: 15 * 60 * 1000, // 15 分钟
      maxRequests: 100,
      message: '请求过于频繁，请稍后再试',
      standardHeaders: true,
      legacyHeaders: false
    },
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    },
    helmet: {
      contentSecurityPolicy: false, // 使用自定义 CSP
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: true,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      dnsPrefetchControl: true,
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      ieNoOpen: true,
      noSniff: true,
      originAgentCluster: true,
      permittedCrossDomainPolicies: false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: true
    }
  },

  // 身份验证配置
  auth: {
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: '1h',
      refreshExpiresIn: '7d',
      algorithm: 'HS256'
    },
    session: {
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 小时
        sameSite: 'strict'
      }
    },
    oauth: {
      google: {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL
      },
      github: {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL
      }
    }
  },

  // 敏感数据保护
  dataProtection: {
    encryption: {
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      ivLength: 16,
      tagLength: 16
    },
    hashing: {
      algorithm: 'sha256',
      saltLength: 32,
      iterations: 100000
    },
    masking: {
      email: (email) => {
        const [username, domain] = email.split('@');
        const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
        return `${maskedUsername}@${domain}`;
      },
      phone: (phone) => {
        return phone.replace(/\d(?=\d{4})/g, '*');
      }
    }
  },

  // 环境安全配置
  environment: {
    production: {
      debug: false,
      logLevel: 'warn',
      enableCSPReportOnly: false,
      enableSecurityHeaders: true,
      enableRateLimiting: true,
      enableHTTPSRedirect: true
    },
    staging: {
      debug: true,
      logLevel: 'info',
      enableCSPReportOnly: true,
      enableSecurityHeaders: true,
      enableRateLimiting: true,
      enableHTTPSRedirect: true
    },
    development: {
      debug: true,
      logLevel: 'debug',
      enableCSPReportOnly: true,
      enableSecurityHeaders: false,
      enableRateLimiting: false,
      enableHTTPSRedirect: false
    }
  },

  // 监控和告警
  monitoring: {
    securityEvents: {
      loginAttempts: true,
      failedAuthentications: true,
      suspiciousRequests: true,
      rateLimitViolations: true
    },
    alerts: {
      webhook: process.env.SECURITY_WEBHOOK_URL,
      email: process.env.SECURITY_EMAIL,
      slack: process.env.SECURITY_SLACK_WEBHOOK
    },
    thresholds: {
      failedLoginAttempts: 5,
      suspiciousRequestsPerMinute: 10,
      rateLimitViolations: 3
    }
  },

  // 依赖安全检查
  dependencies: {
    audit: {
      level: 'moderate',
      productionOnly: true,
      excludePackages: []
    },
    licenses: {
      allowed: ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'ISC'],
      forbidden: ['GPL-3.0', 'AGPL-3.0', 'LGPL-3.0']
    }
  }
};

// 安全工具函数
export const securityUtils = {
  // 生成安全随机字符串
  generateRandomString: (length = 32) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // 验证输入
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    return input
      .replace(/[\u0000-\u001f\u007f-\u009f]/g, '')
      .replace(/[\u2028\u2029]/g, '')
      .trim();
  },

  // 验证文件类型
  validateFileType: (filename, allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp']) => {
    const ext = path.extname(filename).toLowerCase();
    return allowedTypes.includes(ext);
  },

  // 验证文件大小
  validateFileSize: (size, maxSize = 5 * 1024 * 1024) => {
    return size <= maxSize;
  },

  // 创建安全的文件名
  createSafeFilename: (originalName) => {
    const timestamp = Date.now();
    const randomString = securityUtils.generateRandomString(8);
    const extension = path.extname(originalName);
    return `${timestamp}-${randomString}${extension}`;
  }
};

export default securityConfig;