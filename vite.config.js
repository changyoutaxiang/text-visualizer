import { defineConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'
import compression from 'vite-plugin-compression'

export default defineConfig({
  root: '.',
  base: '/',
  server: {
    port: 3000,
    open: true,
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: process.env.NODE_ENV === 'development', // 开发环境开启，生产环境关闭
    rollupOptions: {
      output: {
        // 优化代码分割策略
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // 第三方库分组
            if (id.includes('@codemirror')) return 'codemirror'
            if (id.includes('axios')) return 'vendor'
            if (id.includes('node_modules')) return 'vendor'
            return 'vendor'
          }
          // 按功能模块分割
          if (id.includes('/components/')) return 'components'
          if (id.includes('/services/')) return 'services'
        },
        // 优化缓存：为静态资源添加哈希
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 500,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: process.env.NODE_ENV === 'production'
      }
    },
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 启用资源内联大小限制
    assetsInlineLimit: 4096
  },
  plugins: [
    // 生产环境启用 gzip 压缩
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240, // 10KB 以上才压缩
      deleteOriginFile: false
    }),
    // 生产环境启用 brotli 压缩
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240,
      deleteOriginFile: false
    }),
    // 包分析（仅在 ANALYZE=true 时启用）
    process.env.ANALYZE && visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ].filter(Boolean),
  assetsInclude: ['**/*.md'],
  publicDir: 'prompts',
  // 优化解析配置
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  optimizeDeps: {
    include: ['codemirror', 'axios']
  }
})