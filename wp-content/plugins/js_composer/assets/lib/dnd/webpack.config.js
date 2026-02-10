const path = require( 'path' );
const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = {
	entry: './src/index.js', // TODO: entry point will be chaged in the next task
	output: {
		filename: 'bundle.js',
		path: path.resolve( __dirname, 'dist' )
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader'
				}
			}
		]
	},
	plugins: [
		new ESLintPlugin({
			overrideConfigFile: path.resolve(__dirname, 'eslint.config.js'),
			extensions: ['js'],
			files: 'src/**/*.js',
			fix: true,
			failOnError: false,
			failOnWarning: false,
			cache: true,
			cacheLocation: path.resolve(__dirname, 'node_modules/.cache/.eslintcache')
		})
	],
	mode: 'development'
};
