'use strict';

const babel = require('rollup-plugin-babel');

module.exports = {
	input: 'index.js',
	output: [
		{
			file: 'index.cjs.js',
			format: 'cjs'
		},
		{
			file: 'index.esm.js',
			format: 'esm'
		}
	],
	plugins: [
		babel({
			exclude: 'node_modules/**'
		})
	],
	external: [
		'jquery',
		'throttle-debounce'
	]
};
