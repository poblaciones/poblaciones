const axiosClient = require('./axiosClient');
const login = require('./redirectLogin');

module.exports = {
	loadHeaderBar(setter) {
		axiosClient.getPromise(window.host + '/services/backoffice/GetConfiguration', {},
			'acceder a la sesión activa').then(function (res) {
				if (res.User.Logged === false) {
					login.redirectLogin();
				} else {
					setter(res);
				}
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
		var url = window.host + '/users';
		document.location = url;
	},
	redirectAdmin() {
		var url = window.host + '/admins';
		document.location = url;
	},
	logoff() {
		var url = window.host + '/authenticate/logoff';
		document.location = url;
	}
};
