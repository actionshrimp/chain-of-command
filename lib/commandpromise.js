var util = require('util');
var Promise  = require('./promise');

function noop() {}

function CommandPromise(commandRunner, command, first) {
	var self = this;
	Promise.call(this);
	this.first = first || this;
	this.commandRunner = commandRunner;
	this.command = command;
}

util.inherits(CommandPromise, Promise);

// Execute the command
CommandPromise.prototype.dispatch = function dispatch() {
	var self = this;
	this.emit('start');
	this.commandRunner(this.command, function (err, output) {
		if (err) {
			self.reject(err);
		} else {
			self.resolve(output);
		}
	});
};

// Only execute the next command if this one is successful
CommandPromise.prototype.and = function and(command) {
	var nextCommand = new CommandPromise(this.commandRunner, command, this.first || this);
	this.addCallbacks(function (data) {
		nextCommand.dispatch();
	});

	return nextCommand;
}
;
// Only execute the next command if this one fails
CommandPromise.prototype.or = function or(command) {
	var nextCommand = new CommandPromise(this.commandRunner, command, this.first || this);
	this.addCallbacks(noop, function (data) {
		nextCommand.dispatch();
	});

	return nextCommand;
};

// Execute the next command regardless of whether this one succeeds
CommandPromise.prototype.then = function then(command) {
	var nextCommand = new CommandPromise(this.commandRunner, command, this.first || this);
	this.addCallbacks(function (data) {
		nextCommand.dispatch();
	}, function (data) {
		nextCommand.dispatch();
	});

	return nextCommand;
};

// Execute the sequence of commands and provide a callback to run when
// done.
CommandPromise.prototype.andFinally = function andFinally(callback) {
	var self = this;
	this.addCallbacks(function (data) {
		// Is this what we really want to do?  The `data` here will be the
		// output of the last command only.  How useful is that for the final
		// callback?  What would be preferable?
		callback(null, data);
	}, function (err) {
		callback(err);
	});

	this.first.dispatch();
};

// Execute the sequence of commands and wait until they're all done.
CommandPromise.prototype.andWait = function andWait() {
	this.first.dispatch();
};

module.exports = CommandPromise;
