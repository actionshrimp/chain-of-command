var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var Command = require('../lib/command.js');

chai.use(sinonChai);

describe('Command', function () {

	it('should default success and failure', function () {
		var promise = new Command();

		expect(promise.successCallback).to.exist;
		expect(promise.failureCallback).to.exist;
	});

	it('should add success and failure callbacks', function () {
		var promise = new Command();
		var succeed = function succeed(data) {};
		var fail = function fail(err, data) {};

		promise.addCallbacks(succeed, fail);

		expect(promise.successCallback).to.equal(succeed);
		expect(promise.failureCallback).to.equal(fail);
	});

	it('should throw when no success and failure callbacks are given', function () {
		var promise = new Command();
		
		expect(promise.addCallbacks).to.throw(Error);
	});

	it('should call success callback when resolving', function () {
		var promise = new Command();
		var succeed = sinon.spy();
		var fail = sinon.spy();

		promise.addCallbacks(succeed, fail);
		promise.resolve('YAY!');

		expect(promise.successCallback).to.have.been.called;
		expect(promise.failureCallback).not.to.have.been.called;
	});

	it('should emit complete event when resolving', function () {
		var promise = new Command();
		var succeed = sinon.spy();
		var fail = sinon.spy();
		var complete = sinon.spy();

		promise.addCallbacks(succeed, fail);
		promise.on('complete', complete);
		promise.resolve('YAY!');

		expect(complete).to.have.been.called;
	});

	it('should emit complete event when rejecting', function () {
		var promise = new Command();
		var succeed = sinon.spy();
		var fail = sinon.spy();
		var complete = sinon.spy();

		promise.addCallbacks(succeed, fail);
		promise.on('complete', complete);
		promise.reject('YAY!');

		expect(complete).to.have.been.called;
	});

	it('should call failure callback when rejecting', function () {
		var promise = new Command();
		var succeed = sinon.spy();
		var fail = sinon.spy();

		promise.addCallbacks(succeed, fail);
		promise.reject(new Error());

		expect(promise.successCallback).not.to.have.been.called;
		expect(promise.failureCallback).to.have.been.called;
	});

	it('should throw when no failure callback and rejecting', function () {
		var promise = new Command();
		var succeed = sinon.spy();
		var error = new Error();
		var threw = false;

		promise.addCallbacks(succeed);
		try {
			promise.reject(error);
		} catch (err) {
			threw = true;
			expect(err).to.eql(error);
		}
		
		expect(threw).to.equal(true);
		expect(promise.successCallback).not.to.have.been.called;
	});

});
