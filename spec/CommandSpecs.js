var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var assert = require('assert');
var sinonChai = require('sinon-chai');
var Command = require('../lib/command.js');

chai.use(sinonChai);

describe('Command', function () {

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
			}
			var complete = function fakeSuccessCb(output) {
				assert.equal(output, 'yay');
				done();
			}

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
			}
			var complete = function fakeSuccessCb(output) {
				done(output);
			}

			command.addCallbacks(complete, fail);
			command.dispatch();
		});

	});

	describe('addCallbacks', function () {

		it('should add success and failure callbacks', function () {
			var command = new Command('echo hello');
			var succeed = function succeed(data) {};
			var fail = function fail(err, data) {};

			command.addCallbacks(succeed, fail);

			expect(command.successCallback).to.equal(succeed);
			expect(command.failureCallback).to.equal(fail);
		});

		it('should throw when no success and failure callbacks are given', function () {
			var command = new Command('echo hello');

			expect(command.addCallbacks).to.throw(Error);
		});

		it('should call success callback when resolving', function () {
			var command = new Command('echo hello');
			var succeed = sinon.spy();
			var fail = sinon.spy();

			command.addCallbacks(succeed, fail);
			command.resolve('YAY!');

			expect(command.successCallback).to.have.been.called;
			expect(command.failureCallback).not.to.have.been.called;
		});

	});
	it('should emit complete event when resolving', function () {
		var command = new Command('echo hello');
		var succeed = sinon.spy();
		var fail = sinon.spy();
		var complete = sinon.spy();

		command.addCallbacks(succeed, fail);
		command.on('complete', complete);
		command.resolve('YAY!');

		expect(complete).to.have.been.called;
	});

	it('should emit complete event when rejecting', function () {
		var command = new Command('echo hello');
		var succeed = sinon.spy();
		var fail = sinon.spy();
		var complete = sinon.spy();

		command.addCallbacks(succeed, fail);
		command.on('complete', complete);
		command.reject('YAY!');

		expect(complete).to.have.been.called;
	});

	describe('reject', function () {

		it('should call failure callback when rejecting', function () {
			var command = new Command('echo hello');
			var succeed = sinon.spy();
			var fail = sinon.spy();

			command.addCallbacks(succeed, fail);
			command.reject(new Error());

			expect(command.successCallback).not.to.have.been.called;
			expect(command.failureCallback).to.have.been.called;
		});

		it('should throw when no failure callback and rejecting', function () {
			var command = new Command('echo hello');
			var succeed = sinon.spy();
			var error = new Error();
			var threw = false;

			command.addCallbacks(succeed);
			try {
				command.reject(error);
			} catch (err) {
				threw = true;
				expect(err).to.eql(error);
			}

			expect(threw).to.equal(true);
			expect(command.successCallback).not.to.have.been.called;
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
