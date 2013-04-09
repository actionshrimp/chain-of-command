var assert = require('assert');
var Chain = require('../lib/chain');

describe('Chain', function () {

	function fakeExec(command, callback) {

	}
	
	it('should create a chain with one command', function () {
		var chain = new Chain(fakeExec, 'echo hello');

		assert.equal(chain.commands.length, 1, 
					'did not add a command to the chain');
		assert.equal(chain.first.commandText, 'echo hello', 
					'did not set first command');
		assert.equal(chain.dispatcher, fakeExec, 'did not set the dispatcher');
	});

	it('should dispatch the first command', function (done) {
		var chain = new Chain(fakeExec, 'echo hello');
		chain.first = {
			dispatch: function (dispatcher) {
				assert.equal(dispatcher, fakeExec);
				done();
			}
		};

		chain.run();
	});

});
