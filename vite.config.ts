import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173 },
  // three.js + drei are large by nature; the scene is a single page
  build: { chunkSizeWarningLimit: 2500 },
})
