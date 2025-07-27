/**
 * 智能缓存管理器
 * 实现多层缓存策略，包括内存缓存、localStorage和sessionStorage
 */

class CacheManager {
    constructor() {
        this.memoryCache = new Map();
        this.cacheStats = {
            hits: 0,
            misses: 0,
            sets: 0
        };
        
        // 缓存配置
        this.config = {
            // 内存缓存最大条目数
            maxMemoryItems: 100,
            // localStorage缓存键前缀
            storagePrefix: 'tv_cache_',
            // 缓存过期时间 (毫秒)
            defaultTTL: 30 * 60 * 1000, // 30分钟
            // 长期缓存时间
            longTermTTL: 24 * 60 * 60 * 1000, // 24小时
        };
    }

    /**
     * 设置缓存项
     */
    set(key, value, options = {}) {
        const {
            ttl = this.config.defaultTTL,
            storage = 'memory', // memory, localStorage, sessionStorage
            serialize = true
        } = options;

        const cacheItem = {
            value: serialize ? JSON.stringify(value) : value,
            timestamp: Date.now(),
            ttl,
            serialized: serialize
        };

        try {
            switch (storage) {
                case 'memory':
                    this.setMemoryCache(key, cacheItem);
                    break;
                case 'localStorage':
                    this.setStorageCache(key, cacheItem, localStorage);
                    break;
                case 'sessionStorage':
                    this.setStorageCache(key, cacheItem, sessionStorage);
                    break;
                default:
                    this.setMemoryCache(key, cacheItem);
            }

            this.cacheStats.sets++;
            console.log(`📦 缓存设置: ${key} (${storage})`);
        } catch (error) {
            console.warn('缓存设置失败:', error);
        }
    }

    /**
     * 获取缓存项
     */
    get(key, storage = 'memory') {
        try {
            let cacheItem;

            switch (storage) {
                case 'memory':
                    cacheItem = this.getMemoryCache(key);
                    break;
                case 'localStorage':
                    cacheItem = this.getStorageCache(key, localStorage);
                    break;
                case 'sessionStorage':
                    cacheItem = this.getStorageCache(key, sessionStorage);
                    break;
                case 'auto':
                    // 自动查找：memory -> sessionStorage -> localStorage
                    cacheItem = this.getMemoryCache(key) ||
                              this.getStorageCache(key, sessionStorage) ||
                              this.getStorageCache(key, localStorage);
                    break;
                default:
                    cacheItem = this.getMemoryCache(key);
            }

            if (cacheItem) {
                // 检查是否过期
                if (this.isExpired(cacheItem)) {
                    this.delete(key, storage);
                    this.cacheStats.misses++;
                    return null;
                }

                this.cacheStats.hits++;
                const value = cacheItem.serialized ? 
                    JSON.parse(cacheItem.value) : cacheItem.value;
                
                console.log(`📦 缓存命中: ${key} (${storage})`);
                return value;
            }

            this.cacheStats.misses++;
            return null;
        } catch (error) {
            console.warn('缓存获取失败:', error);
            this.cacheStats.misses++;
            return null;
        }
    }

    /**
     * 删除缓存项
     */
    delete(key, storage = 'memory') {
        try {
            switch (storage) {
                case 'memory':
                    this.memoryCache.delete(key);
                    break;
                case 'localStorage':
                    localStorage.removeItem(this.config.storagePrefix + key);
                    break;
                case 'sessionStorage':
                    sessionStorage.removeItem(this.config.storagePrefix + key);
                    break;
                case 'all':
                    this.memoryCache.delete(key);
                    localStorage.removeItem(this.config.storagePrefix + key);
                    sessionStorage.removeItem(this.config.storagePrefix + key);
                    break;
            }
        } catch (error) {
            console.warn('缓存删除失败:', error);
        }
    }

    /**
     * 清空缓存
     */
    clear(storage = 'memory') {
        try {
            switch (storage) {
                case 'memory':
                    this.memoryCache.clear();
                    break;
                case 'localStorage':
                    this.clearStorageCache(localStorage);
                    break;
                case 'sessionStorage':
                    this.clearStorageCache(sessionStorage);
                    break;
                case 'all':
                    this.memoryCache.clear();
                    this.clearStorageCache(localStorage);
                    this.clearStorageCache(sessionStorage);
                    break;
            }
            console.log(`🗑️ 缓存已清空: ${storage}`);
        } catch (error) {
            console.warn('缓存清空失败:', error);
        }
    }

