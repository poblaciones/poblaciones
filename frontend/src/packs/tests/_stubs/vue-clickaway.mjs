// Doble de vue-clickaway (tercero): el paquete real hace require('vue'),
// que al cargarse con un window de pruebas intenta leer
// window.navigator.userAgent. Las pruebas no ejercitan el comportamiento de
// "clic fuera", solo hace falta que el import resuelva.
export const mixin = {};
export const directive = {};
export default { mixin, directive };
