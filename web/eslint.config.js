import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const typescriptEslint = require('@typescript-eslint/eslint-plugin');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: [
      '**/node_modules',
      '**/jest.config.js',
      '**/jest.setup.js',
      '**/generated/**',
      '**/.next',
      '**/out',
    ],
  },
  ...compat.extends(
    'eslint:recommended',
    'next',
    'plugin:@typescript-eslint/recommended',
  ),

  {
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },

    languageOptions: {
      parser: tsParser,
    },

    rules: {
      'no-unused-vars': 'off',
      'no-control-regex': 'off',
      'import/no-anonymous-default-export': 'off',
      '@typescript-eslint/no-unused-vars': ['off'],
      '@typescript-eslint/no-empty-interface': ['warn'],
      '@typescript-eslint/ban-ts-comment': ['warn'],
      '@typescript-eslint/no-inferrable-types': ['warn'],
      '@typescript-eslint/no-explicit-any': ['off'],
      '@typescript-eslint/no-unused-expressions': ['warn'],
    },
  },
];
