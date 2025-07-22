import type { SessionData } from 'express-session'

export interface SessionDocument {
	_id: string
	expires: Date
	session: SessionData
}
