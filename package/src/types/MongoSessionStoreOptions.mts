import type { SessionData } from 'express-session'

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
