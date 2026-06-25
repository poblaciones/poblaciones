/**
 * ActiveMultiselectedMetric — un indicador del pivot que puede combinar varios
 * censos (versiones). Reemplaza, dentro del módulo tabla, el modelo de puntero
 * único (SelectedVersion/SelectedLevel/SelectedVariable) por una COLECCIÓN de
 * Selections: una por censo elegido, cada una con su propio nivel y variable.
 *
 * Conceptos:
 *  - Variable lógica: lo que el usuario elige en el combo, identificada por Name.
 *    Su instancia física difiere entre censos y niveles.
 *  - La oferta de censos para una variable lógica se basa en si esa variable
 *    existe en ALGÚN nivel del censo. La disponibilidad real al nivel de
 *    desagregación que imponen las regiones la evalúa la pivot (y se marca en el
 *    encabezado), no se oculta la columna.
 *  - SelectByCaption gobierna la invariante: toda Selection mantiene una variable
 *    cuyo Name es el de la variable lógica vigente. Nada que rompa esa
 *    correspondencia entra en la colección.
 *
 * `properties` conserva la estructura del servidor (Versions→Levels→Variables);
 * esta clase no la muta salvo SelectedLevelIndex al hacer drill (vía Selection).
 */

import Selection from './Selection.js';

export default ActiveMultiselectedMetric;

function ActiveMultiselectedMetric(properties) {
	this.properties = properties;
	this.Selections = [];
	// Variable lógica vigente (Name). Arranca con la primera disponible.
	this._variableName = null;
	var names = this.AvailableVariables();
	if (names.length) this.SelectByCaption(names[0]);
}

// ── Oferta de variables y censos ──────────────────────────────────────────────

// Unión de las variables lógicas (por Name) presentes en cualquier nivel de
// cualquier censo. Es lo que ofrece el combo de variable.
ActiveMultiselectedMetric.prototype.AvailableVariables = function () {
	var seen = {};
	var out = [];
	var versions = this.properties.Versions;
	for (var v = 0; v < versions.length; v++) {
		var levels = versions[v].Levels;
		for (var l = 0; l < levels.length; l++) {
			var vars = levels[l].Variables;
			for (var a = 0; a < vars.length; a++) {
				var name = vars[a].Name;
				if (!seen[name]) { seen[name] = true; out.push(name); }
			}
		}
	}
	return out;
};

// Censos (Version) en los que existe la variable lógica dada (en algún nivel).
// Es lo que el combo ofrece como años seleccionables para esa variable.
ActiveMultiselectedMetric.prototype.VersionsForVariable = function (variableName) {
	var out = [];
	var versions = this.properties.Versions;
	for (var v = 0; v < versions.length; v++) {
		if (this._findVariableInVersion(versions[v], variableName)) out.push(versions[v]);
	}
	return out;
};

// Busca, en un censo, la variable lógica preferentemente en un nivel dado (por
// nombre); si no, en cualquier nivel. Devuelve { level, variable } o null.
ActiveMultiselectedMetric.prototype._findVariableInVersion = function (version, variableName, preferLevelName) {
	var levels = version.Levels;
	var fallback = null;
	for (var l = 0; l < levels.length; l++) {
		var vars = levels[l].Variables;
		for (var a = 0; a < vars.length; a++) {
			if (vars[a].Name === variableName) {
				var hit = { level: levels[l], variable: vars[a] };
				if (preferLevelName != null && levels[l].Name === preferLevelName) return hit;
				if (!fallback) fallback = hit;
			}
		}
	}
	return fallback;
};

// ── Gobierno de la selección ──────────────────────────────────────────────────

// Elige la variable lógica vigente y rearma las Selections para los censos
// indicados (o todos los que la tengan, si no se indica). Garantiza que cada
// Selection quede con una variable del Name pedido. Censos sin esa variable se
// descartan. Es el único punto que establece la correspondencia lógica.
ActiveMultiselectedMetric.prototype.SelectByCaption = function (variableName, versionIds, preferLevelName) {
	this._variableName = variableName;
	var available = this.VersionsForVariable(variableName);

	var wanted = available;
	if (versionIds && versionIds.length) {
		wanted = available.filter(function (ver) {
			return versionIds.indexOf(ver.Version.Id) !== -1;
		});
	}
	if (!wanted.length && available.length) wanted = [available[0]];

	var loc = this;
	this.Selections = wanted.map(function (ver) {
		var hit = loc._findVariableInVersion(ver, variableName, preferLevelName);
		var sel = new Selection(ver, hit.level, hit.variable);
		return sel;
	});
	return this.Selections;
};

