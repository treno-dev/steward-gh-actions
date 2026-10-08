import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vite-plus'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  ssr: {
    // A job runs dist/index.js without installing anything, so the dependencies are in it.
    noExternal: true,
  },
  build: {
    ssr: 'src/main.js',
    target: 'node24',
    minify: false,
    rollupOptions: {
      output: { entryFileNames: 'index.js' },
    },
  },
})
