const hybridRoot = require.resolve('@tencentcloud/eslint-config-hybrid');
const tsParser = require.resolve('@typescript-eslint/parser', { paths: [hybridRoot] });
const vueParser = require.resolve('vue-eslint-parser', { paths: [hybridRoot] });

module.exports = {
  root: true,
  extends: ['@tencentcloud/eslint-config-hybrid/vue3'],
  // Parsers are intentionally not declared here. The shared config already selects
  // vue-eslint-parser for `.vue` and @typescript-eslint/parser for `.ts`, and it resolves
  // both to absolute paths so they match the plugin versions it ships with. Naming them
  // here by bare specifier would resolve them from this package instead and pick up the
  // old @typescript-eslint/parser 5.x hoisted in `conference/node_modules`.
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    tsconfigRootDir: __dirname,
    extraFileExtensions: ['.vue'],
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx', '.d.ts'],
    },
  },
  rules: {
    'vue/multi-word-component-names': 'off',
    'vue/attribute-hyphenation': 'off',
    'vue/no-dupe-keys': 'off',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
        vue: 'always',
      },
    ],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-duplicate-enum-values': 0,
    curly: 0,
    'import/order': 0,
    'import/named': 0,
    'vue/max-attributes-per-line': 0,
    'vue/first-attribute-linebreak': 0,
    'vue/html-closing-bracket-newline': 0,
    'vue/no-reserved-component-names': 0,
    'import/namespace': 0,
    'import/default': 0,
    'import/no-unresolved': 0,
    'import/no-named-as-default': 0,
    'import/no-named-as-default-member': 0,
  },
  ignorePatterns: ['node_modules', 'public', 'dist', '*.d.ts', '!.*.cjs', '!.storybook', '*.cjs'],
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: tsParser,
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.node.json'],
        tsconfigRootDir: __dirname,
      },
      settings: {
        'import/parsers': {
          '@typescript-eslint/parser': ['.ts', '.tsx', '.d.ts'],
        },
      },
    },
    {
      files: ['**/*.vue'],
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: ['.vue'],
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
        ecmaFeatures: {
          jsx: false,
        },
      },
      settings: {
        'import/parsers': {
          '@typescript-eslint/parser': ['.ts', '.tsx', '.d.ts'],
        },
      },
      rules: {
        '@typescript-eslint/consistent-type-exports': 0,
      },
    },
  ],
};
