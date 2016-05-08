var webpack = require('webpack');

module.exports = {
	output: {
		library: 'morphElement',
		libraryTarget: 'umd'
	},

	node: {
		console: false,
		global: false,
		process: false,
		Buffer: false,
		__filename: false,
		__dirname: false,
		setImmediate: false
	}
};
