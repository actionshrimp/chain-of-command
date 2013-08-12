var util = require('util');
var Command  = require('./command');
var EventEmitter = require('events').EventEmitter;

function noop() {}

function Chain(commandText, dispatcher) {
	EventEmitter.call(this);
	var firstCommand = new Command(commandText);
	this.dispatcher = dispatcher;
	this.first = firstCommand;
	this.commands = [];
	this.addCommand(firstCommand);
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
	}.bind(this), function (err) {
		this.emit('error', err);
	}.bind(this));

	this.addCommand(nextCommand);

	return this;
};

// Only execute the next command if the last fails
Chain.prototype.or = function or(commandText) {
	var nextCommand = new Command(commandText);
	this.last.addCallbacks(noop, function (data) {
		nextCommand.dispatch(this.dispatcher);
	}.bind(this));

	this.addCommand(nextCommand);

	return this;
};

// Execute the next command regardless of whether the last one succeeds
Chain.prototype.always = function always(commandText) {
	var nextCommand = new Command(commandText);

	function dispatchNextCommand(data) {
		nextCommand.dispatch(this.dispatcher);
	}

	this.last.addCallbacks(dispatchNextCommand.bind(this),
						dispatchNextCommand.bind(this));

	this.addCommand(nextCommand);

	return this;
};

Chain.prototype.addCommand = function addCommand(nextCommand) {
	var self = this;
	nextCommand.on('dispatching', function proxydispatching() {
		self.emit('command dispatching', this.commandText);
	});
	nextCommand.on('complete', function proxycomplete(output) {
		self.emit('command complete', this, output);
	});
	nextCommand.on('error', function proxyerror(err) {
		self.emit('error', this, 'Error unhandled by chain: ' + err);
	});
	this.commands.push(nextCommand);
	this.last = nextCommand;
};

// Execute the sequence of commands and provide a callback to run when
// done.
Chain.prototype.andFinally = function andFinally(callback) {
	this.last.addCallbacks(function (data) {
		this.emit('end');
		callback(null, data);
	}.bind(this), function (err) {
		this.emit('error', err);
		callback(err);
	}.bind(this));

	this.run();
};

Chain.prototype.ok = function ok() {
	return this.always(function swallowPreviousFailure(cb) {
		process.nextTick(function ensureAsync() {
			cb();
		});
	});
};

// Execute the sequence of commands and wait until they're all done.
Chain.prototype.andWait = function andWait() {
	this.run();
};

module.exports = Chain;
