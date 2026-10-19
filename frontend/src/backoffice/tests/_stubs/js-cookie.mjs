// Doble de js-cookie: registra las escrituras para poder verificarlas.
const Cookies = {
	written: [],

	reset() {
		this.written = [];
	},

	set(name, value) {
		this.written.push({ name: name, value: value });
	},
};

export default Cookies;
