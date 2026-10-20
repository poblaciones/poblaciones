// Doble de vue (tercero). Registra (sin borrar nunca) los plugins instalados
// con Vue.use, porque algunos se instalan al importar un módulo, y expone
// Vue.config para verificar errorHandler. No se carga el vue real:
// al importarse con un window de pruebas intenta leer window.navigator.
const Vue = {
	uses: [],
	config: {},
	use(plugin) { Vue.uses.push(plugin); },
	set(obj, key, value) { obj[key] = value; },
	resetConfig() { Vue.config = {}; },
};
export default Vue;
