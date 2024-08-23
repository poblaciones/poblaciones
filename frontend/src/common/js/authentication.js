const axiosClient = require('./axiosClient');
const login = require('./redirectLogin');

module.exports = {
	loadHeaderBar(setter) {
		axiosClient.getPromise(window.host + '/services/backoffice/GetTransactionServer', {},
			'acceder a la configuración de servidores').then(function (serverConfiguration) {
				axiosClient.getPromise(serverConfiguration.data.Server + '/services/backoffice/GetConfiguration', {},
					'acceder a la sesión activa').then(function (res) {
						if (res.User.Logged === false) {
							login.redirectLogin();
						} else {
							res.DynamicServer = serverConfiguration.data.Server;
							setter(res);
						}
					});
			});
	},
	redirectLogin() {
		login.redirectLogin();
	},
	redirectRegister() {
		login.redirectRegister();
	},
	redirectHome() {
		login.redirectHome();
	},
	registerUrl() {
		return login.registerUrl();
	},
	loginUrl() {
		return login.loginUrl();
	},
	homeUrl() {
		return login.homeUrl();
	},
	redirectBackoffice() {
		var url = window.mainHost + '/users';
		document.location = url;
	},
	redirectAdmin() {
		var url = window.mainHost + '/admins';
		document.location = url;
	},
	logoff() {
		var url = window.host + '/authenticate/logoff';
		document.location = url;
	}
};
