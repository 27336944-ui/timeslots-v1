module.exports = [
  {
    ignores: ['archive-v1/', 'server/dist/', 'src/miniprogram_npm/', '**/node_modules/', 'server/coverage/'],
  },
  {
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
];
