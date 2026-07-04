function unresolved() { return new Promise(function () {}); }
export default {
	CancelToken: function (executor) { if (executor) executor(function () {}); },
	create() { return { get: unresolved, post: unresolved }; },
	get: unresolved,
	post: unresolved,
	defaults: {},
};
