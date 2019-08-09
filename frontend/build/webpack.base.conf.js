var path = require('path');
var utils = require('./utils');
var configFile = '/index';
if(process.env.UPLOAD_ENV === 'upload') {
	configFile = '/index.upload';
} else if(process.env.UPLOAD_ENV === 'beta') {
	configFile = '/index.beta';
}
var config = require('../config' + configFile);
var vueLoaderConfig = require('./vue-loader.conf');

function resolve (dir) {
	return path.join(__dirname, '..', dir);
}

module.exports = {
	entry: {
		app: './src/public/main.js',
		appAdmin: './src/backoffice/main.js',
	},
	output: {
		path: config.build.assetsRoot,
		filename: '[name].js',
		publicPath: process.env.NODE_ENV === 'production'
      ? config.build.assetsPublicPath
      : config.dev.assetsPublicPath
	},
	resolve: {
		extensions: ['.js', '.vue', '.json'],
		alias: {
			'vue$': 'vue/dist/vue.esm.js',
			'@': resolve('src')
		}
	},
	module: {
		rules: [
			{
				test: /\.(js|vue)$/,
				loader: 'eslint-loader',
				enforce: 'pre',
				include: [resolve('src'), resolve('test')],
				options: {
					formatter: require('eslint-friendly-formatter')
				}
			},
			{
				test: /\.vue$/,
				loader: 'vue-loader',
				options: vueLoaderConfig
			},
			{
				test: /\.js$/,
				loader: 'babel-loader',
				include: [resolve('src'), resolve('test')]
			},
			{
				test: /\.(png|jpe?g|gif)(\?.*)?$/,
				loader: 'url-loader',
				exclude: [resolve('src/backoffice/icons')],
        options: {
					limit: 10000,
					name: utils.assetsPath('img/[name].[hash:7].[ext]')
				}
			},
			 {
        test: /\.svg$/,
        loader: 'vue-svg-loader',
      },
			{
				test: /\.(svg)(\?.*)?$/,
				loader: 'svg-sprite-loader',
				include: [resolve('src/backoffice/icons')],
				options: {
					symbolId: 'icon-[name]'
				}
			},
			{
				test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
				loader: 'url-loader',
				options: {
					limit: 10000,
					name: utils.assetsPath('media/[name].[hash:7].[ext]')
				}
			},
			{
				test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
				loader: 'url-loader',
				options: {
					limit: 10000,
					name: utils.assetsPath('fonts/[name].[hash:7].[ext]')
				}
			}
		]
	}
};
