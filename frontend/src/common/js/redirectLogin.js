module.exports = {
	mainHost() {
		if (!window.mainHost) {
			throw new Error('window.mainHost no está definido: todavía no se recibió la configuración del servidor.');
		}
		return window.mainHost;
	},
	redirectLogin() {
		document.location = this.loginUrl();
	},
	loginUrl(target) {
		var actualLink;
		if (target) {
			actualLink = target;
		} else {
			actualLink = document.location;
		}
		var loginUrl = this.mainHost() + '/cr#';
		var url = this.AppendParam(loginUrl, 'to', actualLink);
		url = this.AppendParam(url, 'ask', 1);
		return url;
	},
	redirectRegister() {
		document.location = this.registerUrl();
	},
	registerUrl() {
		var actualLink = document.location;
		var loginUrl = this.mainHost() + '/cr#/signup';
		var url = this.AppendParam(loginUrl, 'to', actualLink);
		url = this.AppendParam(url, 'ask', 1);
		return url;
	},
	redirectHome() {
		document.location = this.homeUrl();
	},
	homeUrl() {
		if (window.SegMap && window.SegMap.Configuration) {
			return window.SegMap.Configuration.HomePage;
		} else {
			return '#';
		}
	},
	AppendParam(url, param, value) {
		url += (url.split('?')[1] ? '&' : '?') + param + '=' + encodeURIComponent(value);
		return url;
	}
};
