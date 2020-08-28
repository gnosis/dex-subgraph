module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  plugins: ['prettier'],
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  ignorePatterns: ['abis/', 'build/', 'generated/', 'node_modules/', '!.prettierrc.js'],
}
