// set.calls permite a los tests verificar que se usó Vue.set (necesario
// cuando la propiedad no preexiste en el objeto) en vez de una asignación
// directa, que en Vue 2 real no dispara reactividad para altas de propiedad.
const calls = [];
export default {
	calls,
	set(obj, key, value) {
		calls.push({ obj, key, value });
		obj[key] = value;
	},
};
