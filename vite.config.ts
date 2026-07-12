import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        stats: resolve(__dirname, 'stats.html'),
        settings: resolve(__dirname, 'settings.html'),
        categories: resolve(__dirname, 'categories.html'),
      },
    },
  },
})
