import { configure } from '@iwsio/eslint-config'

const monoRepoPackages = [
	'@iwsio/mongodb-express-session'
]

const monoRepoNodeProjects = [
	'package'
]

export default configure({ monoRepoPackages, monoRepoNodeProjects })
