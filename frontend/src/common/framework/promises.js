module.exports = {
	ReadyPromise(args = null) {
		var _resolve;
		var readyPromise = new Promise(resolve => {
			_resolve = resolve;
		});
		setTimeout(() => {
			_resolve(args);
		}, 10);
		return readyPromise;
	},
};
