/**
 * 监控服务 - 统一的错误、性能、行为监控
 */

class MonitoringService {
  constructor() {
    this.isInitialized = false;
    this.metrics = new Map();
    this.init();
  }

  init() {
    if (this.isInitialized) return;
    
    this.setupErrorHandling();
    this.setupPerformanceObserver();
    this.setupConsoleCapture();
    
    this.isInitialized = true;
  }

  // 错误监控
  setupErrorHandling() {
    window.addEventListener('error', (event) => {
      this.logError('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.logError('unhandled_promise_rejection', {
        reason: event.reason,
        stack: event.reason?.stack
      });
    });
  }

  // 性能监控
  setupPerformanceObserver() {
    if (!window.PerformanceObserver) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        this.logMetric('performance_entry', {
          name: entry.name,
          type: entry.entryType,
          duration: entry.duration,
          startTime: entry.startTime,
          transferSize: entry.transferSize,
          encodedBodySize: entry.encodedBodySize
        });
      });
    });

    observer.observe({ entryTypes: ['navigation', 'resource', 'paint', 'measure'] });
  }

  // 控制台捕获
  setupConsoleCapture() {
    const originalConsole = { ...console };
    
    ['log', 'warn', 'error', 'info'].forEach(method => {
      console[method] = (...args) => {
        originalConsole[method](...args);
        this.logConsole(method, args);
      };
    });
  }

  // 记录错误
  logError(type, data) {
    const errorData = {
      type,
      data,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId()
    };

    // 发送到监控系统
    this.sendToRemote('error', errorData);
    
    // 本地存储作为备份
    this.storeLocally('errors', errorData);
  }

  // 记录指标
  logMetric(name, value, tags = {}) {
    const metricData = {
      name,
      value,
      tags,
      timestamp: Date.now(),
      userId: this.getUserId()
    };

    this.sendToRemote('metric', metricData);
    this.storeLocally('metrics', metricData);
  }

  // 记录用户行为
  trackUserAction(action, properties = {}) {
    const actionData = {
      action,
      properties,
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      userId: this.getUserId(),
      url: window.location.href
    };

    this.sendToRemote('action', actionData);
    this.storeLocally('actions', actionData);
  }

  // 记录 API 调用
  trackApiCall(endpoint, method, duration, status, error = null) {
    this.logMetric('api_call', {
      endpoint,
      method,
      duration,
      status,
      error: error?.message
    }, {
      endpoint,
      status: status.toString()
    });
  }

  // 性能指标
  measurePerformance(name, fn) {
    const start = performance.now();
    const result = fn();
    
    if (result instanceof Promise) {
      return result.then(value => {
        const duration = performance.now() - start;
        this.logMetric(`${name}_duration`, duration);
        return value;
      }).catch(error => {
        const duration = performance.now() - start;
        this.logMetric(`${name}_failed_duration`, duration);
        throw error;
      });
    } else {
      const duration = performance.now() - start;
      this.logMetric(`${name}_duration`, duration);
      return result;
    }
  }

  // 获取用户 ID
  getUserId() {
    let userId = localStorage.getItem('user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('user_id', userId);
    }
    return userId;
  }

  // 获取会话 ID
  getSessionId() {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  // 发送到远程服务
  async sendToRemote(type, data) {
    // 如果处于离线状态，存储到本地队列
    if (!navigator.onLine) {
      this.queueForLater(type, data);
      return;
    }

    try {
      await fetch('/api/monitoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, data }),
        keepalive: true
      });
    } catch (error) {
      console.warn('Failed to send monitoring data:', error);
      this.queueForLater(type, data);
    }
  }

  // 本地存储
  storeLocally(type, data) {
    const key = `monitoring_${type}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push(data);
    
    // 限制存储大小
    if (existing.length > 1000) {
      existing.splice(0, existing.length - 1000);
    }
    
    localStorage.setItem(key, JSON.stringify(existing));
  }

  // 队列处理
  queueForLater(type, data) {
    const queue = JSON.parse(localStorage.getItem('monitoring_queue') || '[]');
    queue.push({ type, data, timestamp: Date.now() });
    localStorage.setItem('monitoring_queue', JSON.stringify(queue));
  }

  // 处理离线队列
  async processOfflineQueue() {
    const queue = JSON.parse(localStorage.getItem('monitoring_queue') || '[]');
    if (queue.length === 0) return;

    const items = queue.splice(0, 50); // 分批处理
    localStorage.setItem('monitoring_queue', JSON.stringify(queue));

    const promises = items.map(item => this.sendToRemote(item.type, item.data));
    
    try {
      await Promise.allSettled(promises);
    } catch (error) {
      // 如果失败，重新加入队列
      const currentQueue = JSON.parse(localStorage.getItem('monitoring_queue') || '[]');
      currentQueue.unshift(...items);
      localStorage.setItem('monitoring_queue', JSON.stringify(currentQueue));
    }
  }

  // 获取监控统计
  getStats() {
    return {
      errors: JSON.parse(localStorage.getItem('monitoring_errors') || '[]').length,
      metrics: JSON.parse(localStorage.getItem('monitoring_metrics') || '[]').length,
      actions: JSON.parse(localStorage.getItem('monitoring_actions') || '[]').length,
      queueSize: JSON.parse(localStorage.getItem('monitoring_queue') || '[]').length
    };
  }
}

// 创建全局实例
export const monitoringService = new MonitoringService();

// 自动处理离线队列
window.addEventListener('online', () => {
  monitoringService.processOfflineQueue();
});

// 页面卸载时发送剩余数据
window.addEventListener('beforeunload', () => {
  monitoringService.processOfflineQueue();
});

// 简化使用的工具函数
export const track = monitoringService.trackUserAction.bind(monitoringService);
export const measure = monitoringService.measurePerformance.bind(monitoringService);
export const logError = monitoringService.logError.bind(monitoringService);