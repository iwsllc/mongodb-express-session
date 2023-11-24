import { MongoSessionStore } from '@iwsio/mongodb-express-session'
import debugM from 'debug'

const debug = debugM('demo:session-store')

export const store = new MongoSessionStore({
	uri: 'mongodb://localhost:27017/express_sessions'
	// createTTLIndex: false // uncomment for MongoDb < 5.1
})

store.on('info', debug)
store.on('error', console.error)
