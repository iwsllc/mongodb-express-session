# @iwsio/mongodb-express-session

<!-- [![Push to main - @iwsio/json-csv-node](https://github.com/iwsllc/json-csv/actions/workflows/push-node.yml/badge.svg)](https://github.com/iwsllc/json-csv/actions/workflows/push-node.yml) -->

This package provides an updated implementation of the [Express Session Store](https://www.npmjs.com/package/express-session#session-store-implementation) with [MongoDb 6 Driver](https://www.mongodb.com/docs/drivers/node/current/) as an ESM module. This store implements `touch` and `TTL`

# Usage
This module exports a class. The constructor inclues options. 

```ts
import { MongoSessionStore } from '@iwsio/mongodb-express-session'

export const store = new MongoSessionStore({
	// NOTE: these are default options: 
	uri: 'mongodb://localhost:27017/express_sessions',
	collection: 'sessions',
	ttl: 60 * 60 * 24 * 7 * 1000 // 1 week
})

store.on('error', function(error: any) {
	console.error(error)
})
```