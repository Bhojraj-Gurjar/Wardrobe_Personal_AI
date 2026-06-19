const js = require('@eslint/js');
const globals = require('globals');
const prettier = require('eslint-plugin-prettier/recommended');
const babelParser = require('@babel/eslint-parser');

module.exports = [
  js.configs.recommended,
  prettier,
  {
    files: ['**/*.js'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          babelrc: true,
        },
      },
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
  {
    ignores: ['node_modules/**', 'coverage/**', 'dist/**'],
  },
];
