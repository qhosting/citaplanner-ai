import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.js', 'tests/**/*.test.ts'],
        setupFiles: ['./tests/setup.ts'],
    },
});
