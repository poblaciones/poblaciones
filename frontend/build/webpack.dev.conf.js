const { VueLoaderPlugin } = require('vue-loader')
var utils = require('./utils');
var webpack = require('webpack');
var config = require('../config');
var merge = require('webpack-merge');
var baseWebpackConfig = require('./webpack.base.conf');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin');

process.traceDeprecation = true;
// add hot-reload related code to entry chunks
Object.keys(baseWebpackConfig.entry).forEach(function (name) {
	baseWebpackConfig.entry[name] = ['./build/dev-client'].concat(baseWebpackConfig.entry[name]);
});

module.exports = merge(baseWebpackConfig, {
	mode: 'development',
	module: {
		rules: utils.styleLoaders({ sourceMap: config.dev.cssSourceMap })
	},

	// cheap-module-eval-source-map is faster for development
	devtool: '#cheap-module-eval-source-map',
	plugins: [
		new VueLoaderPlugin(),
		new webpack.DefinePlugin({
			'process.env': config.dev.env,
		}),
		// https://github.com/glenjamin/webpack-hot-middleware#installation--usage
		new webpack.HotModuleReplacementPlugin(),
		new webpack.NoEmitOnErrorsPlugin(),
		// https://github.com/ampedandwired/html-webpack-plugin
		new HtmlWebpackPlugin({
			filename: 'backoffice.html',
			template: 'backoffice.html',
			metadata: { google_maps_key: config.dev.env.google_maps_key.replace(/"/g, '') },
			chunks: ['appAdmin'],
			inject: true
		}),
		new HtmlWebpackPlugin({
			filename: 'index.html',
			template: 'index.html',
			metadata: {
				google_maps_key: config.dev.env.google_maps_key.replace(/"/g, ''),
				google_analytics_key: config.dev.env.google_analytics_key.replace(/"/g, ''),
				add_this_key: config.dev.env.add_this_key.replace(/"/g, ''),
			},
			chunks: ['app'],
			inject: true
		}),
		new FriendlyErrorsPlugin()
	]
});
