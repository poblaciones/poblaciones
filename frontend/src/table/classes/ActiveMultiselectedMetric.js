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
	this.Store = null;          // MetricStore (lo asigna CreateActiveMetric)
	this.InstanceId = null;     // identidad de instancia (la asigna el store)
	// Variable lógica vigente (Name). Arranca con la primera disponible y el censo
	// más reciente (el último en el orden en que vienen); el usuario agrega más
	// años desde el combo.
	this._variableName = null;
	var names = this.AvailableVariables();
	if (names.length) {
		var firstVersions = this.VersionsForVariable(names[0]);
		var lastId = firstVersions.length ? [firstVersions[firstVersions.length - 1].Version.Id] : null;
		this.SelectByCaption(names[0], lastId);
	}
}

// ── Acceso a la estructura (reemplaza lo que la pivot usaba de ActiveMetric) ───

ActiveMultiselectedMetric.prototype.GetVariableById = function (variableId) {
	var versions = this.properties.Versions;
	for (var v = 0; v < versions.length; v++) {
		for (var l = 0; l < versions[v].Levels.length; l++) {
			var vars = versions[v].Levels[l].Variables;
			for (var i = 0; i < vars.length; i++) {
				if (vars[i].Id == variableId) return vars[i];
			}
		}
	}
	return null;
};

// En el módulo tabla no se usa el comparador; los valores son los ValueLabels.
ActiveMultiselectedMetric.prototype.ResolveVariableValues = function (variable) {
	return variable.ValueLabels;
};

// Diccionario { labelId: FillColor } que cubre las categorías de TODAS las
// versiones (cada censo tiene sus propios labelId para las mismas categorías).
// Resuelve el "gris en versiones posteriores": antes solo cubría la versión
// activa, dejando sin color a las demás.
ActiveMultiselectedMetric.prototype.GetStyleColorDictionary = function () {
	var ret = {};
	var versions = this.properties.Versions;
	for (var v = 0; v < versions.length; v++) {
		var levels = versions[v].Levels;
		for (var l = 0; l < levels.length; l++) {
			var vars = levels[l].Variables;
			for (var a = 0; a < vars.length; a++) {
				var values = this.ResolveVariableValues(vars[a]);
				for (var i = 0; i < values.length; i++) ret[values[i].Id] = values[i].FillColor;
			}
		}
	}
	return ret;
};

// Modos de medición disponibles para una variable/nivel dados (agnóstico de la
// selección única: la pivot le pasa los de una Selection). Misma lógica que el
// original, parametrizada.
ActiveMultiselectedMetric.prototype.getValidMetrics = function (variable, level) {
	var ret = [];
	ret.push({ Key: 'N', Caption: 'Cantidad' });
	if (variable && variable.HasTotals) {
		ret.push({ Key: 'I', Caption: 'Incidencia' });
		ret.push({ Key: 'T', Caption: 'Total' });
	}
	ret.push({ Key: 'P', Caption: 'Distribución' });
	if (this.properties.AllowRowPercent && variable && variable.ValueLabels && variable.ValueLabels.length > 1) {
		ret.push({ Key: 'FIL', Caption: 'Distribución horizontal' });
	}
	if (level && level.HasArea && variable && !variable.IsArea && !(level.Dataset && level.Dataset.AreSegments)) {
		ret.push({ Key: 'K', Caption: 'Área' });
		ret.push({ Key: 'A', Caption: 'Distr. de áreas' });
		ret.push({ Key: 'D', Caption: 'Densidad' });
	}
	for (var n = 0; n < ret.length; n++) {
		var next = (n + 1 === ret.length) ? 0 : n + 1;
		ret[n].Next = ret[next];
		ret[n].Title = 'Métrica: ' + ret[n].Caption + ' (click para cambiar por ' + ret[next].Caption + ')';
	}
	return ret;
};

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
	var changingVariable = this._variableName !== variableName;
	this._variableName = variableName;
	var available = this.VersionsForVariable(variableName);

	var wanted = available;
	if (versionIds && versionIds.length) {
		wanted = available.filter(function (ver) {
			return versionIds.indexOf(ver.Version.Id) !== -1;
		});
	}
	if (!wanted.length && available.length) wanted = [available[0]];

	// Conserva el estado (nivel, categorías) de los censos que sobreviven, salvo
	// que cambie la variable lógica (entonces la selección de categorías ya no
	// aplica y se parte de cero).
	var prev = {};
	if (!changingVariable) {
		this.Selections.forEach(function (s) { prev[s.versionId()] = s; });
	}

	var loc = this;
	this.Selections = wanted.map(function (ver) {
		var existing = prev[ver.Version.Id];
		if (existing) return existing;
		var hit = loc._findVariableInVersion(ver, variableName, preferLevelName);
		return new Selection(ver, hit.level, hit.variable);
	});
	return this.Selections;
};

