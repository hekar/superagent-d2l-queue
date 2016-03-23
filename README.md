#Request Queue

[![NPM version][npm-image]][npm-url]
[![Build status][ci-image]][ci-url]
[![Coverage Status][coverage-image]][coverage-url]
[![Dependency Status][dependencies-image]][dependencies-url]

Extends [Superagent](https://github.com/visionmedia/superagent) by adding the ability to queue up requests and retry failed requests due to timeouts.

## Installation

Install from NPM:

```shell
npm install superagent-d2l-queue --save
```

## Usage

###### superagentQueue(options)

```js
const request = require( 'superagent' );
const superagentQueue = require('superagent-d2l-queue');

// ...

request
    .get( ... )
    .use( superagentQueue( ... ) )
    .end( function( err, res ) {
        // ...
    });
```

###### Options

All parameters are optional. Defaults are below.
```js
queue: undefined, // use `superagentQueue.makeQueue()``
initialTimeout: 2000,
backoff: {
    exp: { // Exponential backoff
        factor: 1.4 //  (1.4 ^ retryCount)
    },
    retries: 5, // Number of retries
    override: function( retryCount ) { // Compute the time between each retry interval.
        return Math.round( initialTimeout *
            Math.pow( backoff.exp.factor, retryCount ) );
    }
}
```

### `superagentQueue( { queue: superagentQueue.makeQueue() } )`
Specify an Array that will be used as a queue to chain multiple Superagent requests. Only one request will execute at a time. This is similar to what can be done with libraries such as [Q](https://github.com/kriskowal/q).

```js
const request = require( 'superagent' );
const superagentQueue = require('superagent-d2l-queue');

// ...

const queue = superagentQueue.makeQueue();

const first = request
    .get( ... )
    .use( superagentQueue( { queue } ) )
    .end( function( err, res ) {
        // ...
    });

const second = request
    .get( ... )
    .use( superagentQueue( { queue } ) )
    .end( function( err, res ) {
        // ...
    });

const third = request
    .get( ... )
    .use( superagentQueue( { queue } ) )
    .end( function( err, res ) {
        // ...
    });

// etc...
```

### `retryOnConnectionFailure( handler )`

When a request fails due to a timeout or connection failure the request will be retried every 2 seconds until it can successfully send the request. A handler function can be specified in order to complete some action whenever a timeout occurs. This handler is optional.

```js
const request = require( 'superagent' );
const superagentQueue = require('superagent-d2l-queue');

request
    .get( ... )
    .use( superagentQueue( ... ) )
    .retryOnConnectionFailure( function() {
        //do something
    })
    .end( function( err, res ) {
        // ...
    });
```


## Contributing

1. **Fork** the repository. Committing directly against this repository is
   highly discouraged.

2. Make your modifications in a branch, updating and writing new unit tests
   as necessary in the `spec` directory.

3. Ensure that all tests pass with `npm test`

4. `rebase` your changes against master. *Do not merge*.

5. Submit a pull request to this repository. Wait for tests to run and someone
   to chime in.

### Code Style

This repository is configured with [EditorConfig][EditorConfig] and
[ESLint][ESLint] rules.


[npm-url]: https://npmjs.org/package/superagent-d2l-queue
[npm-image]: https://img.shields.io/npm/v/superagent-d2l-queue.png
[ci-url]: https://travis-ci.org/Brightspace/superagent-d2l-queue
[ci-image]: https://img.shields.io/travis-ci/Brightspace/superagent-d2l-queue.svg
[coverage-url]: https://coveralls.io/r/Brightspace/superagent-d2l-queue?branch=master
[coverage-image]: https://img.shields.io/coveralls/Brightspace/superagent-d2l-queue.svg
[dependencies-url]: https://david-dm.org/brightspace/superagent-d2l-queue
[dependencies-image]: https://img.shields.io/david/Brightspace/superagent-d2l-queue.svg
[EditorConfig]: http://editorconfig.org/
[ESLint]: http://eslint.org
