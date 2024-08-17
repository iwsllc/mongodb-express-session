import { SessionData } from 'express-session'

export type StoreCallback = (err?: any) => void
export type StoreCallbackTotal = (err?: any, total?: number) => void
export type StoreCallbackOne = (err?: any, session?: SessionData | null) => void
export type StoreCallbackMany = (err?: any, session?: SessionData[]) => void
