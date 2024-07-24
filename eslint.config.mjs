import eslintPluginTypeScript from '@typescript-eslint/eslint-plugin';
import eslintPluginPrettier from "eslint-plugin-prettier";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'ts.config.json'],
    files: ['**/*.js', '**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsParser
    },
    plugins: {
      eslintPluginTypeScript,
      eslintPluginPrettier
    },
    rules: {
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'eslintPluginTypeScript/no-unused-vars': 'error',
    },
  },
];