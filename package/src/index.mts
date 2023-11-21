import type { SessionData } from 'express-session'
import { MongoClient } from 'mongodb'
import { Store } from 'express-session'
import { defaults } from './defaults.mjs'

export type MongoSessionStoreOptions = {
	uri: string;
	collection: string;

	/**
	 * The TTL (expiration) in milliseconds of the session.
	 */
	ttl: number | ((data: SessionData) => number);

	/**
	 * The prefix of the session ID key in MongoDB.
	 */
	prefix: string;
};

const noop = (_err?: unknown, _data?: any) => {}

const _DEFAULTS: MongoSessionStoreOptions = { uri: 'mongodb://localhost:27017/test', collection: 'sessions', ttl: 86400000, prefix: '' }

type SessionDocument = {
	_id: string;
	expires: Date;
	session: SessionData;
};

type StoreCallback = (err?: any) => void;
type StoreCallbackTotal = (err?: any, total?: number) => void
type StoreCallbackOne = (err?: any, session?: SessionData | null) => void
type StoreCallbackMany = (err?: any, session?: SessionData[]) => void

export class MongoSessionStore extends Store {
	client: MongoClient
	collectionName: string
	connected: boolean = false
	prefix: string
	ttl: number | ((data: SessionData) => number)

	constructor(opt: Partial<MongoSessionStoreOptions> = {}) {
		super()

		const options: MongoSessionStoreOptions = defaults(opt, _DEFAULTS)

		this.client = new MongoClient(options.uri)
		this.collectionName = options.collection
		this.ttl = options.ttl
		this.prefix = options.prefix

		this.client.connect()
			.then(() => {
				this.connected = true
				this.emit('info', 'Connected to MongoDB')
			})
			.catch((err: any) => {
				this.emit('error', err)
			})
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
		console.log('touch', sid)
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