// Restringe los censos activos (años) dentro de la variable lógica vigente.
ActiveMultiselectedMetric.prototype.SelectVersions = function (versionIds) {
	return this.SelectByCaption(this._variableName, versionIds);
};

ActiveMultiselectedMetric.prototype.variableName = function () { return this._variableName; };
ActiveMultiselectedMetric.prototype.isMultiVersion = function () { return this.Selections.length > 1; };

// ── Tuplas ───────────────────────────────────────────────────────────────────

// Emite las tuplas de columna del indicador: por cada Selection (censo), una por
// categoría elegida más la Total si corresponde, o una sola si la variable no
// tiene categorías. `makeTuple(selection, labelId, labelName, isTotal)` arma la
// tupla concreta (la inyecta la pivot, que conoce el formato físico).
ActiveMultiselectedMetric.prototype.emitTuples = function (makeTuple) {
	var out = [];
	for (var s = 0; s < this.Selections.length; s++) {
		var sel = this.Selections[s];
		var labels = sel.variable.ValueLabels;
		if (!labels || labels.length === 0) {
			out.push(makeTuple(sel, null, null, false));
			continue;
		}
		var chosen = sel.labels;
		if (chosen && chosen.length) {
			for (var j = 0; j < labels.length; j++) {
				if (chosen.indexOf(labels[j].Id) !== -1) {
					out.push(makeTuple(sel, labels[j].Id, labels[j].Name, false));
				}
			}
		}
		if (sel.includeTotal) out.push(makeTuple(sel, null, 'Total', true));
	}
	return out;
};

// ── Serialización a ruta ─────────────────────────────────────────────────────

// Representa la selección como índices posicionales por censo:
// "<variableName>~<vIdx>:<lvlIdx>:<labels|total>;..." — compacto y estable.
ActiveMultiselectedMetric.prototype.serialize = function () {
	var versions = this.properties.Versions;
	var parts = this.Selections.map(function (sel) {
		var vIdx = versions.indexOf(sel.version);
		var lvlIdx = sel.levelIndex();
		var labels = (sel.labels && sel.labels.length) ? sel.labels.join('.') : '';
		var total = sel.includeTotal ? 't' : '';
		return vIdx + ':' + lvlIdx + ':' + labels + ':' + total;
	});
	return encodeURIComponent(this._variableName || '') + '~' + parts.join(';');
};

// Restaura desde la cadena, descartando lo que ya no exista o no sea consistente
// (un censo, nivel o variable que cambió). La variable lógica (Name) manda: las
// Selections restauradas siempre quedan con una variable de ese Name.
ActiveMultiselectedMetric.prototype.restore = function (str) {
	if (!str) return;
	var sep = str.indexOf('~');
	if (sep < 0) return;
	var variableName = decodeURIComponent(str.slice(0, sep));
	if (this.AvailableVariables().indexOf(variableName) === -1) return; // ya no existe

	var versions = this.properties.Versions;
	var versionIds = [];
	var perVersion = {};
	str.slice(sep + 1).split(';').forEach(function (chunk) {
		if (!chunk) return;
		var f = chunk.split(':');
		var vIdx = parseInt(f[0], 10);
		if (isNaN(vIdx) || vIdx < 0 || vIdx >= versions.length) return;
		var ver = versions[vIdx];
		versionIds.push(ver.Version.Id);
		perVersion[ver.Version.Id] = { lvlIdx: parseInt(f[1], 10), labels: f[2], total: f[3] };
	});

	this.SelectByCaption(variableName, versionIds);

	// Reaplica nivel y labels donde sigan siendo válidos.
	for (var s = 0; s < this.Selections.length; s++) {
		var sel = this.Selections[s];
		var saved = perVersion[sel.versionId()];
		if (!saved) continue;
		if (!isNaN(saved.lvlIdx) && saved.lvlIdx >= 0 && saved.lvlIdx < sel.version.Levels.length) {
			sel.moveToLevelNamed(sel.version.Levels[saved.lvlIdx].Name);
		}
		sel.includeTotal = saved.total === 't';
		if (saved.labels) {
			var ids = saved.labels.split('.').map(Number);
			var valid = {};
			sel.variable.ValueLabels.forEach(function (lab) { valid[lab.Id] = true; });
			sel.labels = ids.filter(function (id) { return valid[id]; });
		}
	}
};
