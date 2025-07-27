// eslint.config.mjs
import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';

export default [
  js.configs.recommended,
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      // Disable specific rules
      'react/no-unescaped-entities': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      // Keep other Next.js recommended rules
      ...nextPlugin.configs.recommended.rules,
    },
  },
  {
    // Apply to specific files
    files: ['app/pharmacy/dashboard/page.tsx'],
    rules: {
      'react/no-unescaped-entities': 'off',
    },
  },
];
