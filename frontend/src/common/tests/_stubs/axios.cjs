// Doble de axios para los tests: registra cada solicitud y responde lo que el
// test programe con respond(). Sin respuesta programada rechaza, para que un
// test no dependa por error de una llamada que no preparó.
const axiosStub = {
	calls: [],
	handlers: { get: null, post: null },

	reset() {
		this.calls = [];
		this.handlers = { get: null, post: null };
	},

	// result: { data, headers } para responder, o un Error para rechazar.
	respond(method, result) {
		this.handlers[method] = function () {
			if (result instanceof Error) {
				return Promise.reject(result);
			}
			return Promise.resolve({ data: result.data, headers: result.headers || {} });
		};
	},

	// Programa una respuesta distinta según la URL solicitada.
	respondByUrl(method, resultsByUrl) {
		this.handlers[method] = function (url) {
			const result = resultsByUrl[url];
			if (result === undefined) {
				return Promise.reject(new Error('axios stub: sin respuesta para ' + method + ' ' + url));
			}
			if (result instanceof Error) {
				return Promise.reject(result);
			}
			return Promise.resolve({ data: result.data, headers: result.headers || {} });
		};
	},

	get(url, config) {
		this.calls.push({ method: 'get', url: url, config: config });
		return this.invoke('get', url, config);
	},

	post(url, body, config) {
		this.calls.push({ method: 'post', url: url, body: body, config: config });
		return this.invoke('post', url, config);
	},

	invoke(method, url, config) {
		if (this.handlers[method] === null) {
			return Promise.reject(new Error('axios stub: sin respuesta programada para ' + method + ' ' + url));
		}
		return this.handlers[method](url, config);
	},
};

module.exports = axiosStub;
