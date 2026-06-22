/**
 * ColumnDragController — reordenamiento de columnas (métricas) por arrastre.
 *
 * Encapsula el estado y los handlers de los eventos de drag del DOM, para que la
 * tabla no tenga que atrapar cada uno. La tabla lo compone, le reenvía los
 * eventos, y recibe un solo aviso de alto nivel cuando se concreta un movimiento
 * válido: el callback onMove(fromGroupIndex, toGroupIndex). La mutación del pivot
 * la aplica la tabla (su dueña), no el controlador.
 *
 * El estado vive en un objeto reactivo que provee la tabla (creado en su data),
 * para que el template observe los cambios en Vue 2. Campos:
 *   armed     índice del grupo con drag habilitado (mousedown en el handle)
 *   index     índice que se está arrastrando
 *   overIndex índice sobre el que se está por soltar
 */

function ColumnDragController(state, onMove) {
	this.state = state;
	this.onMove = onMove;
}

// Habilita draggable solo cuando el mousedown ocurre en el handle.
ColumnDragController.prototype.arm = function (index) {
	this.state.armed = index;
};

// Se desarma tras un tick si no comenzó un dragstart.
ColumnDragController.prototype.disarm = function () {
	var loc = this;
	setTimeout(function () {
		if (loc.state.index === null) loc.state.armed = null;
	}, 0);
};

ColumnDragController.prototype.start = function (index, event) {
	this.state.index = index;
	if (event.dataTransfer) {
		event.dataTransfer.effectAllowed = 'move';
		try { event.dataTransfer.setData('text/plain', String(index)); } catch (e) { /* navegador restrictivo */ }
	}
};

ColumnDragController.prototype.over = function (index, event) {
	if (this.state.index === null) return;
	if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
	this.state.overIndex = index;
};

ColumnDragController.prototype.leave = function (index) {
	if (this.state.overIndex === index) this.state.overIndex = null;
};

ColumnDragController.prototype.drop = function (index, event) {
	if (event && event.preventDefault) event.preventDefault();
	var from = this.state.index;
	this.reset();
	if (from === null || from === index) return;
	this.onMove(from, index);
};

ColumnDragController.prototype.end = function () {
	this.reset();
};

ColumnDragController.prototype.reset = function () {
	this.state.armed = null;
	this.state.index = null;
	this.state.overIndex = null;
};

export default ColumnDragController;

// Estado inicial, para que la tabla lo cree reactivo en su data().
export function initialDragState() {
	return { armed: null, index: null, overIndex: null };
}
