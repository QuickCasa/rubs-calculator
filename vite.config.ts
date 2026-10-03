import { defineConfig } from 'vitest/config'

/**
 * Vite builds the calculator page in app/ into site/ for GitHub Pages. The
 * library itself is built by tsc, so it ships as plain modules with types.
 *
 * The same config drives the tests. They run in Node by default, and a test
 * that needs a DOM opts in with a vitest-environment comment.
 */
const config = defineConfig({
  root: 'app',
  base: './',
  build: {
    outDir: '../site',
    emptyOutDir: true,
  },
  test: {
    root: '.',
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
})

export default config
