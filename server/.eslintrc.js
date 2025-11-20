module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'off',
    'no-unused-vars': 'off',
    'no-undef': 'off',
  },
  env: {
    node: true,
    jest: true,
    es6: true,
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'coverage/',
    'src/__tests__/',
  ],
};
