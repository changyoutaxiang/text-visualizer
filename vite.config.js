import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    // 性能优化配置
    rollupOptions: {
      output: {
        // 手动代码分割
        manualChunks: {
          // CodeMirror相关依赖单独分包
          'codemirror': [
            'codemirror',
            '@codemirror/basic-setup',
            '@codemirror/lang-html', 
            '@codemirror/lang-xml',
            '@codemirror/state',
            '@codemirror/theme-one-dark',
            '@codemirror/view'
          ],
          // Axios单独分包
          'vendor': ['axios']
        },
        // 优化文件名
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    // 提高警告阈值至800KB
    chunkSizeWarningLimit: 800,
    // 启用CSS代码分割
    cssCodeSplit: true,
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // 生产环境移除console
        drop_debugger: true, // 移除debugger
        pure_funcs: ['console.log'] // 移除特定函数调用
      }
    }
  },
  assetsInclude: ['**/*.md'],
  publicDir: 'prompts',
  // 优化依赖预构建
  optimizeDeps: {
    include: ['axios'],
    exclude: ['codemirror'] // CodeMirror改为动态导入
  }
})