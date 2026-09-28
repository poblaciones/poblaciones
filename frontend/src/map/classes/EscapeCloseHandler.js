export default EscapeCloseHandler;

// Cierra con ESC, y opcionalmente con el botón "atrás" del dispositivo,
// cualquier popup, panel lateral o selector que lo use. Se abre y cierra en
// sincronía con el propio estado de apertura del componente (watcher de esa
// propiedad, más el created/mounted por si el componente ya nace abierto),
// no con su montaje: un componente como Modal.vue vive montado de forma
// permanente y hace show()/hide() muchas veces sobre la misma instancia, así
// que atarse a mounted/beforeDestroy dejaría los listeners y la entrada de
// historial mal sincronizados con lo que el usuario ve. Uso:
//   this.escapeHandler = new EscapeCloseHandler(closeFn, opts);  // en created
//   this.escapeHandler.Open();                                  // al abrirse (watcher)
//   this.escapeHandler.Close();                                 // al cerrarse (watcher,
//                                                                // y también en beforeDestroy
//                                                                // por si se destruye abierto)
// closeFn es el método de cierre que el propio componente ya tiene (el que
// usa su botón "cerrar"); debe poder llamarse sin efecto si el componente ya
// está cerrado (EscapeCloseHandler no lo chequea por su cuenta, para no
// imponerle a cada componente una única forma de representar "está abierto").
//
// opts.useHistory (default false) agrega, además del ESC, una entrada de
// historial al abrir para que el botón atrás cierre en vez de sacar al
// usuario de la página. Solo corresponde cuando abrir es una decisión
// consciente del usuario (un popup, un panel que ocupa casi toda la
// pantalla): un componente que abre y cierra solo, muchas veces por minuto,
// como reacción a un hover o a una selección en el mapa (el panel de
// detalles de un feature, el selector de tipo de mapa mientras se pasa el
// mouse) NO debe usarlo, porque cada apertura tocaría el historial real del
// navegador y dispararía su propio popstate.
function EscapeCloseHandler(closeFn, opts) {
	this.closeFn = closeFn;
	this.useHistory = !!(opts && opts.useHistory);
	this.isOpen = false;
	this.closingFromPopState = false;
	this.onKeyDown = this.onKeyDown.bind(this);
	this.onPopState = this.onPopState.bind(this);
}

EscapeCloseHandler.prototype.Open = function () {
	if (this.isOpen) {
		return;
	}
	this.isOpen = true;
	window.addEventListener('keydown', this.onKeyDown);
	if (this.useHistory) {
		window.addEventListener('popstate', this.onPopState);
		// Entrada de historial "fantasma": así el botón atrás del dispositivo
		// dispara un popstate que este handler puede atrapar, en vez de sacar
		// al usuario de la página.
		window.history.pushState({ escapeCloseHandler: true }, '');
	}
};

EscapeCloseHandler.prototype.Close = function () {
	if (!this.isOpen) {
		return;
	}
	this.isOpen = false;
	window.removeEventListener('keydown', this.onKeyDown);
	if (!this.useHistory) {
		return;
	}
	window.removeEventListener('popstate', this.onPopState);
	if (this.closingFromPopState) {
		this.closingFromPopState = false;
	} else {
		// El cierre no vino del botón atrás (fue la X, un click afuera o ESC):
		// hay que consumir la entrada fantasma para que el próximo atrás del
		// usuario no quede atascado en una entrada sin efecto visible.
		window.history.back();
	}
};

EscapeCloseHandler.prototype.onKeyDown = function (e) {
	if (e.key === 'Escape') {
		this.closeFn();
	}
};

EscapeCloseHandler.prototype.onPopState = function () {
	// closeFn termina desencadenando Close() (directo, o vía un watcher de
	// Vue que puede correr en el mismo tick o en el siguiente): la bandera
	// queda en true hasta que Close() la lea, para que no importe cuándo
	// ocurra eso.
	this.closingFromPopState = true;
	this.closeFn();
};
