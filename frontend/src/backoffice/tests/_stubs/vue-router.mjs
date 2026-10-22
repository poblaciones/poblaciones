// Doble de vue-router: el Router conserva las opciones con que se lo creó,
// de modo que los tests puedan recorrer la tabla de rutas.
export default class Router {
	constructor(options) {
		this.options = options;
	}

	static install() {}
}
