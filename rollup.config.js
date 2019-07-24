'use strict';

const path = require('path');
const babel = require('rollup-plugin-babel');
const svelte = require('rollup-plugin-svelte');
const alias = require('rollup-plugin-alias');
const babelCore = require('@babel/core');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');

module.exports = {
	input: 'index.js',
	output: [
		{
			file: 'index.cjs.js',
			format: 'cjs',
			sourcemap: true
		},
		{
			file: 'index.esm.js',
			format: 'esm',
			sourcemap: true
		}
	],
	plugins: [
		alias({
			'keycode-js': require.resolve('keycode-js/lib/KeyCode')
		}),
		svelte({
			legacy: true
		}),
		{
			async transform(code, id) {
				if (!id.includes('lib/index.svelte')) {
					return;
				}
				const result = await babelCore.transformAsync(code, {
					sourceMaps: true,
					plugins: [useMountedNodePlugin()]
				});
				return {
					code: result.code,
					map: result.map
				};
			}
		},
		babel({
			exclude: 'node_modules/**',
			extensions: ['.js', '.svelte']
		}),
		babel({
			include: 'node_modules/svelte/shared.js',
			runtimeHelpers: true,
			babelrc: false,
			configFile: path.resolve(__dirname, '.babelrc')
		}),
		resolve(),
		commonjs()
	],
	external: ['manage-side-effects']
};

function useMountedNodePlugin() {
	return babelCore.createConfigItem(({ types: t }) => {
		return {
			visitor: {
				Identifier(path, state) {
					if (
						path.node.name === 'createElement' &&
						path.findParent(
							(path) =>
								path.isCallExpression() &&
								path.get('arguments')[0].isStringLiteral() &&
								path.get('arguments')[0].get('value').node ===
									'input'
						) &&
						path.findParent(
							(path) =>
								path.isFunctionDeclaration() &&
								path.get('id.name').node ===
									'create_main_fragment'
						)
					) {
						path.parentPath.replaceWith(
							t.memberExpression(
								t.memberExpression(
									t.identifier('component'),
									t.identifier('options')
								),
								t.identifier('elementToHandle')
							)
						);
					}
					if (
						path.node.name === 'd' &&
						path.parentPath.isObjectMethod() &&
						path.findParent(
							(path) =>
								path.isFunctionDeclaration() &&
								path.get('id.name').node ===
									'create_main_fragment'
						)
					) {
						path.parentPath
							.get('body')
							.unshiftContainer('body', [
								t.expressionStatement(
									t.callExpression(
										t.memberExpression(
											t.memberExpression(
												t.memberExpression(
													t.identifier('component'),
													t.identifier('options')
												),
												t.identifier('target')
											),
											t.identifier('appendChild')
										),
										[t.identifier('input')]
									)
								)
							]);
					}
				}
			}
		};
	});
}
