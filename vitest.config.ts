import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    root: __dirname,
    include: ['test/unit/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    testTimeout: 1000 * 29,
    globals: true,
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
