module.exports = {
	AddSession(url, params) {
		var s = this.GetSessionForUrl(url);
		if (s) {
			if (!params.headers) {
				params.headers = {};
			}
			params.headers['session-id'] = s;
		}
		var r = this.GetRememberForUrl(url);
		if (r) {
			if (!params.headers) {
				params.headers = {};
			}
			params.headers['remember-token'] = r;
		}
		return params;
	},
	ReceiveSession(url, res) {
		if (res.headers['session-id']) {
			this.SetSessionForUrl(url, res.headers['session-id']);
		} else {
			this.SetSessionForUrl(url, null);
		}
	},
	GetSessionForUrl(url) {
		const parser = new URL(url);
		var key = parser.host;
		return localStorage.getItem("sessionId_" + key);
	},
	GetRememberForUrl(url) {
		return localStorage.getItem(this.RememberKey(url));
	},
	SetRememberForUrl(url, token) {
		localStorage.setItem(this.RememberKey(url), token);
	},
	ClearRememberForUrl(url) {
		localStorage.removeItem(this.RememberKey(url));
	},
	RememberKey(url) {
		const parser = new URL(url);
		return "rememberToken_" + parser.host;
	},
	SetSessionForUrl(url, sessionId) {
		const parser = new URL(url);
		var key = parser.host;
		var current = localStorage.getItem("sessionId_" + key);
		if (current !== sessionId) {
			localStorage.setItem("sessionId_" + key, sessionId);
		}
	},
};
