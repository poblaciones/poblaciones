module.exports = {
	currentPhpServer: null,
	start(appPORT, phpPORT, vueJSPORT, vuejsPaths) {
		const verbose = true;
		// https://github.com/http-party/node-http-proxy

		this.startPhpServer(phpPORT);
		///////////
		var https = require('https');
		var httpProxy = require('http-proxy');

		const fs = require('fs');

		var phpTarget = httpProxy.createServer({
			target: {
				host: 'localhost',
				port: phpPORT
			},
		});
		phpTarget.on('error', function (e) {
			console.log('error happened (php): ' + e.message);
		});

		var vuejsTarget = httpProxy.createServer({
			target: {
				host: 'localhost',
				port: vueJSPORT
			},
		});
		vuejsTarget.on('error', function (e) {
			console.log('error happened (vuejsTarget): ' + e.message);
		});
		var loc = this;
		var svr = https.createServer({
			key: fs.readFileSync('certs/valid-ssl-key.pem', 'utf8'),
			cert: fs.readFileSync('certs/valid-ssl-cert.pem', 'utf8')
		}, function (req, res) {
			if (req.url == '/resetphp') {
				console.log("Resetting PHP Server...");
				phpPORT++;
				loc.startPhpServer(phpPORT);

				res.writeHead(200, { 'Content-Type': 'text/plain' });
				res.write('PHP reset OK!' + '\n\n');
				res.end();
			} else if (req.url == '/' || (req.url.split('/').length === 2 && req.url.endsWith('.js'))
				|| vuejsPaths.filter(path => req.url.startsWith(path)).length > 0) {
				vuejsTarget.web(req, res, 'http://localhost:' + vueJSPORT,
					function (e) {
						console.log('>> failed: ' + req.url + ' err: ' + e.message);
					});
				if (verbose) {
					console.log('> serving vuejs ' + req.url);
				}
			} else {
				phpTarget.web(req, res, 'http://localhost:' + phpPORT,
					function (e) {
						console.log('>> failed: ' + req.url + ' err: ' + e.message);
					});
				if (verbose) {
					console.log('>> serving PHP (' + phpPORT + ')' + req.url);
				}
			}
		});
		svr.listen(appPORT);
	},
	startPhpServer(phpPORT) {
		var loc = this;
		if (loc.currentPhpServer) {
			loc.currentPhpServer.stop();
		}
		const phpServer = require('php-server');
		phpServer({ port: phpPORT, base: '../services/web', router: '../services/web/resolve-dev.php' }).then(
			function (server) {
				loc.currentPhpServer = server;
			}).catch(function (e) {
				console.log("> PHP server message: " + e.message);
			});
	},

};