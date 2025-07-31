/**
 * Web Vitals 性能监控服务
 * 用于收集和报告 Core Web Vitals
 */

import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

class WebVitalsService {
  constructor() {
    this.metrics = {};
    this.thresholds = {
      CLS: { good: 0.1, needsImprovement: 0.25 },
      FID: { good: 100, needsImprovement: 300 },
      FCP: { good: 1800, needsImprovement: 3000 },
      LCP: { good: 2500, needsImprovement: 4000 },
      TTFB: { good: 800, needsImprovement: 1800 }
    };
    this.init();
  }

  init() {
    // 收集所有 Web Vitals
    getCLS(this.handleMetric.bind(this, 'CLS'));
    getFID(this.handleMetric.bind(this, 'FID'));
    getFCP(this.handleMetric.bind(this, 'FCP'));
    getLCP(this.handleMetric.bind(this, 'LCP'));
    getTTFB(this.handleMetric.bind(this, 'TTFB'));

    // 监听页面生命周期事件
    this.addPageLifecycleListeners();
  }

  handleMetric(name, metric) {
    this.metrics[name] = metric;
    
    const rating = this.getRating(name, metric.value);
    
    // 发送到监控系统
    this.sendToAnalytics({
      name,
      value: metric.value,
      rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType
    });

    // 如果性能不佳，触发警报
    if (rating === 'needs-improvement' || rating === 'poor') {
      this.triggerPerformanceAlert(name, metric.value, rating);
    }
  }

  getRating(name, value) {
    const threshold = this.thresholds[name];
    if (!threshold) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  sendToAnalytics(data) {
    // 发送到 Google Analytics
    if (window.gtag) {
      window.gtag('event', data.name, {
        value: Math.round(data.value),
        metric_id: data.id,
        metric_value: data.value,
        metric_delta: data.delta,
        navigation_type: data.navigationType
      });
    }

    // 发送到自定义监控系统
    if (window.monitoringService) {
      window.monitoringService.logMetric('web-vitals', data);
    }

    // 发送到性能监控 API
    this.sendToPerformanceAPI(data);
  }

  sendToPerformanceAPI(data) {
    // 使用 sendBeacon 确保数据可靠传输
    const blob = new Blob([JSON.stringify({
      type: 'web-vitals',
      data,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    })], { type: 'application/json' });

    navigator.sendBeacon('/api/web-vitals', blob);
  }

  triggerPerformanceAlert(metricName, value, rating) {
    console.warn(`Performance Alert: ${metricName} is ${rating} (${value})`);
    
    // 可以在这里集成外部告警系统
    if (window.Sentry) {
      window.Sentry.captureMessage(`Poor Web Vital: ${metricName}`, {
        level: 'warning',
        tags: {
          metric: metricName,
          rating,
          value
        }
      });
    }
  }

  addPageLifecycleListeners() {
    // 页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flushMetrics();
      }
    });

    // 页面卸载
    window.addEventListener('beforeunload', () => {
      this.flushMetrics();
    });

    // 页面冻结（Safari）
    document.addEventListener('freeze', () => {
      this.flushMetrics();
    });
  }

  flushMetrics() {
    // 确保在页面卸载前发送所有指标
    if (navigator.sendBeacon && Object.keys(this.metrics).length > 0) {
      const blob = new Blob([JSON.stringify({
        type: 'web-vitals-batch',
        data: this.metrics,
        timestamp: Date.now(),
        url: window.location.href
      })], { type: 'application/json' });

      navigator.sendBeacon('/api/web-vitals-batch', blob);
    }
  }

  // 获取当前性能报告
  getPerformanceReport() {
    return {
      metrics: this.metrics,
      summary: this.generateSummary(),
      recommendations: this.generateRecommendations()
    };
  }

  generateSummary() {
    const summary = {
      good: 0,
      'needs-improvement': 0,
      poor: 0
    };

    Object.entries(this.metrics).forEach(([name, metric]) => {
      const rating = this.getRating(name, metric.value);
      summary[rating]++;
    });

    return summary;
  }

  generateRecommendations() {
    const recommendations = [];

    Object.entries(this.metrics).forEach(([name, metric]) => {
      const rating = this.getRating(name, metric.value);
      
      if (rating === 'needs-improvement' || rating === 'poor') {
        switch (name) {
          case 'LCP':
            recommendations.push('优化最大内容绘制：压缩图片、使用现代图片格式、实施懒加载');
            break;
          case 'FID':
            recommendations.push('优化首次输入延迟：减少 JavaScript 执行时间、使用 Web Workers');
            break;
          case 'CLS':
            recommendations.push('优化累积布局偏移：为图片和广告预留空间、避免动态内容插入');
            break;
          case 'FCP':
            recommendations.push('优化首次内容绘制：减少关键资源大小、使用 CDN、启用压缩');
            break;
          case 'TTFB':
            recommendations.push('优化首字节时间：使用 CDN、启用服务器压缩、优化服务器响应');
            break;
        }
      }
    });

    return recommendations;
  }
}

// 创建全局实例
export const webVitalsService = new WebVitalsService();

// 兼容性检查
if (typeof window !== 'undefined' && !window.PerformanceObserver) {
  console.warn('Web Vitals: PerformanceObserver not supported');
}

// 导出用于测试的函数
export const getPerformanceReport = () => webVitalsService.getPerformanceReport();