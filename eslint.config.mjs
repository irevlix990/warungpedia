import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

/**
 * ESLint flat config for Warungpedia.
 *
 * `next lint` was removed in Next.js 16 and `next build` no longer lints,
 * so linting runs through the ESLint CLI (`npm run lint`).
 *
 * eslint-config-next 16 ships flat config arrays directly; they are spread
 * here without FlatCompat.
 */
const config = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      '.next/dev/**',
      'out/**',
      'build/**',
      'public/**',
      'supabase/**',
      'coverage/**',
      'next-env.d.ts',
    ],
  },
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
]

export default config
