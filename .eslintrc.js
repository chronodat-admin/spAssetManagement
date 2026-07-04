require('@rushstack/eslint-config/patch/modern-module-resolution');

module.exports = {
  extends: ['@microsoft/eslint-config-spfx/lib/profiles/react', 'prettier'],
  parserOptions: { tsconfigRootDir: __dirname },
  ignorePatterns: [
    'lib/**',
    'dist/**',
    'temp/**',
    'release/**',
    'node_modules/**',
    'scripts/**',
    'e2e/**',
    'gulpfile.js',
    '.eslintrc.js',
    '*.config.js',
    '*.config.ts'
  ],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './tsconfig.json'
      },
      plugins: ['react-hooks'],
      rules: {
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            ignoreRestSiblings: true
          }
        ]
      }
    }
  ]
};
