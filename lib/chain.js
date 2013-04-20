var util = require('util');
var Command  = require('./command');
var EventEmitter = require('events').EventEmitter;

function noop() {}

function Chain(commandText, dispatcher) {
	EventEmitter.call(this);
	var firstCommand = new Command(commandText);
	this.dispatcher = dispatcher;
	this.first = firstCommand;
	this.last = firstCommand;
	this.commands = [firstCommand];
}

util.inherits(Chain, EventEmitter);

// Execute the chain
Chain.prototype.run = function run() {
	var self = this;
	this.emit('start');
	this.first.dispatch(this.dispatcher);
};

// Reset the chain, so it can be run again
Chain.prototype.reset = function reset() {
	var self = this;
	this.commands.forEach(function resetCommand(command) {
		command.finished = false;
	});
	this.emit('reset');
};

// Only execute the next command if the last is successful
Chain.prototype.and = function and(commandText) {
	var nextCommand = new Command(commandText);
	this.last.addCallbacks(function (data) {
		nextCommand.dispatch(this.dispatcher);
	}.bind(this));

	this.commands.push(nextCommand);
	this.last = nextCommand;

	return this;
}
;
// Only execute the next command if the last fails
Chain.prototype.or = function or(commandText) {
	var nextCommand = new Command(commandText);
	this.last.addCallbacks(noop, function (data) {
		nextCommand.dispatch(this.dispatcher);
	}.bind(this));

	this.commands.push(nextCommand);
	this.last = nextCommand;

	return this;
};

// Execute the next command regardless of whether the last one succeeds
Chain.prototype.then = function then(commandText) {
	var nextCommand = new Command(commandText);

	function dispatchNextCommand(data) {
		nextCommand.dispatch(this.dispatcher);
	}

	this.last.addCallbacks(dispatchNextCommand.bind(this),
						dispatchNextCommand.bind(this));

	this.commands.push(nextCommand);
	this.last = nextCommand;

	return this;
};

// Execute the sequence of commands and provide a callback to run when
// done.
Chain.prototype.andFinally = function andFinally(callback) {
	this.last.addCallbacks(function (data) {
		this.emit('end');
		// Is this what we really want to do?  The `data` here will be the
		// output of the last command only.  How useful is that for the final
		// callback?  What would be preferable?
		callback(null, data);
	}.bind(this), function (err) {
		this.emit('error', err);
		callback(err);
	}.bind(this));

	this.run();
};

// Execute the sequence of commands and wait until they're all done.
Chain.prototype.andWait = function andWait() {
	this.run();
};

module.exports = Chain;
