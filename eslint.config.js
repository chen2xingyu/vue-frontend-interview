import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import prettier from 'eslint-config-prettier'

/**
 * ESLint 9.x Flat Config —— 按目录拆作用域
 *
 * P9 面试点：为什么 flat config 要显式 files？
 *   早期配置把 recommendedTypeChecked + project 全局应用到所有文件，
 *   但 server/ 是纯 JS、playwright/ 没有 tsconfig、
 *   测试文件用的是另一份 tsconfig -> 全部报 "parserOptions.project 未找到文件"
 *
 * 解法：每个 config 块用 files 显式声明作用域
 *   - apps/web + packages/ui：走 type-aware TS
 *   - server/：纯 JS 基础规则
 *   - playwright/ + 测试文件：关闭 unsafe-any 噪声
 *
 * 已知降级点（有真实约束，暂不解决）：
 *   - Vue SFC defineProps/defineEmits 类型参数会触发原生 no-unused-vars 误报
 *     -> .vue 文件里关原生 no-unused-vars，用 vue/no-unused-vars 代替
 *   - test 文件里的 unsafe-any：vitest happy-dom 类型解析边界问题
 *   - http.ts Promise.reject 用字符串：后端约定的错误码传递
 *   - useRequest 内的 request 调用：返回 Promise 但不 await（竞态保护）
 */

// Vue <script setup> 编译器宏 —— ESLint no-undef 不认识
const vueSetupMacros = [
  'defineProps',
  'defineEmits',
  'defineExpose',
  'defineSlots',
  'defineModel',
  'defineAttrs',
  'defineOptions',
  'defineWarn',
  'withDefaults',
  'useAttrs',
  'useSlots',
]

const WEB_FILES = [
  'apps/web/**/*.ts',
  'apps/web/**/*.vue',
  'packages/ui/**/*.ts',
  'packages/ui/**/*.vue',
]
const VUE_FILES = ['apps/web/**/*.vue', 'packages/ui/**/*.vue']

export default [
  // ------- 忽略 -------
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.turbo/**',
      '**/*.config.*',
      '**/coverage/**',
      'pnpm-lock.yaml',
    ],
  },

  // ------- server/：纯 JS 基础规则 -------
  {
    ...js.configs.recommended,
    files: ['server/**/*.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.es2022 },
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },

  // ------- apps/web + packages/ui：TypeScript 类型感知 -------
  ...tseslint.configs.recommendedTypeChecked.map((c) => ({
    ...c,
    files: WEB_FILES,
  })),
  {
    files: WEB_FILES,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
        ...globals.vitest,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./apps/web/tsconfig.json', './tsconfig.base.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // ------- Vue：vue-eslint-parser 顶层 + TS script parser -------
  ...pluginVue.configs['flat/recommended'].map((c) => ({ ...c, files: VUE_FILES })),
  {
    files: VUE_FILES,
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
      globals: vueSetupMacros.reduce((acc, name) => {
        acc[name] = 'readonly'
        return acc
      }, {}),
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'warn',
      'vue/no-unused-vars': 'warn',
      'vue/no-unused-properties': ['warn', { groups: ['props'] }],
      'vue/no-static-inline-styles': 'warn',
      'vue/attributes-order': [
        'warn',
        {
          order: [
            'DEFINITION',
            'LIST_RENDERING',
            'CONDITIONALS',
            'RENDER_MODIFIERS',
            'GLOBAL',
            'UNIQUE',
            'TWO_WAY_BINDING',
            'OTHER_DIRECTIVES',
            'OTHER_ATTR',
            'EVENTS',
            'CONTENT',
          ],
        },
      ],
      // 原生 no-unused-vars 误报 defineProps/defineEmits 的类型参数
      'no-unused-vars': 'off',
      // defineAttrs() / defineModel() 宏无法类型感知
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
    },
  },

  // ------- TS 严格规则（仅 apps/web + packages/ui 的 .ts 文件） -------
  {
    files: ['apps/web/**/*.ts', 'packages/ui/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: { regex: '^I[A-Z]', match: false },
        },
        { selector: 'typeAlias', format: ['PascalCase'] },
      ],
      // 以下规则在当前代码库中有真实约束，暂不开启为 error
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/prefer-promise-reject-errors': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  // ------- playwright/：Playwright expect 不是 Thenable -------
  {
    files: ['playwright/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node, ...globals.es2022, ...globals.playwright },
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    rules: {
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  },

  // ------- **/*.test.ts：关闭 unsafe-any 噪声 -------
  {
    files: ['apps/web/**/*.test.ts', 'packages/ui/**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-unused-vars': 'off',
    },
  },

  // ------- Prettier 冲突规则 -------
  prettier,
]
