const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  // Configuración global de archivos ignorados
  {
    ignores: [
      'node_modules/',
      'dist/',
      'release/',
      'src/react-ui/dist/',
      'src/react-ui/node_modules/',
      'src/server/bin/',
      'src/server/obj/',
      '**/*.exe',
      '.vscode/',
      'src/react-ui/src/**/*',
    ],
  },
  {
    files: ['*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-async-promise-executor': 'error',
      'no-useless-escape': 'warn',
    },
  },
];
