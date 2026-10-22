// Doble de Vuex: el Store conserva las opciones con que se lo creó.
class Store {
	constructor(options) {
		this.options = options;
	}
}

// mapGetters devuelve una propiedad calculada por getter que lee del store del
// componente, como hace Vuex.
export function mapGetters(names) {
	const computed = {};
	for (const name of names) {
		computed[name] = function () {
			return this.$store.getters[name];
		};
	}
	return computed;
}

export default { Store: Store };
