// Marcador de un archivo del proyecto que todavía no fue provisto. Se puede
// importar (para que los componentes se registren) pero cualquier uso
// (leer una propiedad, llamarlo o instanciarlo) falla indicando el archivo.
const file = new URL(import.meta.url).searchParams.get('file');

function fail() {
	throw new Error('Archivo no provisto usado por una prueba: src/' + file + ' (ver unavailableSources en _alias-hooks.mjs)');
}

const placeholder = new Proxy(function () {}, {
	get(target, property) {
		if (property === 'then' || property === '__esModule' || typeof property === 'symbol') {
			return undefined;
		}
		return fail();
	},
	apply: fail,
	construct: fail,
});

export default placeholder;
