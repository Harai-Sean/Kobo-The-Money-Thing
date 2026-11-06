import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// One config file serves the dev server, the production build AND the test runner.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Never inline files as data: URLs. Our security policy only allows fonts from our own server.
  build: { assetsInlineLimit: 0 },
  test: {
    environment: 'jsdom', // a fake browser, so React components can render in tests
    setupFiles: ['./src/test/setup.ts'],
    css: false, // tests check behaviour, not styling, so skip CSS processing
  },
})
