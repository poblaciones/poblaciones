/**
 * CollapseState — estado de colapso de los cortes de control (grupos) de la
 * pivot, con codificación compacta para la URL.
 *
 * El estado conceptual es un arreglo de booleanos (uno por grupo, en orden):
 * true = colapsado, false = expandido. El default es todo expandido.
 *
 * Codificación: para que la cadena no crezca con tablas grandes, los bits se
 * empaquetan de a 6 en caracteres base64url. Un prefijo de un carácter indica la
 * "polaridad": si la mayoría está colapsada, se invierte el bitmap antes de
 * empaquetar (así "casi todo colapsado" también queda corto). Formato:
 *   "<polaridad><base64url>"  ej. "0AB", donde polaridad ∈ {0,1}.
 * Cadena vacía ⇒ todo en su default (expandido).
 *
 * El estado se identifica por la CLAVE del grupo (su nombre de padre), no por el
 * índice, para sobrevivir a reordenamientos. La codificación posicional usa el
 * orden actual de claves que provee quien la consume; al decodificar se vuelve a
 * mapear sobre ese mismo orden.
 */

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export default CollapseState;

function CollapseState() {
	this._collapsed = {};   // key -> true (solo guarda los colapsados)
}

CollapseState.prototype.isCollapsed = function (key) {
	return this._collapsed[key] === true;
};

// Lista de claves (nombres de grupo) actualmente colapsadas.
CollapseState.prototype.collapsedKeys = function () {
	return Object.keys(this._collapsed);
};

CollapseState.prototype.toggle = function (key) {
	if (this._collapsed[key]) delete this._collapsed[key];
	else this._collapsed[key] = true;
};

CollapseState.prototype.setAll = function (keys, collapsed) {
	this._collapsed = {};
	if (collapsed) {
		for (var i = 0; i < keys.length; i++) this._collapsed[keys[i]] = true;
	}
};

// true si todos los grupos dados están colapsados (para el ícono de "todos").
CollapseState.prototype.allCollapsed = function (keys) {
	if (!keys.length) return false;
	for (var i = 0; i < keys.length; i++) if (!this._collapsed[keys[i]]) return false;
	return true;
};

CollapseState.prototype.anyCollapsed = function (keys) {
	for (var i = 0; i < keys.length; i++) if (this._collapsed[keys[i]]) return true;
	return false;
};

// Empaqueta el estado de los grupos `keys` (en ese orden) a una cadena compacta.
CollapseState.prototype.encode = function (keys) {
	if (!keys.length) return '';
	var bits = keys.map(function (k) { return this._collapsed[k] ? 1 : 0; }, this);
	var collapsedCount = bits.reduce(function (a, b) { return a + b; }, 0);
	// Polaridad: si la mayoría está colapsada, se invierte (1 = invertido).
	var polarity = collapsedCount * 2 > keys.length ? 1 : 0;
	if (polarity) bits = bits.map(function (b) { return b ? 0 : 1; });
	if (bits.every(function (b) { return b === 0; })) return polarity ? '1' : '';

	var out = '';
	for (var i = 0; i < bits.length; i += 6) {
		var v = 0;
		for (var j = 0; j < 6; j++) v |= (bits[i + j] || 0) << j;
		out += B64[v];
	}
	return polarity + out;
};

// Reconstruye el estado desde la cadena, mapeándolo sobre `keys` (mismo orden que
// al codificar). Una cadena vacía deja todo expandido.
CollapseState.prototype.decode = function (str, keys) {
	this._collapsed = {};
	if (!str) return this;
	var polarity = str.charAt(0) === '1' ? 1 : 0;
	var payload = str.slice(1);
	var bits = [];
	for (var i = 0; i < payload.length; i++) {
		var v = B64.indexOf(payload.charAt(i));
		if (v < 0) v = 0;
		for (var j = 0; j < 6; j++) bits.push((v >> j) & 1);
	}
	for (var k = 0; k < keys.length; k++) {
		var bit = bits[k] || 0;
		if (polarity) bit = bit ? 0 : 1;
		if (bit) this._collapsed[keys[k]] = true;
	}
	return this;
};
