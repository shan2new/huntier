//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  // Disable pnpm-specific rule since this repo uses npm, not pnpm.
  {
    rules: {
      'pnpm/json-enforce-catalog': 'off',
    },
  },
  // Also ensure package.json isn't checked for pnpm catalog enforcement.
  {
    files: ['package.json'],
    rules: {
      'pnpm/json-enforce-catalog': 'off',
    },
  },
]
