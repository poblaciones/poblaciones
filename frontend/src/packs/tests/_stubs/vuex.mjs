// Doble de vuex (tercero): el Store conserva las opciones de creación y
// mapGetters devuelve computed que leen $store.getters.
export class Store {
	constructor(options) { this.options = options; }
}

export function mapGetters(names) {
	const computed = {};
	names.forEach(function (name) {
		computed[name] = function () { return this.$store.getters[name]; };
	});
	return computed;
}

export default { Store, mapGetters };