    /**
     * 内存缓存操作
     */
    setMemoryCache(key, cacheItem) {
        // LRU策略：如果超过最大数量，删除最旧的
        if (this.memoryCache.size >= this.config.maxMemoryItems) {
            const firstKey = this.memoryCache.keys().next().value;
            this.memoryCache.delete(firstKey);
        }
        
        this.memoryCache.set(key, cacheItem);
    }

    getMemoryCache(key) {
        return this.memoryCache.get(key);
    }

    /**
     * 存储缓存操作
     */
    setStorageCache(key, cacheItem, storage) {
        const storageKey = this.config.storagePrefix + key;
        storage.setItem(storageKey, JSON.stringify(cacheItem));
    }

    getStorageCache(key, storage) {
        const storageKey = this.config.storagePrefix + key;
        const item = storage.getItem(storageKey);
        return item ? JSON.parse(item) : null;
    }

    clearStorageCache(storage) {
        const keysToRemove = [];
        for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i);
            if (key && key.startsWith(this.config.storagePrefix)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => storage.removeItem(key));
    }

    /**
     * 检查缓存项是否过期
     */
    isExpired(cacheItem) {
        const now = Date.now();
        return (now - cacheItem.timestamp) > cacheItem.ttl;
    }

    /**
     * 缓存装饰器 - 自动缓存函数结果
     */
    memoize(fn, options = {}) {
        const {
            keyGenerator = (...args) => JSON.stringify(args),
            storage = 'memory',
            ttl = this.config.defaultTTL
        } = options;

        const cache = this;
        
        return async function(...args) {
            const key = keyGenerator(...args);
            
            // 尝试从缓存获取
            let result = cache.get(key, storage);
            if (result !== null) {
                return result;
            }

            // 缓存未命中，执行函数
            try {
                result = await fn.apply(this, args);
                
                // 缓存结果
                cache.set(key, result, { storage, ttl });
                
                return result;
            } catch (error) {
                console.error('函数执行失败:', error);
                throw error;
            }
        };
    }

    /**
     * 预热缓存 - 提前加载常用数据
     */
    async warmup(items) {
        console.log('🔥 开始缓存预热...');
        
        const promises = items.map(async ({ key, loader, options = {} }) => {
            try {
                const data = await loader();
                this.set(key, data, options);
                console.log(`✅ 预热完成: ${key}`);
            } catch (error) {
                console.warn(`⚠️ 预热失败: ${key}`, error);
            }
        });

        await Promise.allSettled(promises);
        console.log('🔥 缓存预热完成');
    }

    /**
     * 定期清理过期缓存
     */
    startCleanupInterval(interval = 5 * 60 * 1000) { // 5分钟
        setInterval(() => {
            this.cleanupExpired();
        }, interval);
    }

    /**
     * 清理过期缓存
     */
    cleanupExpired() {
        let cleanedCount = 0;

        // 清理内存缓存
        for (const [key, cacheItem] of this.memoryCache.entries()) {
            if (this.isExpired(cacheItem)) {
                this.memoryCache.delete(key);
                cleanedCount++;
            }
        }

        // 清理localStorage
        cleanedCount += this.cleanupExpiredStorage(localStorage);
        
        // 清理sessionStorage
        cleanedCount += this.cleanupExpiredStorage(sessionStorage);

        if (cleanedCount > 0) {
            console.log(`🧹 清理了 ${cleanedCount} 个过期缓存项`);
        }
    }

    cleanupExpiredStorage(storage) {
        let cleanedCount = 0;
        const keysToRemove = [];

        for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i);
            if (key && key.startsWith(this.config.storagePrefix)) {
                try {
                    const item = JSON.parse(storage.getItem(key));
                    if (this.isExpired(item)) {
                        keysToRemove.push(key);
                    }
                } catch (error) {
                    // 解析失败的项目也删除
                    keysToRemove.push(key);
                }
            }
        }

        keysToRemove.forEach(key => {
            storage.removeItem(key);
            cleanedCount++;
        });

        return cleanedCount;
    }

    /**
     * 获取缓存统计信息
     */
    getStats() {
        const hitRate = this.cacheStats.hits + this.cacheStats.misses > 0 ?
            (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100).toFixed(2) :
            0;

        return {
            ...this.cacheStats,
            hitRate: `${hitRate}%`,
            memorySize: this.memoryCache.size,
            memoryLimit: this.config.maxMemoryItems
        };
    }
}

// 创建全局缓存管理器实例
export const cacheManager = new CacheManager();

// 启动定期清理
cacheManager.startCleanupInterval();

// 导出常用的缓存装饰器
export function memoize(options) {
    return function(target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = cacheManager.memoize(originalMethod, options);
        return descriptor;
    };
}

console.log('📦 缓存管理器已启动');