// Restringe los censos activos (años) dentro de la variable lógica vigente.
ActiveMultiselectedMetric.prototype.SelectVersions = function (versionIds) {
	return this.SelectByCaption(this._variableName, versionIds);
};

ActiveMultiselectedMetric.prototype.variableName = function () { return this._variableName; };
ActiveMultiselectedMetric.prototype.isMultiVersion = function () { return this.Selections.length > 1; };

// Selección de referencia para la UI: la primera. Todas comparten la variable
// lógica, así que su variable/nivel sirven para el modo, la normalización y los
// chequeos del header (IsCategorical, etc.).
ActiveMultiselectedMetric.prototype.referenceSelection = function () {
	return this.Selections.length ? this.Selections[0] : null;
};
ActiveMultiselectedMetric.prototype.referenceVariable = function () {
	var sel = this.referenceSelection();
	return sel ? sel.variable : null;
};
ActiveMultiselectedMetric.prototype.referenceLevel = function () {
	var sel = this.referenceSelection();
	return sel ? sel.level : null;
};

// ¿Está activo este censo (por Id)? Para marcar los tildados en el combo de años.
ActiveMultiselectedMetric.prototype.hasVersion = function (versionId) {
	return this.Selections.some(function (s) { return s.versionId() === versionId; });
};

// ¿La selección de este censo resuelve datos en su nivel actual? Es false cuando
// la variable lógica no existe en el nivel al que quedó la selección (p. ej. un
// censo que solo mide la variable a nivel radio, mostrado a nivel provincia). La
// pivot usa esto para marcar el encabezado del año con un asterisco, sin ocultar
// la columna.
ActiveMultiselectedMetric.prototype.selectionResolvesData = function (versionId) {
	var sel = this.Selections.filter(function (s) { return s.versionId() === versionId; })[0];
	if (!sel) return true;
	var wanted = this._variableName;
	return sel.level.Variables.some(function (v) { return v.Name === wanted; });
};

// Alterna un censo dentro de la variable vigente (lo agrega o lo quita), siempre
// que esa variable exista en él. Mantiene al menos un censo.
ActiveMultiselectedMetric.prototype.toggleVersion = function (versionId) {
	var ids = this.Selections.map(function (s) { return s.versionId(); });
	var pos = ids.indexOf(versionId);
	if (pos >= 0) {
		if (ids.length === 1) return;   // no dejar el indicador sin ningún censo
		ids.splice(pos, 1);
	} else {
		ids.push(versionId);
	}
	this.SelectVersions(ids);
};

// ── Tuplas ───────────────────────────────────────────────────────────────────

// Arma una tupla de columna en el formato que consume la pivot (dataset, headers,
// carga). Combina el indicador con una Selection (censo+nivel+variable) y una
// categoría (o el total).
ActiveMultiselectedMetric.prototype._makeTuple = function (sel, labelId, labelName, isTotal) {
	var version = sel.version, level = sel.level, variable = sel.variable;
	var tuple = {
		metric: this,
		metricId: this.properties.Metric.Id,
		metricName: this.properties.Metric.Name,
		version: version,
		versionId: version.Version.Id,
		versionName: version.Version.Name,
		level: level,
		levelId: level.Id,
		levelName: level.Name,
		variable: variable,
		variableId: variable.Id,
		variableName: variable.Name,
		summary: this.properties.SummaryMetric,
		labelId: labelId,
		labelName: labelName,
		isTotal: !!isTotal,
		isEmpty: false,
		datasetType: (level.Dataset ? level.Dataset.Type : null)
	};
	tuple.key = 'm:' + tuple.metricId + '|v:' + tuple.versionId + '|l:' + tuple.levelId +
		'|a:' + tuple.variableId + '|s:' + (tuple.summary || '') +
		'|c:' + (tuple.isTotal ? 'total' : (tuple.labelId != null ? tuple.labelId : 'none'));
	return tuple;
};

// Emite todas las tuplas del indicador (una por Selection × categoría/total). Es
// lo que la pivot llama en MetricTuples.rebuild().
ActiveMultiselectedMetric.prototype.GetTuples = function () {
	var loc = this;
	return this.emitTuples(function (sel, labelId, labelName, isTotal) {
		return loc._makeTuple(sel, labelId, labelName, isTotal);
	});
};

// ── Tuplas (emisión, agnóstica del formato) ──────────────────────────────────

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
	// Si el indicador no tiene ninguna columna visible (todos sus censos sin
	// categorías ni total), emite una tupla placeholder con la primera selección,
	// para conservar una columna mínima (con su encabezado y el control de
	// categorías) y no desalinear la tabla.
	if (out.length === 0 && this.Selections.length) {
		var ph = makeTuple(this.Selections[0], null, null, false);
		ph.isPlaceholder = true;
		ph.isEmpty = true;
		out.push(ph);
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
