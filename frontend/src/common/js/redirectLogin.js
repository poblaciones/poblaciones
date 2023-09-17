module.exports = {
	redirectLogin() {
		var actualLink = document.location;
		var loginUrl = window.host + '/cr#';
		var url = this.AppendParam(loginUrl, 'to', actualLink);
		url = this.AppendParam(url, 'ask', 1);
		document.location = url;
	},
	AppendParam(url, param, value) {
		url += (url.split('?')[1] ? '&' : '?') + param + '=' + encodeURIComponent(value);
		return url;
	}
};
