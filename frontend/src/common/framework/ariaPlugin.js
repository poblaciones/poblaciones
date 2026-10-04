/**
 * Vue vuelve a quitar el atributo cuando el valor es false, pero aria-pressed="false"
 * tiene significado propio (botón de dos estados sin presionar), por eso se entrega como cadena.
 */
export default {
	install(Vue) {
		Vue.prototype.$ariaPressed = function (pressed) {
			if (pressed) {
				return 'true';
			}
			return 'false';
		};
	}
};
