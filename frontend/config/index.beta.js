// see http://vuejs-templates.github.io/webpack for documentation.
var path = require('path');
var replace = require('replace');

module.exports = {
	build: {
		env: require('./beta.env'),
		index: path.resolve(__dirname, '../../build/release/templates/index.html.twig'),
		indexAdmin: path.resolve(__dirname, '../../build/release/templates/backoffice.html.twig'),
		main: path.resolve(__dirname, '../src/public/main.js'),
		mainAdmin: path.resolve(__dirname, '../src/backoffice/main.js'),
		assetsRoot: path.resolve(__dirname, '../../build/release/web'),
		assetsSubDirectory: 'static',
		assetsPublicPath: '/',
		productionSourceMap: true,
		productionGzip: false,
		productionGzipExtensions: ['js', 'css'],
		bundleAnalyzerReport: process.env.npm_config_report
	},
	preProcess() {
		var replaces = [
			{ reg: 'process.env.host', repl: this.build.env.host, },
		];
		this.doReplace(replaces);
	},
	posProcess() {
		var replaces = [
			{ reg: this.build.env.host, repl: 'process.env.host' },
		];
		this.doReplace(replaces);
	},
	doReplace(replaces) {
		const loc = this;
		replaces.forEach(function(obj) {
			replace({
				regex: obj.reg,
				replacement: obj.repl,
				paths: [
					loc.build.main,
					loc.build.mainAdmin,
				],
				silent: true,
				recursive: false,
			});
		});
	},
};
