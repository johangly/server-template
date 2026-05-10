import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.js'],
    setupFiles: ['./tests/setup.js'],
    testTimeout: 30000,
    server: {
      deps: {
        external: ['supertest'],
      },
    },
  },
  esbuild: {
    platform: 'node',
    target: 'node18',
    format: 'esm',
  },
  ssr: {
    noExternal: [/^(?!supertest).*$/],
  },
});