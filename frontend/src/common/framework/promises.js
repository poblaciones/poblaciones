module.exports = {
	ReadyPromise() {
		var _resolve;
		var readyPromise = new Promise(resolve => {
			_resolve = resolve;
		});
		setTimeout(() => {
			_resolve();
		}, 10);
		return readyPromise;
	},
};
