// see http://vuejs-templates.github.io/webpack for documentation.
var path = require('path');

var devenv = './dev.env';
if(process.env.npm_config_lamp) {
	devenv = './lamp.env';
}

module.exports = {
	build: {
		env: {} ,
		index: path.resolve(__dirname, '../../services/templates/index.html.twig'),
		indexBackoffice: path.resolve(__dirname, '../../services/templates/backoffice.html.twig'),
		indexAdmin: path.resolve(__dirname, '../../services/templates/admins.html.twig'),
		indexCredentials: path.resolve(__dirname, '../../services/templates/credentials.html.twig'),
		indexTable: path.resolve(__dirname, '../../services/templates/table.html.twig'),
		assetsRoot: path.resolve(__dirname, '../../services/web'),
		assetsSubDirectory: 'static',
		assetsPublicPath: '/',
		productionSourceMap: true,
		// Gzip off by default as many popular static hosts such as
		// Surge or Netlify already gzip all static assets for you.
		// Before setting to `true`, make sure to:
		// npm install --save-dev compression-webpack-plugin
		productionGzip: false,
		productionGzipExtensions: ['js', 'css'],
		// Run the build command with an extra argument to
		// View the bundle analyzer report after build finishes:
		// `npm run build --report`
		// Set to `true` or `false` to always turn it on or off
		bundleAnalyzerReport: process.env.npm_config_report
	},
	dev: {
		env: require(devenv),
		port: 8000,
		autoOpenBrowser: false,
		assetsSubDirectory: 'static',
		assetsPublicPath: '/',
		proxyTable: {},
		// CSS Sourcemaps off by default because relative paths are "buggy"
		// with this option, according to the CSS-Loader README
		// (https://github.com/webpack/css-loader#sourcemaps)
		// In our experience, they generally work as expected,
		// just be aware of this issue when enabling this option.
		cssSourceMap: false
	}
};
