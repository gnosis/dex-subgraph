module.exports = {
  rules: {
    // NOTE: AssemblyScript doesn't have the same non-null type guard logic.
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'error',
    // NOTE: `BigInt` can't be `const`.
    'prefer-const': 'off',
  },
}
