// Doble mínimo de Vue: set asigna sin reactividad, nextTick difiere la
// función a la cola de microtareas y use registra los plugins instalados.
const Vue = {
	used: [],

	reset() {
		this.used = [];
	},

	set(target, key, value) {
		target[key] = value;
		return value;
	},

	nextTick(callback) {
		return Promise.resolve().then(callback);
	},

	use(plugin) {
		this.used.push(plugin);
	},
};

export default Vue;
