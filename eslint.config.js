import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      '**/node_modules',
      '**/.next',
      '**/out',
      '**/jest.config.js',
      '**/jest.setup.js',
    ],
  },

  js.configs.recommended,

  {
    plugins: {
      '@typescript-eslint': tsPlugin,
      '@next/next': nextPlugin, // include Next plugin here
    },

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },

    rules: {
      'no-unused-vars': 'off',
      'no-control-regex': 'off',
      'import/no-anonymous-default-export': 'off',

      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-empty-interface': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-inferrable-types': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': 'warn',

      // Optional: Next.js plugin recommended rules
      '@next/next/no-html-link-for-pages': 'warn',
      '@next/next/no-img-element': 'warn',
    },
  },
];
