import type { SessionData } from 'express-session'

export type SessionDocument = {
	_id: string;
	expires: Date;
	session: SessionData;
};
