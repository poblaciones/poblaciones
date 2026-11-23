import UndoClassifier from '@/map/classes/UndoClassifier';

export default UndoHistory;

var MAX_ENTRIES = 50;
// Un cambio de estado solo cuenta como acción si llega poco después de una interacción del
// usuario: así las cargas iniciales y las respuestas tardías del servidor no se vuelven deshacibles.
var USER_INPUT_WINDOW_MS = 30000;
// El encuadre previo a una acción que puede moverlo vale solo mientras esa acción se resuelve.
var FRAME_NOTE_WINDOW_MS = 10000;

// Historial de acciones del usuario con deshacer y rehacer.
//
// Cada vez que se actualiza la ruta (SaveRoute.UpdateRoute) compara el estado con el anterior;
// si la diferencia es una acción deshacible (UndoClassifier) guarda una entrada con los valores
// previos de los bloques afectados. Deshacer los restaura y deja en la pila de rehacer los
// valores que había en ese momento, y viceversa.
//
// driver: Capture() -> instantánea; Pick(instantánea, bloques) -> valores; Apply(valores, bloques) -> Promise.
// state: objeto (reactivo en Vue) donde se publica lo que muestra la interfaz.
function UndoHistory(driver, state) {
	this.driver = driver;
	this.state = state;
	this.undoStack = [];
	this.redoStack = [];
	this.baseline = null;
	this.applying = false;
	this.lastUserInputAt = 0;
	this.frameNote = null;
	this.publish();
};

UndoHistory.prototype.NoteUserInput = function () {
	this.lastUserInputAt = Date.now();
};

// Guarda el encuadre actual antes de una acción que puede moverlo (clic en un elemento, recorte).
UndoHistory.prototype.NoteFrame = function () {
	if (this.applying) {
		return;
	}
	this.frameNote = { frame: this.driver.Capture().frame, at: Date.now() };
};

// Toma el estado actual como punto de partida, sin registrar nada. Para cargas desde la ruta.
UndoHistory.prototype.Rebase = function () {
	this.baseline = this.driver.Capture();
	this.lastUserInputAt = 0;
	this.frameNote = null;
};

UndoHistory.prototype.OnRouteChanged = function () {
	if (this.applying) {
		return;
	}
	var after = this.driver.Capture();
	var before = this.baseline;
	this.baseline = after;
	if (before === null || !this.userActedRecently()) {
		return;
	}
	var note = this.takeFrameNote();
	var change = UndoClassifier.Classify(before, after, note);
	if (change === null) {
		return;
	}
	var snapshot = before;
	if (note !== null) {
		snapshot = Object.assign({}, before, { frame: note.frame });
	}
	this.push({
		label: change.label,
		blocks: change.blocks,
		values: this.driver.Pick(snapshot, change.blocks)
	});
};

UndoHistory.prototype.userActedRecently = function () {
	return Date.now() - this.lastUserInputAt <= USER_INPUT_WINDOW_MS;
};

UndoHistory.prototype.takeFrameNote = function () {
	var note = this.frameNote;
	this.frameNote = null;
	if (note !== null && Date.now() - note.at <= FRAME_NOTE_WINDOW_MS) {
		return note;
	}
	return null;
};

// Acción que no pasa por la ruta (p. ej. quitar un reciente, cerrar un panel): quien la registra aporta
// cómo deshacerla y rehacerla. Se ignora mientras se aplica otra entrada.
UndoHistory.prototype.RecordCustom = function (label, undo, redo) {
	if (this.applying) {
		return;
	}
	this.push({ label: label, custom: true, undo: undo, redo: redo });
};

UndoHistory.prototype.push = function (entry) {
	this.undoStack.push(entry);
	if (this.undoStack.length > MAX_ENTRIES) {
		this.undoStack.shift();
	}
	this.redoStack = [];
	this.publish();
};

UndoHistory.prototype.CanUndo = function () {
	return !this.applying && this.undoStack.length > 0;
};

UndoHistory.prototype.CanRedo = function () {
	return !this.applying && this.redoStack.length > 0;
};

UndoHistory.prototype.Undo = function () {
	if (!this.CanUndo()) {
		return Promise.resolve(false);
	}
	var entry = this.undoStack.pop();
	return this.run(entry, this.redoStack);
};

UndoHistory.prototype.Redo = function () {
	if (!this.CanRedo()) {
		return Promise.resolve(false);
	}
	var entry = this.redoStack.pop();
	return this.run(entry, this.undoStack);
};

// Aplica la entrada y deja en la pila opuesta la que la revierte.
UndoHistory.prototype.run = function (entry, oppositeStack) {
	var loc = this;
	if (entry.custom) {
		// Mientras se aplica, lo que la acción dispare no se registra como una acción nueva.
		this.applying = true;
		try {
			entry.undo();
		} finally {
			this.applying = false;
		}
		oppositeStack.push({ label: entry.label, custom: true, undo: entry.redo, redo: entry.undo });
		this.publish();
		return Promise.resolve(true);
	}
	var current = this.driver.Pick(this.driver.Capture(), entry.blocks);
	this.applying = true;
	this.publish();
	return this.driver.Apply(entry.values, entry.blocks).then(function () {
		oppositeStack.push({ label: entry.label, blocks: entry.blocks, values: current });
		loc.finishApply();
		return true;
	}, function (error) {
		loc.finishApply();
		throw error;
	});
};

// Atajos: Ctrl/Cmd+Z deshace; Ctrl/Cmd+Y y Ctrl/Cmd+Shift+Z rehacen. En los campos de texto
// se deja el deshacer propio del navegador. Devuelve true si el evento fue un atajo atendido.
UndoHistory.prototype.HandleKeyDown = function (event) {
	if (event.defaultPrevented || event.altKey || !(event.ctrlKey || event.metaKey)) {
		return false;
	}
	if (UndoHistory.isTextTarget(event.target)) {
		return false;
	}
	var key = String(event.key).toLowerCase();
	var isUndo = (key === 'z' && !event.shiftKey);
	var isRedo = (key === 'y' && !event.shiftKey) || (key === 'z' && event.shiftKey);
	if (!isUndo && !isRedo) {
		return false;
	}
	event.preventDefault();
	if (isUndo) {
		this.Undo();
	} else {
		this.Redo();
	}
	return true;
};

UndoHistory.isTextTarget = function (target) {
	if (!target) {
		return false;
	}
	if (target.isContentEditable) {
		return true;
	}
	var tag = String(target.tagName).toUpperCase();
	return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
};

UndoHistory.prototype.finishApply = function () {
	this.baseline = this.driver.Capture();
	this.applying = false;
	this.lastUserInputAt = 0;
	this.frameNote = null;
	this.publish();
};

UndoHistory.prototype.publish = function () {
	var undoEntry = this.undoStack[this.undoStack.length - 1];
	var redoEntry = this.redoStack[this.redoStack.length - 1];
	this.state.CanUndo = this.CanUndo();
	this.state.CanRedo = this.CanRedo();
	this.state.UndoLabel = UndoHistory.tooltip('Deshacer', undoEntry);
	this.state.RedoLabel = UndoHistory.tooltip('Rehacer', redoEntry);
};

UndoHistory.tooltip = function (verb, entry) {
	if (entry === undefined) {
		return verb;
	}
	return verb + ': ' + entry.label;
};
