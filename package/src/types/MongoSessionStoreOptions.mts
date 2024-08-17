import type { SessionData } from 'express-session'

export type MongoSessionStoreOptions = {
	uri: string
	collection: string

	/**
	 * The TTL (expiration) in milliseconds of the session.
	 */
	ttl: number | ((data: SessionData) => number)

	/**
	 * The prefix of the session ID key in MongoDB.
	 */
	prefix: string

	/**
	 * When true, the store will automatically create an expiresAfterSeconds index
	 * on the `expires` field in the collection. This is the default behavior and
	 * good housekeeping.
	 *
	 * NOTE: If the index already exists, it will not be recreated.
	 * https://www.mongodb.com/docs/manual/reference/method/db.collection.createIndex/#recreating-an-existing-index
	 *
	 * WARNING: Just be aware: `createIndex` will lock the collection
	 * while it creates the index. If your collection is large and has not yet been indexed,
	 * this could have an adverse performance effect during startup.
	 */
	createTTLIndex: boolean
}
