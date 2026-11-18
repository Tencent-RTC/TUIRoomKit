module.exports = {
  root: true,
  extends: ['@tencentcloud/eslint-config-hybrid/react'],
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2020,
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx', '.d.ts'],
    },
  },
  rules: {
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-duplicate-enum-values': 0,
    curly: 0,
    'import/order': 0,
    'import/named': 0,
    'import/namespace': 0,
    'import/default': 0,
    'import/no-unresolved': 0,
    'import/no-named-as-default': 0,
    'import/no-named-as-default-member': 0,
  },
  ignorePatterns: ['node_modules', 'public', 'dist', '*.d.ts', '!.*.cjs', '!.storybook', '*.cjs'],
};
