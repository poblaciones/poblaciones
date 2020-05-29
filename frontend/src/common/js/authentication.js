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
