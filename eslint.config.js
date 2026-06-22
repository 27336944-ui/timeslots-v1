const tseslint = require('typescript-eslint');

module.exports = [
  {
    ignores: ['archive-v1/', 'server/dist/', 'src/miniprogram_npm/', '**/node_modules/', 'server/coverage/'],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['eslint.config.js', 'scripts/**/*.js', 'server/scripts/**/*.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': 'off',
    },
  },
  {
    files: ['**/*.spec.ts', 'src/behaviors/**', 'src/pages/schedule/index.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
