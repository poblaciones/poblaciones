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

				// Va vía VUEJS
				vuejsTarget.web(req, res, 'http://localhost:' + vueJSPORT,
					function (e) {
						console.log('>> failed: ' + req.url + ' err: ' + e.message);
					});
				if (verbose) {
					console.log('> serving ' + req.url);
				}
		});
		svr.listen(appPORT);
	},

	startPhpServer(phpPORT) {
		var loc = this;

		const phpServer = require('php-server');
		phpServer({
			port: phpPORT,
			base: '../services/web',
			router: '../services/web/resolve-dev.php'
		}).then(
			function (server) {
				loc.currentPhpServer = server;
			}).catch(function (e) {
				console.log("> PHP server message: " + e.message);
			});
	},

};
