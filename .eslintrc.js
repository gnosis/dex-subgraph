module.exports = {
  root: true,
  env: {
    es2020: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'prettier/@typescript-eslint',
  ],
  ignorePatterns: ['abis/', 'build/', 'generated/', 'node_modules/', '!.prettierrc.js'],
  rules: {
    // NOTE: We require TypeScript to target ES2020 for extended BigInt support
    // that is available in NodeJS 12. However, this causes `tsc` to not emit
    // extra code for optional chaining (`foo?.bar`) as that is part of ES2020.
    // Allow use of `!` non-null assertions to work around this.
    '@typescript-eslint/no-non-null-assertion': 'off',
  },
}
