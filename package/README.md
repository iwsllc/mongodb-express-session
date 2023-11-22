# @iwsio/mongodb-express-session

[![@iwsio/mongodb-express-session: PUSH to main](https://github.com/iwsllc/mongodb-express-session/actions/workflows/mongodb-session-push-main.yaml/badge.svg)](https://github.com/iwsllc/mongodb-express-session/actions/workflows/mongodb-session-push-main.yaml)

This package provides an ESM module with an updated implementation of the [Express Session Store](https://www.npmjs.com/package/express-session#session-store-implementation) with [MongoDb 6 Driver](https://www.mongodb.com/docs/drivers/node/current/). This store implements `touch` and `TTL`

# Usage
This module exports a class with a constructor that includes these options:

```ts
type MongoSessionStoreOptions = {
	uri: string;
	collection: string;
	ttl: number | ((data: SessionData) => number);
	prefix: string;
	createTTLIndex: boolean;
};
```

## Quick example
Setting up an express server with `express-sessions` and using this MongoSessionStore as its store.

```ts
// app.mts
import { MongoSessionStore } from '@iwsio/mongodb-express-session'
import express from 'express'
import session from 'express-session'
import { store as mongoStore } from './store.mjs'

// create a store with default options and custom mongo uri
const store = new MongoSessionStore({ uri: 'mongodb://localhost/express_sessions' })

// optional, listen to store errors
store.on('error', function(error: any) {
	console.error(error)
})

const app = express()

app.enable('trust proxy', 1)

app.use(session({
	secret: 'some secret',
	resave: false,
	store: mongoStore,
	saveUninitialized: false,
	rolling: true,
	cookie: { httpOnly: true, sameSite: 'strict' },
	name: 'connect.sid'
}))
```

## Another example

With the `saveUninitialized: false` setting, testing this code out as-is without an established app will not save any session data to MongoDb. You need to modify the session in order to initialize it. Here's an example showing a simple middleware that modifies session during a request. 

```ts
// global.d.ts
declare module 'express-session' {

// extends the SessionData type to include your customizations
	interface SessionData {
		something?: string
	}
}

// app.mts: example initialization middleware
app.use((req, _res, next) => {
	if (req.session.something) {
		console.log('existing something: ', req.session.something)
		return next()
	}
	req.session.something = nanoid()
	console.log('new something: ', req.session.something)
	next()
})

app.get('/', (req, res) => {
	res.status(200).send('OK')
})
```

## Run the demo
Build and run the demo from the project root with Node 20 active. This requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or skip this step if you have a local MongoDb server available, in which case, you'll want to update the config settings in `app.mts` before this step).

```bash
# boots up the mongo db (this doesn't map data volume so it will lose everything when it shuts down)
# also FYI: shut it down with: `docker compose down`
docker compose up -d mongo

# install deps, build both workspaces and start the demo.
npm ci
npm run build
npm start -w demo
```


### Test the cookie creation
Curl the site. Without providing an existing cookie, it should create one for you. You'll see it in the response as a `Set-Cookie:` header.

```bash
curl -v http://localhost:3000

# yields:
*   Trying 127.0.0.1:3000...
* Connected to localhost (127.0.0.1) port 3000 (#0)
> GET / HTTP/1.1
> Host: localhost:3000
> User-Agent: curl/8.1.2
> Accept: */*
> 
< HTTP/1.1 200 OK
< X-Powered-By: Express
< Content-Type: text/html; charset=utf-8
< Content-Length: 2
< ETag: W/"2-nOO9QiTIwXgNtWtBJezz8kv3SLc"
# this guy
< Set-Cookie: connect.sid=s%3ABKpbZsCtMVGsRi2uDwMYIa4pAsLMh2EE.jEiosn3OQ7RQ9WZUSAKptC%2B0KshKXPY3oA%2Fh1J%2BECPI; Path=/; Expires=Wed, 29 Nov 2023 03:27:55 GMT; HttpOnly; SameSite=Strict
< Date: Wed, 22 Nov 2023 03:27:55 GMT
< Connection: keep-alive
< Keep-Alive: timeout=5
< 
* Connection #0 to host localhost left intact
OK%
```


### MongoDb
Check the database. use `mongosh localhost/express_sessions` and check the sessions collection. 

```js
use express_sessions
db.sessions.find()
[
  {
    _id: 'BKpbZsCtMVGsRi2uDwMYIa4pAsLMh2EE',
    expires: ISODate("2023-11-29T03:27:55.254Z"),
    session: {
      cookie: {
        path: '/',
        _expires: ISODate("2023-11-29T03:27:55.254Z"),
        originalMaxAge: 604800000,
        httpOnly: true,
        sameSite: 'strict'
      },
      something: 'K-o_HNG5jN6XcJ9bfrTep'
    }
  }
]

// Check for the index (default option)
db.sessions.getIndexes()
[
  { v: 2, key: { _id: 1 }, name: '_id_' },
  {
    v: 2,
    key: { expires: 1 },
    name: 'expires_1',
    expireAfterSeconds: 0
  }
]
```

### Test re-use:

Curl the site again. Except this time, use the cookie data sent to you from the last response.

```bash
curl -v --cookie "connect.sid=s%3ABKpbZsCtMVGsRi2uDwMYIa4pAsLMh2EE.jEiosn3OQ7RQ9WZUSAKptC%2B0KshKXPY3oA%2Fh1J%2BECPI; Path=/; Expires=Wed, 29 Nov 2023 03:27:55 GMT; HttpOnly; SameSite=Strict" http://localhost:3000
```

Then check MongoDb; ensure that no additional cookies were created. You should still find one cookie, but with an updated `expires` date. `touch` works!

```js
db.sessions.find()
[
  {
    _id: 'BKpbZsCtMVGsRi2uDwMYIa4pAsLMh2EE',
    expires: ISODate("2023-11-29T03:39:18.430Z"),
    session: {
      cookie: {
        path: '/',
        _expires: ISODate("2023-11-29T03:27:55.254Z"),
        originalMaxAge: 604800000,
        httpOnly: true,
        sameSite: 'strict'
      },
      something: 'K-o_HNG5jN6XcJ9bfrTep'
    }
  }
]
```