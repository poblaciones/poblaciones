var utils = require('./utils');
var configFile = '/index';
if(process.env.UPLOAD_ENV === 'upload') {
	configFile = '/index.upload';
}
var config = require('../config' + configFile);
var isProduction = process.env.NODE_ENV === 'production';

module.exports = {
	loaders: utils.cssLoaders({
		sourceMap: isProduction
      ? config.build.productionSourceMap
      : config.dev.cssSourceMap,
		extract: isProduction
	}),
	transformToRequire: {
		video: 'src',
		source: 'src',
		img: 'src',
		image: 'xlink:href'
	}
};
