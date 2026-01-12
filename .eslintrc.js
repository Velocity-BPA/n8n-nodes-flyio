module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'n8n-nodes-base'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:n8n-nodes-base/nodes',
    'plugin:n8n-nodes-base/credentials',
    'prettier',
  ],
  env: {
    node: true,
    es2021: true,
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '*.js',
    '!.eslintrc.js',
    'gulpfile.js',
    'test/',
  ],
  rules: {
    // TypeScript specific
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    
    // n8n specific overrides
    'n8n-nodes-base/node-param-description-missing-final-period': 'off',
    'n8n-nodes-base/node-param-placeholder-miscased-id': 'off',
    'n8n-nodes-base/node-param-description-excess-final-period': 'off',
    'n8n-nodes-base/cred-class-field-documentation-url-not-http-url': 'off',
    
    // General
    'no-console': 'warn',
    'prefer-const': 'error',
    'eqeqeq': ['error', 'always'],
  },
  overrides: [
    {
      files: ['**/*.test.ts'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
