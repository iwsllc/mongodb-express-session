import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import promisePlugin from 'eslint-plugin-promise'
import stylistic from '@stylistic/eslint-plugin'
import nodePlugin from 'eslint-plugin-n'
import globals from 'globals'

const monoRepoPackages = [
	'@iwsio/mongodb-express-session'
]

const monoRepoNodeProjects = [
	'package'
]

export default [
	...tseslint.config(
		{
			ignores: ['**/node_modules/*', '**/dist/', '**/precompiled/*'] // global ignore with single ignore key
		},
		// all projects:
		eslint.configs.recommended,
		...tseslint.configs.recommended,
		stylistic.configs.customize({
			braceStyle: '1tbs',
			commaDangle: 'never',
			indent: 'tab',
			jsx: true,
			quotes: 'single',
			semi: false
		}),
		{
			plugins: {
				'promise': promisePlugin,
				'@stylistic': stylistic
			},
			languageOptions: {
				ecmaVersion: 2023,
				globals: {
					...globals.browser,
					...globals.node,
					...globals.es2023
				}
			},
			rules: {
				...promisePlugin.configs.recommended.rules,

				// custom rules here
				'promise/always-return': ['error', { ignoreLastCallback: true }],

				'@typescript-eslint/no-explicit-any': 'off',
				'@typescript-eslint/no-unused-vars': ['error', {
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					destructuredArrayIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_'
				}]
			},

			settings: {
				react: {
					version: 'detect' // You can add this if you get a warning about the React version when you lint
				}
			}
		},
		{
			files: ['**/*.test.ts', '**/*.test.tsx', '**/*.test.mts', '**/*.test.cts', '**/*.test.js'],
			plugins: {
				'@stylistic': stylistic
			},
			rules: {
				'@stylistic/max-statements-per-line': 'off',
				'@typescript-eslint/no-unused-expressions': 'off'
			}
		},
		{
		// node rules
			files: monoRepoNodeProjects.map(path => `${path}/**/*`),
			// files: [],

			plugins: {
				n: nodePlugin
			},

			rules: {
				...nodePlugin.configs['flat/recommended'].rules,

				// custom

				'n/no-extraneous-import': ['error', {
					allowModules: [...monoRepoPackages]
				}]
			}
		}
	)

]
