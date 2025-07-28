import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  base: '/',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // 生产环境关闭sourcemap
    // 简化配置，专注于基本功能
    rollupOptions: {
      output: {
        // 简化代码分割
        manualChunks: {
          'codemirror': ['codemirror'],
          'vendor': ['axios']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    // 简化压缩配置
    minify: 'terser'
  },
  // 确保 Markdown 文件被正确处理
  assetsInclude: ['**/*.md'],
  publicDir: 'prompts'
})