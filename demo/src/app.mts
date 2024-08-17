import createError from 'http-errors'
import express from 'express'
import logger from 'morgan'
import session from 'express-session'
import { store } from './store.mjs'
import { nanoid } from 'nanoid'

export const app = express()

app.use(logger('dev'))

app.use(session({
	secret: 'keyboard cat',
	resave: false,
	store,
	saveUninitialized: false,
	rolling: true,
	cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 7, sameSite: 'strict' },
	name: 'connect.sid'
}))

app.use((req, _res, next) => {
	if (req.session.something) {
		console.log('existing something: ', req.session.something)
		return next()
	}
	req.session.something = nanoid()
	console.log('new something: ', req.session.something)
	next()
})

app.get('/', (_req, res) => {
	res.status(200).send('OK')
})

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404))
})

// error handler
app.use(function (err, _req, res, _next) {
	res.status(err.status || 500)
	res.send(err.message)
})
