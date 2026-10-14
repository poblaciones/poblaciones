const axiosClient = require('./axiosClient');
const redirectLogin = require('./redirectLogin');
const session = require('@/common/framework/session');

module.exports = {
	loadHeaderBar(setter) {
		axiosClient.getPromise(window.host + '/services/backoffice/GetTransactionServer', {},
			'acceder a la configuración de servidores').then(function (serverConfiguration) {
				window.mainHost = window.host;
				window.host = serverConfiguration.Server;
				window.Context.Initialize();
				axiosClient.getPromise(serverConfiguration.Server + '/services/backoffice/GetConfiguration', {},
					'acceder a la sesión activa').then(function (res) {
						if (res.User.Logged === false) {
							session.ClearRememberForUrl(serverConfiguration.Server);
							redirectLogin.redirectLogin();
						} else {
							res.DynamicServer = serverConfiguration.Server;
							setter(res);
						}
					});
			});
	},
	redirectLogin() {
		redirectLogin.redirectLogin();
	},
	redirectRegister() {
		redirectLogin.redirectRegister();
	},
	redirectHome() {
		redirectLogin.redirectHome();
	},
	registerUrl() {
		return redirectLogin.registerUrl();
	},
	loginUrl(target) {
		return redirectLogin.loginUrl(target);
	},
	homeUrl() {
		return redirectLogin.homeUrl();
	},
	backofficeUrl() {
		return redirectLogin.mainHost() + '/users';
	},
	redirectBackoffice() {
		var url = this.backofficeUrl();
		document.location = url;
	},
	redirectAdmin() {
		var url = redirectLogin.mainHost() + '/admins';
		document.location = url;
	},
	logoff() {
		var url = window.host + '/authenticate/logoff';
		axiosClient.postPromise(url, {}, 'cerrar la sesión').then(function (homeUrl) {
			session.ClearRememberForUrl(url);
			document.location = homeUrl;
		});
	}
};
