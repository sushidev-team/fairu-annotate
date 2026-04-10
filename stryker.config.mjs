/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: 'vitest',
  checkers: ['typescript'],
  tsconfigFile: 'tsconfig.json',
  mutate: [
    'src/utils/**/*.ts',
    'src/stores/**/*.ts',
    'src/hooks/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.stories.tsx',
    '!src/test-setup.ts',
    '!src/stores/provider.tsx',
  ],
  reporters: ['html', 'clear-text', 'progress'],
  thresholds: {
    high: 80,
    low: 60,
    break: 50,
  },
  timeoutMS: 60000,
}
