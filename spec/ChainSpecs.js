var assert = require('assert');
var Chain = require('../lib/chain');

describe('Chain', function () {

	function fakeExec(command, callback) {
	}

	it('should create a chain with one command', function () {
		var chain = new Chain('echo hello', fakeExec);

		assert.equal(chain.commands.length, 1,
					'did not add a command to the chain');
		assert.equal(chain.first.commandText, 'echo hello',
					'did not set first command');
		assert.equal(chain.dispatcher, fakeExec, 'did not set the dispatcher');
	});

	it('should dispatch the first command', function (done) {
		var chain = new Chain('echo hello', fakeExec);
		chain.first = {
			dispatch: function (dispatcher) {
				assert.equal(dispatcher, fakeExec);
				done();
			}
		};

		chain.run();
	});

	describe('and', function () {

		it('should run both commands when the first succeeds', function () {
			var commands = [];
			var chain = new Chain('echo hello', function dispatcher(commandText, cb) {
				commands.push(commandText);
				cb();
			});

			chain.and('echo world');
			chain.run();

			assert.equal(commands.length, 2, 'did not run both commands');
			assert.equal(commands[0], 'echo hello');
			assert.equal(commands[1], 'echo world');
		});

		it('should proxy dispatching event', function (done) {
			var commands = [];
			var chain = new Chain('echo hello', function dispatcher(commandText, cb) {
				commands.push(commandText);
				cb();
			});

			chain.and('echo world');
			chain.on('command dispatching', function (commandText) {
				assert.equal(commandText, 'echo world');
				done();
			});
			chain.commands[1].emit('dispatching', 'foo');
		});

		it('should proxy error event', function (done) {
			var commands = [];
			var chain = new Chain('echo hello', function dispatcher(commandText, cb) {
				commands.push(commandText);
				cb();
			});

			chain.and('echo world');
			chain.on('error', function (cmd, err) {
				assert.equal(cmd.commandText, 'echo world');
				assert.equal(err, 'Error unhandled by chain: error!');
				done();
			});
			chain.commands[1].emit('error', 'error!');
		});

		it('should emit error event if first command fails', function () {
			var commands = [];
			var chain = new Chain('echo hello', function dispatcher(commandText, cb) {
				commands.push(commandText);
				cb('first command failed!');
			});

			chain.and('echo world');

			var callbackCalled = false;
			chain.on('error', function () {
				callbackCalled = true;
			});

			chain.run();
			assert.ok(callbackCalled);
		});

		it('should throw error if first command fails and no error event listener', function () {
			var commands = [];
			var chain = new Chain('echo hello', function dispatcher(commandText, cb) {
				commands.push(commandText);
				cb('first command failed!');
			});

			chain.and('echo world');

			var caught = false;
			try {
				chain.run();
			} catch (err) {
				caught = true;
			}

			assert.ok(caught);
		});
	});

	describe('or', function () {

		it('should run both commands when the first fails', function () {
			var commands = [];
			var chain = new Chain('echo hello', function dispatcher(commandText, cb) {
				commands.push(commandText);
				cb(new Error());
			});

			chain.or('echo world');
			chain.run();

			assert.equal(commands.length, 2, 'did not run both commands');
			assert.equal(commands[0], 'echo hello');
			assert.equal(commands[1], 'echo world');
		});

		it('should only run the first command when the first succeeds', function () {
			var commands = [];
			var chain = new Chain('echo hello', function dispatcher(commandText, cb) {
				commands.push(commandText);
				cb();
			});

			chain.or('echo world');
			chain.run();

			assert.equal(commands.length, 1, 'did not run only first command');
			assert.equal(commands[0], 'echo hello');
		});

	});

	describe('always', function () {

		it('should run both commands when the first fails', function () {
			var commands = [];
			var chain = new Chain('echo hello', function dispatcher(commandText, cb) {
				commands.push(commandText);
				cb(new Error());
			});

			chain.always('echo world');
			chain.run();

			assert.equal(commands.length, 2, 'did not run both commands');
			assert.equal(commands[0], 'echo hello');
			assert.equal(commands[1], 'echo world');
		});

		it('should run both commands when the first succeeds', function () {
			var commands = [];
			var chain = new Chain('echo hello', function dispatcher(commandText, cb) {
				commands.push(commandText);
				cb();
			});

			chain.always('echo world');
			chain.run();

			assert.equal(commands.length, 2, 'did not run only first command');
			assert.equal(commands[0], 'echo hello');
			assert.equal(commands[1], 'echo world');
		});

	});

	describe('ok', function () {

		it('should call the success callback when the previous command fails', function (done) {
			var chain = new Chain('echo hello', function failExec(command, cb) {
				process.nextTick(function () {
					cb(new Error('Not of interest'));
				});
			}).ok();

			chain.andFinally(function allDone(err, data) {
				assert.ok(!err);
				done();
			});
		});
	});

	describe('reset', function () {

		it('should set finished to false on all commands', function () {
			var chain = new Chain('echo hello', fakeExec);
			chain.and('echo world').and('echo');
			chain.commands.forEach(function (command) {
				command.finished = true;
			});

			chain.reset();

			chain.commands.forEach(function (command) {
				assert.ok(!command.finished,
						command.commandText + ' was finished');
			});
		});
	});

});
