var EventEmitter = require('events').EventEmitter;
var util = require('util');

// A function that does nothing!
function noop() {}

// Creates a new `Command` - effectively a promise implementation for
// representing the pending result of an asynchronous command
//
// @constructor
function Command(commandText) {
	if (typeof commandText === 'string') {
		this.commandText = commandText;
	} else {
		this.func = commandText;
	}

	this.finished = false;
	this.successCallback = noop;
	this.failureCallback = noop;
}

util.inherits(Command, EventEmitter);

// Dispatch this command using the supplied dispatcher and resolve or reject
// the promise depending on the result.
//
// param @{function} `dispatcher` - the function that will take the command
// text and execute it
Command.prototype.dispatch = function dispatch(dispatcher) {
	function proxyResult(err, output) {
		if (err) {
			this.reject(err);
		} else {
			this.resolve(output);
		}
	}
	if (this.commandText) {
		this.emit('dispatching', this.commandText);
		dispatcher(this.commandText, proxyResult.bind(this));
	} else {
		this.emit('dispatching', '[func]');
		this.func(proxyResult.bind(this));
	}
};

// Signal that the asynchronous operation associated with this
// promise has completed successfully and fire the callback.
//
// @param {string} `data` - the accumulated output from the asynchronous
// operation.
Command.prototype.resolve = function resolve(data) {
	this.emit('complete', data);
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
// @param {string} `data` - any accumulated output from the asynchronous
// operation before the error occurred.
Command.prototype.reject = function reject(err, data) {
	if (this.failureCallback && !this.finished) {
		this.finished = true;
		this.emit('complete', data);
		this.failureCallback(err, data);
	} else {
		this.finished = true;
		throw err;
	}
};

// Add callbacks to fire when the asynchronous operation associated
// with this promise either completes successfully or with an error
//
// @param {Function} `successCallback` - the function to call when the
// asynchronous operation succeeds.
//
// @param {Function} `failureCallback` - the function to call when the
// asynchronous operation fails.
Command.prototype.addCallbacks = function addCallbacks(successCallback, failureCallback) {
	var self = this;
	if (!successCallback) {
		throw new Error("You must supply a callback");
	}

	this.successCallback = successCallback;
	this.failureCallback = failureCallback;
};

module.exports = Command;
