import * as mongoSessionStore from './index.mjs'

const connectSpy = vi.fn()
const constSpy = vi.fn()
const createIndexSpy = vi.fn()
const updateOneSpy = vi.fn(() => Promise.resolve({ acknowledged: true }))

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

			close() {

			}

			db() {
				return {
					collection() {
						return {
							findOne: vi.fn(),
							findMany: () => ({ toArray: vi.fn() }),
							deleteOne: vi.fn(() => Promise.resolve({ acknowledged: true })),
							updateOne: updateOneSpy,
							countDocuments: vi.fn(),
							createIndex: createIndexSpy
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
		createIndexSpy.mockClear()
	})
	it('should connect on construction with defaults', async () => {
		const spyInfo = vi.fn()
		const spyError = vi.fn()
		const store = new mongoSessionStore.MongoSessionStore()
		store.on('info', spyInfo)
		store.on('error', spyError)

		await vi.waitFor(() => {
			expect(constSpy).toBeCalledWith('mongodb://localhost:27017/express_sessions')
			expect(connectSpy).toHaveBeenCalled()
			expect(createIndexSpy).toBeCalledWith({ expires: 1 }, { expireAfterSeconds: 0 })
			expect(store.collectionName).to.equal('sessions')
			expect(store.prefix).to.equal('')
			expect(store.ttl).to.equal(86400000)
			expect(spyError).not.toHaveBeenCalled()
			expect(spyInfo).toHaveBeenCalledWith('Connected to MongoDB for session store.')
		})
	})

	it('should connect on construction', async () => {
		const spyInfo = vi.fn()
		const spyError = vi.fn()

		const store = new mongoSessionStore.MongoSessionStore({
			uri: 'mongodb://localhost:27018/test',
			collection: 'sessions2',
			ttl: 60 * 60 * 24 * 14 * 1000, // 2 weeks
			prefix: '2',
			createTTLIndex: false
		})
		store.on('error', spyError)
		store.on('info', spyInfo)

		await vi.waitFor(() => {
			expect(constSpy).toBeCalledWith('mongodb://localhost:27018/test')
			expect(createIndexSpy).not.toBeCalledWith({ expires: 1 }, { expireAfterSeconds: 0 })
			expect(store.collectionName).to.equal('sessions2')
			expect(store.prefix).to.equal('2')
			expect(store.ttl).to.equal(1209600000)
			expect(spyError).not.toHaveBeenCalled()
			expect(connectSpy).toHaveBeenCalled()
			expect(spyInfo).toHaveBeenCalledWith('Connected to MongoDB for session store.')
		})
		spyInfo.mockClear()
		store.close()
		await vi.waitFor(() => {
			expect(spyInfo).toHaveBeenCalledWith('Closing MongoDB connection to session store.')
		})
	})

	it('should upsert on set', async () => {
		const store = new mongoSessionStore.MongoSessionStore()
		const errorSpy = vi.fn()
		store.on('error', errorSpy)

		await vi.waitFor(() => {
			expect(connectSpy).toHaveBeenCalled()
		})

		await store.set('1', {
			cookie: {
				maxAge: 2000,
				originalMaxAge: null
			}
		} as any)

		expect(errorSpy).not.toHaveBeenCalled()
		expect(updateOneSpy).toHaveBeenCalledWith(
			{ _id: '1' },
			{
				$set: expect.objectContaining({
					// expires, ignoring for test
					session: {
						cookie: {
							maxAge: 2000,
							originalMaxAge: null
						}
					}
				})
			},
			{ upsert: true } // mainly we're asserting this and that it's an update
		)
	})
})
