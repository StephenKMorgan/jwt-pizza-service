import globals from 'globals';
import pluginJs from '@eslint/js';

export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.node,
        k6: 'readonly',
        __VU: 'readonly',
        __ITER: 'readonly'
      }
    }
  },
  pluginJs.configs.recommended,
  {
    files: ['loadTests/**/*.js'],
    rules: {
      'import/no-unresolved': 'off',
      'no-unused-expressions': 'off'
    }
  },
  {
    files: ['**/*.test.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly'
      }
    }
  }
];