import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    allowedHosts: ['127.0.0.1'],
    proxy: {
      '/api/spotify-lyrics': {
        target: 'https://spclient.wg.spotify.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/spotify-lyrics/, '')
      }
    }
  }
})