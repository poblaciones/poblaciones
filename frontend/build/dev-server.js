require('./check-versions')();

// Suprimir DEP0060 (util._extend en http-proxy): es inocuo y no tiene fix
// disponible sin actualizar la dependencia
const _emit = process.emit.bind(process);
process.emit = function(event, ...args) {
	if (event === 'warning' && args[0] && args[0].code === 'DEP0060') return false;
	return _emit(event, ...args);
};

const config = require('../config');
if (!process.env.NODE_ENV) {
	process.env.NODE_ENV = JSON.parse(config.dev.env.NODE_ENV);
}

const path          = require('path');
const fs            = require('fs');
const https         = require('https');
const express       = require('express');
const webpack       = require('webpack');
const proxyMW       = require('http-proxy-middleware');
const history       = require('connect-history-api-fallback');
const devMiddleware = require('webpack-dev-middleware');
const hotMiddleware = require('webpack-hot-middleware');
const phpServer     = require('php-server');
const opn           = require('opn');
const webpackConfig = require('./webpack.dev.conf');

const appPORT         = parseInt(process.env.PORT) || config.dev.port;
const phpPORT         = appPORT + 2;
const autoOpenBrowser = !!config.dev.autoOpenBrowser;

// Rutas que van al backend PHP
const phpPaths = [
	'/services', '/sitemap', '/handle', '/logs',
	'/oauthGoogle', '/oauthFacebook', '/authenticate',
	'/static/css', '/static/js', '/static/vendor',
	'/ark:/'
];

const app      = express();
const compiler = webpack(webpackConfig);

// ── URL rewrites ────────────────────────────────────────────────────────────
app.use((req, res, next) => {
	const url = req.url;
	if      (url === '/users'  || url === '/users/')              req.url = '/backoffice.html';
	else if (url === '/admins' || url === '/admins/')             req.url = '/admins.html';
	else if (url === '/table'  || url.startsWith('/table/'))      req.url = '/table.html';
	else if (url === '/cr'     || url === '/cr/')                 req.url = '/credentials.html';
	else if (url === '/map'    || url.startsWith('/map/'))        req.url = '/index.html';
	next();
});

// ── Proxy a PHP ─────────────────────────────────────────────────────────────
const phpProxyOptions = {
	target:       'http://127.0.0.1:' + phpPORT,
	logLevel:     'debug',
	timeout:       30000,
	proxyTimeout:  30000,
	onError(err, req, res) {
		console.error('[PHP proxy error]', req.url, err.message);
		if (!res.headersSent) {
			res.writeHead(502, { 'Content-Type': 'text/plain' });
			res.end('PHP proxy error: ' + err.message);
		}
	}
};
phpPaths.forEach(context => app.use(context, proxyMW(context, phpProxyOptions)));

// ── Webpack ──────────────────────────────────────────────────────────────────
const dev = devMiddleware(compiler, {
	publicPath: webpackConfig.output.publicPath,
	quiet:      true
});
const hot = hotMiddleware(compiler, {
	log:       false,
	heartbeat: 2000
});
compiler.hooks.compilation.tap('html-webpack-plugin-after-emit', () => {
	hot.publish({ action: 'reload' });
});

app.use(history());
app.use(dev);
app.use(hot);

// ── Assets estáticos ─────────────────────────────────────────────────────────
const staticPath = path.posix.join(config.dev.assetsPublicPath, config.dev.assetsSubDirectory);
app.use(staticPath, express.static('./static'));

// ── PHP server ───────────────────────────────────────────────────────────────
phpServer({ port: phpPORT, base: '../services/web', router: '../services/web/resolve-dev.php' })
	.then(() => console.log('> PHP server running at port ' + phpPORT))
	.catch(() => {});

// ── HTTPS server directo sobre Express (sin proxy intermedio) ────────────────
const server = https.createServer({
	key:  fs.readFileSync('certs/valid-ssl-key.pem',  'utf8'),
	cert: fs.readFileSync('certs/valid-ssl-cert.pem', 'utf8')
}, app);

// Timeout de keep-alive por encima del del cliente (60 s)
// para evitar acumulación de sockets colgados
server.keepAliveTimeout = 65000;
server.headersTimeout   = 66000;

// ── Arranque ─────────────────────────────────────────────────────────────────
dev.waitUntilValid(() => {
	server.listen(appPORT, () => {
		const uri = 'https://127.0.0.1:' + appPORT;
		console.log('> ============================================');
		console.log('> Dev server:  ' + uri);
		console.log('> PHP backend: port ' + phpPORT);
		console.log('> ============================================');
		if (autoOpenBrowser && process.env.NODE_ENV !== 'testing') {
			opn(uri);
		}
	});
});

module.exports = { close: () => server.close() };
