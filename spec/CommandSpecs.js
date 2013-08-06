var sinon = require('sinon');
var assert = require('assert');
var sinonChai = require('sinon-chai');
var Command = require('../lib/command.js');

describe('Command', function () {

	var succeed = function fakeSucceed() {
		succeed.calls++;
	};
	var fail = function fakeFailed() {
		fail.calls++;
	};
	var noop = function noop() {};

	beforeEach(function () {
		succeed.calls = 0;
		fail.calls = 0;
	});

	it('should setup the properties', function () {
		var command = new Command('echo hello');

		assert.equal(command.commandText, 'echo hello');
		assert.ok(command.successCallback);
		assert.ok(command.failureCallback);
	});

	describe('promised function', function () {

		it('should resolve the command when the callback succeeds', function (done) {
			var command = new Command(function fakeAsync(cb) {
				process.nextTick(function () {
					cb(null, 'yay');
				});
			});
			var fail = function fakeErrCb(err) {
				done(err);
			};
			var complete = function fakeSuccessCb(output) {
				assert.equal(output, 'yay');
				done();
			};

			command.addCallbacks(complete, fail);
			command.dispatch();
		});

		it('should reject the command when the callback fails', function (done) {
			var command = new Command(function fakeAsync(cb) {
				process.nextTick(function () {
					cb(new Error('Oh noes!'));
				});
			});
			var fail = function fakeErrCb(err) {
				assert.equal(err.message, 'Oh noes!');
				done();
			};
			var complete = function fakeSuccessCb(output) {
				done(output);
			};

			command.addCallbacks(complete, fail);
			command.dispatch();
		});

	});

	describe('addCallbacks', function () {

		it('should add success and failure callbacks', function () {
			var command = new Command('echo hello');
			var succeed = noop;
			var fail = noop;

			command.addCallbacks(succeed, fail);

			assert.strictEqual(command.successCallback, succeed);
			assert.strictEqual(command.failureCallback, fail);
		});

		it('should throw when no success and failure callbacks are given', function () {
			var command = new Command('echo hello');

			try{
				command.addCallbacks(undefined, undefined);
			} catch (err){
				return assert.ok(err);
			}
			assert.fail("Should have thrown an error");
		});

		it('should call success callback when resolving', function () {
			var command = new Command('echo hello');

			command.addCallbacks(succeed, fail);
			command.resolve('YAY!');

			assert.equal(succeed.calls, 1);
			assert.equal(fail.calls, 0);
		});

	});

	it('should emit complete event when resolving', function () {
		var command = new Command('echo hello');
		var fail = sinon.spy();

		command.addCallbacks(succeed, noop);
		command.on('complete', succeed);
		command.resolve('YAY!');
		assert.equal(succeed.calls, 2, 'succeed should have been called twice');
	});

	it('should emit complete event when rejecting', function () {
		var command = new Command('echo hello');
		var succeed = sinon.spy();
		var fail = sinon.spy();
		var complete = function fakeComplete() {
			complete.calls++;
		};
		complete.calls = 0;

		command.addCallbacks(succeed, fail);
		command.on('complete', complete);
		command.reject('YAY!');

		assert.equal(complete.calls, 1);
	});

	describe('reject', function () {

		it('should call failure callback when rejecting', function () {
			var command = new Command('echo hello');

			command.addCallbacks(succeed, fail);
			command.reject(new Error());

			assert.equal(succeed.calls, 0);
			assert.equal(fail.calls, 1);
		});

		it('should emit error event when no failure callback and rejecting', function () {
			var command = new Command('echo hello');
			var error = new Error();
			var threw = false;
			var errorListener = sinon.spy();

			command.addCallbacks(succeed);
			command.on('error', errorListener);
			command.reject(error);

			assert(errorListener.calledOnce);
			assert(errorListener.calledWith(error));
		});

	});

	describe('dispatch', function () {

		it('should resolve on success', function (done) {
			var command = new Command('echo hello');
			var output = 'OK';
			command.addCallbacks(function (data) {
				assert.equal(data, output);
				done();
			});

			command.dispatch(function fakeDispatcher(commandText, callback) {
				assert.equal(command.commandText, commandText);
				callback(null, output);
			});
		});

		it('should reject on failure', function (done) {
			var command = new Command('echo hello');
			var err = new Error('Oh noes');
			command.addCallbacks(function () {}, function (data) {
				assert.equal(data, err);
				done();
			});

			command.dispatch(function fakeDispatcher(commandText, callback) {
				assert.equal(command.commandText, commandText);
				callback(err);
			});
		});
	});

});
