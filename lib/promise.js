var EventEmitter = require('events').EventEmitter;
var util = require('util');

// A function that does nothing!
function noop() {}

// Creates a new `Promise`
//
// @constructor
function Promise() {
	this.finished = false;
	this.successCallback = noop;
	this.failureCallback = noop;
}

util.inherits(Promise, EventEmitter);

// Signal that the asynchronous operation associated with this
// promise has completed successfully and fire the callback.
//
// @{string} `data` - the accumulated output from the asynchronous
// operation.
Promise.prototype.resolve = function resolve(data) {
	this.emit('complete');
	if (this.successCallback  && !this.finished) {
		this.finished = true;
		this.successCallback(data);
	}
};

// Signal that the asynchronous operation associated with this
// promise has completed with an error and fire the callback.
//
// @param {string} `err` - the error object that caused the asynchronous
// operation to fail.
//
// @param{string} `data` - any accumulated output from the asynchronous
// operation before the error occurred.
Promise.prototype.reject = function reject(err, data) {
	this.emit('complete');
	if (this.failureCallback && !this.finished) {
		this.finished = true;
		this.failureCallback(err, data);
	} else {
		this.finished = true;
		throw err;
	}
};

// Add callbacks to fire when the asynchronous operation associated
// with this promise either completes successfully or with an error
//
// @param {string} `successCallback` - the function to call when the
// asynchronous operation succeeds.
//
// @param {string} `failureCallback` - the function to call when the
// asynchronous operation fails.
Promise.prototype.addCallbacks = function addCallbacks(successCallback, failureCallback) {
	var self = this;
	if (!successCallback) {
		throw new Error("You must supply a callback");
	}

	this.successCallback = successCallback;
	this.failureCallback = failureCallback;
};

module.exports = Promise;