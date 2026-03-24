const assert = require('node:assert');
const { test, suite, before, after } = require('node:test');
const mock = require('mock-fs');
const cli = require('../cli.js');

suite('checkPortNumber()', () => {
	test('User enters a non-numeric string as port number should return undefined', () => {
		assert(cli.checkPortNumber('sfsd') === undefined);
	});

	test('User enters an out-of-range port number should return undefined', () => {
		assert(cli.checkPortNumber(211) === undefined);
		assert(cli.checkPortNumber(-1231) === undefined);
		assert(cli.checkPortNumber(65536) === undefined);
		assert(cli.checkPortNumber(999999999) === undefined);
	});

	test('User enters a valid port number should return a number', () => {
		assert(cli.checkPortNumber('8000') === 8000);
	});

	test('User enters no port number should return undefined', () => {
		assert(cli.checkPortNumber() === undefined);
	});
});

suite('checkRequiredFlags()', () => {
	test('User misses required flag should return false', () => {
		assert(cli.checkRequiredFlags({}, ['baseurl']) === false);
	});

	test('User supplies correct flag should return true', () => {
		assert(cli.checkRequiredFlags({ baseurl: 'test' }, ['baseurl']) === true);
	});
});

suite('setOptions()', () => {
	test('Receives flags from cli should return with the correct flags set', () => {
		const flags = {
			baseurl: 'testurl',
			port: 9898,
			dest: 'testdest',
			source: 'testsource',
			overwrite: true,
		};
		const options = cli.setOptions(flags);
		assert(options.paths.baseurl === 'testurl');
		assert(options.serve.port === 9898);
		assert(options.paths.dest === 'testdest');
		assert(options.paths.src === 'testsource');

		assert(options.flags.split === 1);
		assert(options.flags.partition === 1);
	});
});

suite('run()', () => {
	before(() => {
		mock({ 'test/forTesting/image.jpg': 'imgdata' });
	});

	test('User enters invalid command should exit with code 2', async () => {
		const inputs = { flags: {}, input: ['invalidcommand'] };
		const exitCode = await cli.run(inputs);
		assert(exitCode === 2);
	});

	test('User enters valid command should exit with code (0)', async () => {
		const inputs = {
			flags: { baseurl: 'test', source: 'test/forTesting', dest: 'test/forTesting' },
			input: ['clone-assets'],
		};
		const exitCode = await cli.run(inputs);
		assert(exitCode === 0);
	});

	test('Command runs but fails should exit with code (1)', async () => {
		const inputs = {
			flags: { baseurl: 'test', source: 'test/invalidplace', dest: 'test/forTesting' },
			input: ['clone-assets'],
		};
		const exitCode = await cli.run(inputs);
		assert(exitCode === 1);
	});

	test('User misses required flag should exit with code 2', async () => {
		const inputs = { flags: {}, input: ['build'] };
		const exitCode = await cli.run(inputs);
		assert(exitCode === 2);
	});

	after(() => {
		mock.restore();
	});
});
