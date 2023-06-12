require('./check-versions')();

var config = require('../config');
if (!process.env.NODE_ENV) {
	process.env.NODE_ENV = JSON.parse(config.dev.env.NODE_ENV);
}

var opn = require('opn');
var path = require('path');
var express = require('express');
var webpack = require('webpack');
var proxyMiddleware = require('http-proxy-middleware');
var webpackConfig = require('./webpack.dev.conf');

// default port where dev server listens for incoming traffic
var port = process.env.PORT || config.dev.port;
// automatically open browser, if not set will be false
var autoOpenBrowser = !!config.dev.autoOpenBrowser;
// Define HTTP proxies to your custom API backend
// https://github.com/chimurai/http-proxy-middleware
var proxyTable = config.dev.proxyTable;
var phpPort = port + 2;
var php = 'http://localhost:' + phpPort;
proxyTable = { '/services': php, '/static': php, '/authenticate': php };

var app = express();
var compiler = webpack(webpackConfig);

app.use(function(req, res, next) {
   if (req.url === '/users/' || req.url === '/users') {
     req.url = '/backoffice.html';
	 }
	if (req.url === '/admins/' || req.url === '/admins') {
     req.url = '/admins.html';
	}
	if (req.url === '/cr/' || req.url === '/cr') {
		req.url = '/credentials.html';
	}
	if (req.url === '/map/' || req.url === '/map') {
     req.url = '/index.html';
   }
   next();
});

var devMiddleware = require('webpack-dev-middleware')(compiler, {
	publicPath: webpackConfig.output.publicPath,
	quiet: true
});

var hotMiddleware = require('webpack-hot-middleware')(compiler, {
	log: false,
	heartbeat: 2000
});
// force page reload when html-webpack-plugin template changes
/*compiler.plugin('compilation', function (compilation) {
	compilation.plugin('html-webpack-plugin-after-emit', function (data, cb) {
		hotMiddleware.publish({ action: 'reload' });
		cb();
	});
});*/
compiler.hooks.compilation.tap('html-webpack-plugin-after-emit', () => {
        hotMiddleware.publish({
              action: 'reload'
        });
     });

// proxy api requests
Object.keys(proxyTable).forEach(function (context) {
	var options = proxyTable[context];
	if (typeof options === 'string') {
		options = { target: options,  logLevel: "debug"  };
	}
	app.use(proxyMiddleware(options.filter || context, options));
});
// handle fallback for HTML5 history API
app.use(require('connect-history-api-fallback')());

// serve webpack bundle output
app.use(devMiddleware);

// enable hot-reload and state-preserving
// compilation error display
app.use(hotMiddleware);

// serve pure static assets
var staticPath = path.posix.join(config.dev.assetsPublicPath, config.dev.assetsSubDirectory);
app.use(staticPath, express.static('./static'));

var _resolve;
var readyPromise = new Promise(resolve => {
	_resolve = resolve;
});

/////////////////// INICIA PHP y el proxy unificador //////////////////
const appPORT = port;
const phpPORT = port + 2;
const vueJSPORT = port + 4;
var vuejsPaths = ['/map/', '/cr', '/users/', '/admins', '/users', '/static/img', '/admins', '/__webpack_hmr'];
const singleApp = require('./single-app');
////////////////// LISTO PHP y el proxy unificador //////////////////
var uri = 'https://localhost:' + appPORT;

console.log('> Starting dev server...');
devMiddleware.waitUntilValid(() => {
	console.log('> ==============================================');
	console.log('> Internal VUEJS port listening at ' + vueJSPORT);
	console.log('> Internal PHP port listening at ' + phpPORT);
	console.log('> Local DESA running at ' + uri);
	console.log('> ==============================================');

	singleApp.start(appPORT, phpPORT, vueJSPORT, vuejsPaths);
  // when env is testing, don't need open it
	if (autoOpenBrowser && process.env.NODE_ENV !== 'testing') {
		opn(uri);
	}
	_resolve();
});
var server = app.listen(vueJSPORT);

module.exports = {
	ready: readyPromise,
	close: () => {
		server.close();
	}
};
