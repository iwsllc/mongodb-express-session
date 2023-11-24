import type { SessionData } from 'express-session'
import { MongoClient } from 'mongodb'
import { Store } from 'express-session'
import { defaults } from './defaults.mjs'
import { MongoSessionStoreOptions } from './types/MongoSessionStoreOptions.mjs'
import { SessionDocument } from './types/SessionDocument.mjs'
import { StoreCallback, StoreCallbackMany, StoreCallbackOne, StoreCallbackTotal } from './types/StoreCallback.mjs'

const noop = (_err?: unknown, _data?: any) => {}

const _DEFAULTS: MongoSessionStoreOptions = {
	uri: 'mongodb://localhost:27017/express_sessions',
	collection: 'sessions',
	ttl: 86400000,
	prefix: '',
	createTTLIndex: true
}

/**
 * Express session store for MongoDB.
 *
 * Create a new instance and provide to the express-session options as `store` property.
 *
 * For example:
 * ```
  import session from 'express-session'
  import { MongoSessionStore } from '@iwsio/mongodb-express-session'

  const mongoStore = new MongoSessionStore({
    uri: 'mongodb://localhost:27017/express_sessions'
  })

  app.use(session({
    secret: 'secret cookie key',
    resave: false,
    store: mongoStore,
    saveUninitialized: false,
    cookie: { secure: true, sameSite: 'strict' },
  }))
 * ```
 *
 * Default options:
 * ```
 * {
    uri: 'mongodb://localhost:27017/express_sessions',
    collection: 'sessions',
    ttl: 86400000, // 1 week
    prefix: '',
    createTTLIndex: true
  }
 * ```
 */
export class MongoSessionStore extends Store {
	client: MongoClient
	collectionName: string
	connected: boolean = false
	prefix: string
	ttl: number | ((data: SessionData) => number)
	createTTLIndex: boolean

	constructor(opt: Partial<MongoSessionStoreOptions> = {}) {
		super()

		const options: MongoSessionStoreOptions = defaults(opt, _DEFAULTS)

		this.client = new MongoClient(options.uri)
		this.collectionName = options.collection
		this.ttl = options.ttl
		this.prefix = options.prefix
		this.createTTLIndex = options.createTTLIndex

		this.client.connect()
			.then(() => {
				this.connected = true
				this.emit('info', 'Connected to MongoDB for session store.')
				this.checkIndexes()
			})
			.catch((err: any) => {
				this.emit('error', err)
			})
	}

	private async checkIndexes() {
		if (this.createTTLIndex) {
			try {
				await this.client.db().collection<SessionDocument>(this.collectionName!).createIndex({ expires: 1 }, { expireAfterSeconds: 0 })
			} catch (err: any) {
				this.emit('error', err)
			}
		}
	}

	/**
	 * Closes the MongoDB connection.
	 */
	public close() {
		if (this.connected) {
			this.emit('info', 'Closing MongoDB connection to session store.')
			this.client.close()
		}
	}

	private _getTTL(sess: SessionData) {
		if (typeof this.ttl === 'function') {
			return this.ttl(sess)
		}

		let ttl
		if (sess && sess.cookie && sess.cookie.expires) {
			ttl = Number(new Date(sess.cookie.expires)) - Date.now()
		} else {
			ttl = this.ttl
		}
		return ttl
	}

	private collection() {
		return this.client.db().collection<SessionDocument>(this.collectionName!)
	}

	async all(cb: StoreCallbackMany = noop) {
		try {
			const result = (await this.collection().find().toArray()).map((doc) => doc.session)
			cb(null, result)
		} catch (err) {
			cb(err)
		}
	}

	async destroy(sid: string, cb: StoreCallback = noop) {
		try {
			const result = await this.collection().deleteOne({ _id: sid })
			result.acknowledged ? cb() : cb(new Error('Not acknowledged'))
		} catch (err) {
			cb(err)
		}
	}

	async clear(cb: StoreCallback = noop) {
		try {
			const result = await this.collection().deleteMany({})
			result.acknowledged ? cb() : cb(new Error('Not acknowledged'))
		} catch (err) {
			cb(err)
		}
	}

	async length(cb: StoreCallbackTotal = noop) {
		try {
			const total = await this.collection().countDocuments()
			cb(null, total)
		} catch (err) {
			cb(err)
		}
	}

	async get(sid: string, cb: StoreCallbackOne = noop) {
		try {
			const doc = await this.collection().findOne({ _id: sid })
			cb(null, doc?.session ?? null)
		} catch (err) {
			cb(err)
		}
	}

	async set(sid: string, session: SessionData, cb: StoreCallback = noop) {
		try {
			const ttl = this._getTTL(session)
			const expires = new Date(Date.now() + ttl)
			const doc: SessionDocument = {
				_id: sid,
				expires,
				session
			}
			const result = await this.collection().insertOne(doc)
			result.acknowledged ? cb() : cb(new Error(`set not acknowledged for ${sid}`))
		} catch (err) {
			cb(err)
		}
	}

	async touch(sid: string, session: SessionData, cb: StoreCallback = noop) {
		try {
			const ttl = this._getTTL(session)
			const expires = new Date(Date.now() + ttl)
			const result = await this.collection().updateOne({ _id: sid }, { $set: { expires } })
			result.acknowledged ? cb() : cb(new Error(`touch not acknowledged for ${sid}`))
		} catch (err) {
			cb(err)
		}
	}
}
