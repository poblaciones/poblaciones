var path = require('path');
var configFile = '/index';
if(process.env.UPLOAD_ENV === 'upload') {
	configFile = '/index.upload';
} else if(process.env.UPLOAD_ENV === 'beta') {
	configFile = '/index.beta';
}
var config = require('../config' + configFile);

exports.assetsPath = function (_path) {
	var assetsSubDirectory = process.env.NODE_ENV === 'production'
    ? config.build.assetsSubDirectory
    : config.dev.assetsSubDirectory;
	return path.posix.join(assetsSubDirectory, _path);
};

exports.cssLoaders = function (options) {
	options = options || {};

	var cssLoader = {
		loader: 'css-loader',
		options: {
			sourceMap: options.sourceMap
		}
	};

  // generate loader string to be used with extract text plugin
	function generateLoaders (loader, loaderOptions) {
		var loaders = [cssLoader];
		if (loader) {
			loaders.push({
				loader: loader + '-loader',
				options: Object.assign({}, loaderOptions, {
					sourceMap: options.sourceMap
				})
			});
		}

		return ['vue-style-loader'].concat(loaders);
	}

  // https://vue-loader.vuejs.org/en/configurations/extract-css.html
	return {
		css: generateLoaders(),
		postcss: generateLoaders(),
		less: generateLoaders('less'),
		sass: generateLoaders('sass', { indentedSyntax: true }),
		scss: generateLoaders('sass'),
		stylus: generateLoaders('stylus'),
		styl: generateLoaders('stylus')
	};
};

// Generate loaders for standalone style files (outside of .vue)
exports.styleLoaders = function (options) {
	var output = [];
	var loaders = exports.cssLoaders(options);
	for (var extension in loaders) {
		var loader = loaders[extension];
		output.push({
			test: new RegExp('\\.' + extension + '$'),
			use: loader
		});
	}
	return output;
};
