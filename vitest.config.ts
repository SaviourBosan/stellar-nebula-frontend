import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

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
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/**/*.d.ts', 'src/main.tsx'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})
