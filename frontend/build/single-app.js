module.exports = {
	start(appPORT, phpPORT, vueJSPORT, vuejsPaths) {
		const phpServer = require('php-server');
		const verbose = true;
		const server = phpServer({ port: phpPORT, base: '../services/web', router: '../services/web/resolve-dev.php' }).then(() => {
		}).catch(e => {
			console.log("> PHP server message: " + e.message);
		});
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

		var svr = https.createServer({
			key: fs.readFileSync('certs/valid-ssl-key.pem', 'utf8'),
			cert: fs.readFileSync('certs/valid-ssl-cert.pem', 'utf8')
		}, function (req, res) {

			vuejsTarget.web(req, res, 'http://localhost:' + vueJSPORT,
				function (e) {
					console.log('>> failed: ' + req.url + ' err: ' + e.message);
				});
			if (verbose) {
				console.log('> serving ' + req.url);
			}
		});
		svr.listen(appPORT);
	}
};
