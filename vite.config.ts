import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@':           resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@hooks':      resolve(__dirname, 'src/hooks'),
      '@utils':      resolve(__dirname, 'src/utils'),
      '@store':      resolve(__dirname, 'src/store'),
      '@types':      resolve(__dirname, 'src/types'),
      '@constants':  resolve(__dirname, 'src/constants'),
      '@config':     resolve(__dirname, 'src/config'),
      '@services':   resolve(__dirname, 'src/services'),
      '@assets':     resolve(__dirname, 'src/assets'),
    },
  },
})
