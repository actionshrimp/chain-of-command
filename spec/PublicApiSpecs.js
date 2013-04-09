var assert = require('assert');

describe('Public API', function () {

	it('should expose chain', function () {
		var api = require('../');
		assert.equal(typeof api, 'function');
		assert.equal(api.name, 'Chain');
	});

});
