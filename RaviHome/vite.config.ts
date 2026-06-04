/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy(),
     viteStaticCopy({
      targets: [
        {
          src: 'node_modules/sql.js/dist/sql-wasm.wasm',
          dest: 'assets' // This copies the file into the public/assets folder on build and serve
        }
      ]
    })
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})
