module.exports = {
	redirectLogin() {
		document.location = this.loginUrl();
	},
	loginUrl() {
		var actualLink = document.location;
		var loginUrl = window.mainHost + '/cr#';
		var url = this.AppendParam(loginUrl, 'to', actualLink);
		url = this.AppendParam(url, 'ask', 1);
		return url;
	},
	redirectRegister() {
		document.location = this.registerUrl();
	},
	registerUrl() {
		var actualLink = document.location;
		var loginUrl = window.mainHost + '/cr#/signup';
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
