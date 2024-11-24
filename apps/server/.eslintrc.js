/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  plugins: ['@typescript-eslint'],
  extends: [
    '@repo/eslint-config/library.js',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  rules: {
    'no-redeclare': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error'],
  },
}
