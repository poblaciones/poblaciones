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
	'/static/css', '/static/js',
	'/ark:/'
];

const app      = express();
const compiler = webpack(webpackConfig);

// ── Log de todo el tráfico entrante (incluye lo que no pasa por HPM) ────────
app.use((req, res, next) => {
	console.log('[REQ] ' + new Date().toISOString() + '  ' + req.method + ' ' + req.url);
	next();
});

// ── URL rewrites ────────────────────────────────────────────────────────────
app.use((req, res, next) => {
	const url = req.url;
	if      (url === '/users'  || url === '/users/')              req.url = '/backoffice.html';
	else if (url === '/admins' || url === '/admins/')             req.url = '/admins.html';
	else if (url === '/packs' || url === '/packs/')								req.url = '/packs.html';
	else if (url === '/table'  || url.startsWith('/table/'))      req.url = '/table.html';
	else if (url === '/cr'     || url === '/cr/')                 req.url = '/credentials.html';
	else if (url === '/map'    || url.startsWith('/map/'))        req.url = '/index.html';
	next();
});

// ── Vendor: estático directo, no pasa más por PHP ────────────────────────────
// Relativo a frontend/build/dev-server.js -> frontend/static/vendor
app.use('/static/vendor', express.static('../static/vendor'));

// ── Mutex + cola FIFO delante del proxy a PHP ────────────────────────────────
// El server embebido de PHP procesa una request a la vez. En vez de dejar que
// varias conexiones entren en simultáneo al backlog TCP (donde no se puede
// distinguir cuál ejecuta y cuáles esperan), se serializa explícitamente acá.
let phpReqCounter = 0;
let phpBusy       = false;
const phpQueue    = [];         // items en espera de mutex
const phpInFlight = new Map();  // id -> { url, method, queuedAt, startedAt, state }
const phpHistory  = [];         // últimas N, con tiempos de espera y ejecución
const PHP_HISTORY_MAX = 30;

function phpQueueGate(req, res, next) {
	const id = ++phpReqCounter;
	req._phpReqId = id;
	const queuedAt = Date.now();
	phpInFlight.set(id, {
		url: req.url, method: req.method,
		queuedAt, startedAt: null, state: 'queued'
	});
	const item = { id, next };
	phpQueue.push(item);

	req.on('close', () => {
		const entry = phpInFlight.get(id);
		if (!entry || entry.state !== 'queued') return; // ya ejecutando o ya finalizado
		const idx = phpQueue.indexOf(item);
		if (idx !== -1) phpQueue.splice(idx, 1);
		phpInFlight.delete(id);
		phpHistory.unshift({
			url: entry.url, method: entry.method,
			status: 'CLOSED_BY_CLIENT',
			waitMs: Date.now() - entry.queuedAt,
			execMs: 0
		});
		if (phpHistory.length > PHP_HISTORY_MAX) phpHistory.pop();
	});

	tryDequeue();
}

function tryDequeue() {
	if (phpBusy || phpQueue.length === 0) return;
	const { id, next } = phpQueue.shift();
	phpBusy = true;
	const entry = phpInFlight.get(id);
	entry.startedAt = Date.now();
	entry.state      = 'running';
	next();
}

function recordPhpEnd(id, status) {
	const entry = phpInFlight.get(id);
	if (entry) {
		phpInFlight.delete(id);
		const now = Date.now();
		phpHistory.unshift({
			url:        entry.url,
			method:     entry.method,
			status,
			waitMs:     entry.startedAt - entry.queuedAt,
			execMs:     now - entry.startedAt
		});
		if (phpHistory.length > PHP_HISTORY_MAX) phpHistory.pop();
	}
	phpBusy = false;
	tryDequeue();
}

// ── Ruta fija de diagnóstico: la resuelve Express directamente, nunca PHP ───
app.get('/php_status', (req, res) => {
	const now = Date.now();
	res.json({
		inFlight: Array.from(phpInFlight.values()).map(e => ({
			...e,
			waitedMs: (e.startedAt || now) - e.queuedAt,
			runningMs: e.startedAt ? now - e.startedAt : 0
		})),
		previous: phpHistory
	});
});

// ── Proxy a PHP ─────────────────────────────────────────────────────────────
const phpProxyOptions = {
	target:       'http://127.0.0.1:' + phpPORT,
	logLevel:     'debug',
	timeout:       60000,
	proxyTimeout:  60000,
	onProxyRes(proxyRes, req) {
		recordPhpEnd(req._phpReqId, proxyRes.statusCode);
	},
	onError(err, req, res) {
		console.error('[PHP proxy error]', req.url, err.message);
		recordPhpEnd(req._phpReqId, 'ERROR: ' + err.message);
		if (!res.headersSent) {
			res.writeHead(502, { 'Content-Type': 'text/plain' });
			res.end('PHP proxy error: ' + err.message);
		}
	}
};
phpPaths.forEach(context => {
	app.use(context, phpQueueGate);
	app.use(context, proxyMW(context, phpProxyOptions));
});

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
