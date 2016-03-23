'use strict';

const retry = require( './Retry' );
const defaultsDeep = require('lodash.defaultsdeep');

function requestQueue( params ) {

	const superagentEnd = this.end;

	function setupOptions( params ) {
		if ( params && params.backoff && params.backoff.override ) {
			console.warn( '"backoff.override" is deprecated.' +
				'Will be removed in future versions.'
				'Please use "backoff.compute"' );
			params.compute = params.override;
		}

		const defaultOptions = {
			initialTimeout: 2000,
			backoff: {
				exp: {
					factor: 1.4
				},
				retries: 5,
				compute: _computeWaitPeriod
			}
		};

		return defaultsDeep( defaultOptions, params );
	}



	const options = this.options = setupOptions(params);
	const queue = this.queue =
		( ( params ) ? params.queue : undefined );

	let retryCount = 0;

	function _computeWaitPeriod( retryCount ) {
		return Math.round( options.initialTimeout *
			Math.pow( options.backoff.exp.factor, retryCount ) );
	}

	function _resetRequest( request, timeout ) {

		let headers = {};

		if ( request.req ) {
			headers = request.req._headers;
			request.req.abort();
		}

		request.called = false;
		request.timeout( timeout );

		delete request._timer;
		delete request.timer;
		delete request.aborted;
		delete request._aborted;
		delete request.timedout;
		delete request.req;
		delete request.xhr;

		const headerKeys = Object.keys( headers );
		for( let i = 0; i < headerKeys.length; i++ ) {
			request.set( headerKeys[i], headers[headerKeys[i]] );
		}
	}

	function _returnResponse( fn, err, res ) {
		if ( fn ) {
			fn( err, res );
		}
	}

	function _sendNextRequest( request ) {

		const next = request.queue[0];
		if ( next ) {
			_sendRequest( next.request, next.fn, next.timeout );
		}

	}

	function _sendRequest( request, fn, timeout ) {

		superagentEnd.call( request, ( err, res ) => {

			if ( retry.should( err, res ) ) {

				function doRetry( err ) {
					if ( err ) {
						// TODO: What to do here?
						throw err;
					} else {
						if ( retryCount !== options.backoff.retries ) {
							retryCount++;
						}

						const retryWaitPeriod = options.backoff
							.compute.call( request, retryCount );

						setTimeout( () => {
							_resetRequest( request, timeout );
							_sendRequest( request, fn, request._timeout );
						}, retryWaitPeriod );
					}
				}

				const errorHandler = request.connectionErrorHandler;
				if ( errorHandler ) {
					errorHandler( doRetry );
				} else {
					doRetry();
				}

			} else {
				retryCount = 0;

				_returnResponse( fn, err, res );

				if ( request.queue ) {
					request.queue.shift();
					_sendNextRequest( request );
				}
			}

		});

	}

	this.retryOnConnectionFailure = function( connectionErrorHandler ) {
		this.connectionErrorHandler = connectionErrorHandler;
		return this;
	};

	this.end = function( fn ) {

		if ( this.queue ) {

			this.queue.push(
				{
					request: this,
					fn: fn,
					timeout: this._timeout
				}
			);

			if ( this.queue.length === 1 ) {
				_sendNextRequest( this );
			}
		} else {
			_sendRequest( this, fn, this._timeout );
		}

	};

	return this;
}

function create( params ) {
	return function( request ) {
		return requestQueue.call( request, params );
	};
};

create.makeQueue = function() {
	return [];
};

module.exports = create;
