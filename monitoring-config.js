/**
 * 监控和日志系统配置
 * 功能：错误监控、性能监控、用户行为分析
 */

// Sentry 配置
export const sentryConfig = {
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_APP_ENV,
  release: `text-visualizer@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
  integrations: [
    new Sentry.BrowserTracing({
      routingInstrumentation: Sentry.reactRouterV6Instrumentation(
        React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes
      ),
    }),
  ],
  tracesSampleRate: import.meta.env.VITE_APP_ENV === 'production' ? 0.1 : 1.0,
  beforeSend(event, hint) {
    // 过滤敏感信息
    if (event.exception) {
      const error = hint.originalException;
      if (error && error.message && error.message.includes('API_KEY')) {
        return null;
      }
    }
    return event;
  }
};

// Google Analytics 配置
export const gaConfig = {
  trackingId: import.meta.env.VITE_GA_TRACKING_ID,
  enabled: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  debug: import.meta.env.VITE_APP_ENV === 'development'
};

// 性能监控配置
export const performanceConfig = {
  webVitals: {
    enabled: import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true',
    thresholds: {
      FCP: 1800,
      LCP: 2500,
      FID: 100,
      CLS: 0.1,
      TTFB: 600
    }
  },
  apiMonitoring: {
    enabled: true,
    slowRequestThreshold: 2000,
    errorRateThreshold: 0.05
  }
};

// 自定义指标收集
export const customMetrics = {
  // 用户交互指标
  userInteractions: {
    promptGeneration: 'prompt_generation_time',
    templateSelection: 'template_selection_time',
    exportOperation: 'export_operation_time'
  },
  
  // 业务指标
  businessMetrics: {
    successfulGenerations: 'successful_generations',
    failedGenerations: 'failed_generations',
    averageResponseTime: 'average_response_time'
  }
};

// 日志级别配置
export const logLevels = {
  development: 'debug',
  staging: 'info',
  production: 'warn'
};

// 日志收集配置
export const loggingConfig = {
  console: {
    enabled: true,
    level: logLevels[import.meta.env.VITE_APP_ENV] || 'info'
  },
  remote: {
    enabled: import.meta.env.VITE_APP_ENV === 'production',
    endpoint: '/api/logs',
    batchSize: 50,
    flushInterval: 30000
  }
};