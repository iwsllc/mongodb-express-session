import { fileURLToPath } from 'node:url'

import { configure } from '@iwsio/eslint-config'
const __dirname = fileURLToPath(new URL('.', import.meta.url))

const excludeWorkspacesFromNodeRules = ['demo'] // meant for browser only or not Node related.

const configs = await configure({ autoFindMonorepoPackages: true, rootDir: __dirname, excludeWorkspacesFromNodeRules })
export default configs
