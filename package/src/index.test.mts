import * as mongoSessionStore from './index.mjs'

const connectSpy = vi.fn()
const constSpy = vi.fn()
vi.mock('mongodb', async () => {
	const mongodb = (await vi.importActual('mongodb')) as any

	return {
		...mongodb,
		MongoClient: class MongoClient {
			constructor(props?: any) {
				constSpy(props)
			}

			connect() {
				connectSpy()
				return Promise.resolve()
			}

			db() {
				return {
					collection() {
						return {
							findOne: vi.fn(),
							findMany: () => ({ toArray: vi.fn() }),
							deleteOne: vi.fn(() => Promise.resolve({ acknowledged: true })),
							updateOne: vi.fn(() => Promise.resolve({ acknowledged: true })),
							countDocuments: vi.fn()
						}
					}
				}
			}
		}
	}
})

describe('MongoSessionStore', () => {
	beforeEach(() => {
		connectSpy.mockClear()
		constSpy.mockClear()
	})
	it('should connect on contstruction with defaults', async () => {
		const store = new mongoSessionStore.MongoSessionStore()
		let error: any = null; let info: any = null
		store.on('error', (err: any) => { error = err })
		store.on('info', (message: string) => { info = message })

		await vi.waitUntil(
			() => info != null || error != null,
			{ timeout: 1000 }
		)
		expect(error).not.to.be.ok
		expect(constSpy).toBeCalledWith('mongodb://localhost:27017/test')
		expect(info).to.equal('Connected to MongoDB')
		expect(store.collectionName).to.equal('sessions')
		expect(store.prefix).to.equal('')
		expect(store.ttl).to.equal(86400000)
	})

	it('should connect on contstruction', async () => {
		const store = new mongoSessionStore.MongoSessionStore({
			uri: 'mongodb://localhost:27018/test',
			collection: 'sessions2',
			ttl: 60 * 60 * 24 * 14 * 1000, // 2 weeks
			prefix: '2'
		})
		let error: any = null; let info: any = null
		store.on('error', (err: any) => { error = err })
		store.on('info', (message: string) => { info = message })

		await vi.waitUntil(
			() => info != null || error != null,
			{ timeout: 1000 }
		)
		expect(error).not.to.be.ok
		expect(constSpy).toBeCalledWith('mongodb://localhost:27018/test')
		expect(info).to.equal('Connected to MongoDB')
		expect(store.collectionName).to.equal('sessions2')
		expect(store.prefix).to.equal('2')
		expect(store.ttl).to.equal(1209600000)
	})
})
