var argv = require('yargs').argv;
var webpack = require('webpack');
var ClosureCompilerPlugin = require('webpack-closure-compiler');

var plugins = [];

if (argv.production) {
	plugins.push(new ClosureCompilerPlugin({
		compiler: {
			compilation_level: 'ADVANCED'
		}
	}));
}

module.exports = {
	output: {
		library: 'morphElement',
		libraryTarget: 'umd'
	},

	module: {
		loaders: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				loader: 'babel',
				query: {
					presets: ['es2015'],
					plugins: ['transform-flow-strip-types']
				}
			}
		]
	},

	node: {
		console: false,
		global: false,
		process: false,
		Buffer: false,
		__filename: false,
		__dirname: false,
		setImmediate: false
	},

	plugins: plugins
};
