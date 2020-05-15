const axios = require('axios');
const err = require('@/common/js/err');

module.exports = {
	loadHeaderBar(setter) {
		var loc = this;
		axios.get(window.host + '/services/backoffice/GetConfiguration', {
				withCredentials: true,
				params: {}
			}).then(function(res) {
				if(res.data.User.Logged === false) {
					loc.redirectLogin();
				} else {
					setter(res.data);
				}
			}).catch(function(error) {
				err.errDialog('login', 'acceder a la sesión activa', error);
			});
	},
	redirectLogin() {
		var actualLink = document.location;
		var loginUrl = window.host + '/authenticate/login';
		var url = this.AppendParam(loginUrl, 'to', actualLink);
		url = this.AppendParam(url, 'ask', 1);
		document.location = url;
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
	},
	AppendParam(url, param, value) {
		url += (url.split('?')[1] ? '&' : '?') + param + '=' + encodeURIComponent(value);
		return url;
	}
};

