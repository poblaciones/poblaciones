const axios = require('axios');
const querystring = require('querystring');
const err = require('@/common/js/err');

module.exports = {
	getPromise(url, args, errorAction) {
		var loc = this;
		var ret = new Promise(function (success, reject) {
			loc.get(url, args, errorAction).then(function (res) {
				success(res.data);
			}).catch(function (error) {
				err.errDialog('Get', errorAction, error);
				reject(error);
			});
		});
		return ret;
	},
	postPromise(url, args, errorAction) {
		var loc = this;
		var ret = new Promise(function (success, reject) {
			loc.post(url, args, errorAction).then(function (res) {
				success(res.data);
			}).catch(function (error) {
				err.errDialog('Post', errorAction, error);
				reject(error);
			});
		});
		return ret;
	},
	getCallback(url, args, callback, errorAction) {
		this.get(url, args, errorAction).then(function (res) {
			if (callback != null && callback !== undefined) {
				callback();
			}
		});
	},
	get(url, args) {
		for (var n in args) {
			if (args.hasOwnProperty(n)) {
				var i = args[n];
				if (i !== null && Array.isArray(i)) {
					args[n] = JSON.stringify(i);
				}
			}
		}
		return axios.get(url, {
			params: args,
			headers: { 'Full-Url': document.location.href }
		});
	},
	postCallback(url, args, callback, errorAction) {
		this.post(url, args, errorAction).then(function (res) {
			if (callback != null && callback !== undefined) {
				callback(res.data);
			}
		});
	},
	post(url, args, errorAction) {
		const config = {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Full-Url': document.location.href }
		};
		for (var n in args) {
			if (args.hasOwnProperty(n)) {
				var i = args[n];
				if (i !== null && (i instanceof Object || Array.isArray(i))) {
					args[n] = JSON.stringify(i);
				}
			}
		}
		return axios.post(url, querystring.stringify(args), config);
	}
};
