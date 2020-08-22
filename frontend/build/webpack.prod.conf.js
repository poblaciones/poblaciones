var path = require('path');
var utils = require('./utils');
var webpack = require('webpack');
var configFile = '/index';
if(process.env.UPLOAD_ENV === 'upload') {
	configFile = '/index.upload';
} else if(process.env.UPLOAD_ENV === 'beta') {
	configFile = '/index.beta';
}
var config = require('../config' + configFile);
var merge = require('webpack-merge');
var baseWebpackConfig = require('./webpack.base.conf');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var MiniCssExtractPlugin = require("mini-css-extract-plugin");
var OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin');
var SpriteLoaderPlugin = require('svg-sprite-loader/plugin');
const { VueLoaderPlugin } = require('vue-loader');
const TerserPlugin = require('terser-webpack-plugin');
var env = config.build.env;

process.traceDeprecation = true;

var webpackConfig = merge(baseWebpackConfig, {
	mode: 'production',
	optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
	module: {
		rules: utils.styleLoaders({
			sourceMap: config.build.productionSourceMap,
				extract: true
		})
	},
	devtool: config.build.productionSourceMap ? '#source-map' : false,
	output: {
		path: config.build.assetsRoot,
		filename: utils.assetsPath('js/[name].[chunkhash].js'),
		chunkFilename: utils.assetsPath('js/[id].[chunkhash].js')
	},
	plugins: [
		// http://vuejs.github.io/vue-loader/en/workflow/production.html
		new VueLoaderPlugin(),
		new webpack.DefinePlugin({
			'process.env': env
		})/*new webpack.optimize.UglifyJsPlugin({
			compress: {
				warnings: false
			},
			sourceMap: true
		})*/,
		// extract css into its own file
		new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: "[name].css",
      chunkFilename: "[id].css"
    }),
		// Compress extracted CSS. We are using this plugin so that possible
		// duplicated CSS from different components can be deduped.
		new OptimizeCSSPlugin({
			cssProcessorOptions: {
				safe: true
			}
		}),
		new SpriteLoaderPlugin(),
		// generate dist index.html with correct asset hash for caching.
		// you can customize output by editing /index.html
		// see https://github.com/ampedandwired/html-webpack-plugin
		new HtmlWebpackPlugin({
			filename: config.build.index,
			template: 'index.html',
			metadata: {
				google_maps_key: env.google_maps_key.replace(/"/g, ''),
				google_analytics_key: env.google_analytics_key.replace(/"/g, ''),
				add_this_key: env.add_this_key.replace(/"/g, ''),
			},
			chunks: ['manifest', 'vendor', 'app'],
			inject: true,
			minify: {
				removeComments: true,
				collapseWhitespace: true,
				removeAttributeQuotes: true
			}
		}),
		new HtmlWebpackPlugin({
			filename: config.build.indexBackoffice,
			template: 'backoffice.html',
			metadata: { google_maps_key: env.google_maps_key.replace(/"/g, '') },
			chunks: ['manifest', 'vendor', 'appBackoffice'],
			inject: true,
			minify: {
				removeComments: true,
				collapseWhitespace: true,
				removeAttributeQuotes: true
			}
		}),
		new HtmlWebpackPlugin({
			filename: config.build.indexAdmin,
			template: 'admins.html',
			metadata: { google_maps_key: env.google_maps_key.replace(/"/g, '') },
			chunks: ['manifest', 'vendor', 'appAdmin'],
			inject: true,
			minify: {
				removeComments: true,
				collapseWhitespace: true,
				removeAttributeQuotes: true
			}
		}),
		// copy custom static assets
		new CopyWebpackPlugin({
			patterns: [
				{
					from: path.resolve(__dirname, '../static'),
					to: config.build.assetsSubDirectory,
					globOptions: { ignore: ['.*'] }
				},
			]
		})
	]
});

if (config.build.productionGzip) {
	var CompressionWebpackPlugin = require('compression-webpack-plugin');

	webpackConfig.plugins.push(
		new CompressionWebpackPlugin({
			asset: '[path].gz[query]',
			algorithm: 'gzip',
			test: new RegExp(
				'\\.(' +
				config.build.productionGzipExtensions.join('|') +
				')$'
			),
			threshold: 10240,
			minRatio: 0.8
		})
	);
}

if (config.build.bundleAnalyzerReport) {
	var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
	webpackConfig.plugins.push(new BundleAnalyzerPlugin());
}

module.exports = webpackConfig;
