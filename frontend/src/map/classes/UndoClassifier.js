// Decide si la diferencia entre dos estados del visor es una acción deshacible y cómo se llama.
// Trabaja sobre instantáneas (ver RouteStateDriver.Capture), sin tocar el mapa: es lógica pura.
//
// Una instantánea tiene la forma:
//   { frame: 'lat,lon,zz', basemap: 'r...', featureInfo: '...',
//     clipping: { regions: '1,2', circle: '...' },
//     layers: [ { key: 'm12' | 'b5', name: '...', isBoundary: false, state: { clave: valor } } ] }
//
// Qué cuenta como acción y qué no está documentado en la sección «Deshacer y rehacer» de las pautas.

export default UndoClassifier;

var BLOCK_INFOS = 'infos';
var BLOCK_BASEMAP = 'basemap';
var BLOCK_CLIPPING = 'clipping';
var BLOCK_FEATURE = 'featureInfo';
var BLOCK_FRAME = 'frame';

UndoClassifier.BLOCK_INFOS = BLOCK_INFOS;
UndoClassifier.BLOCK_BASEMAP = BLOCK_BASEMAP;
UndoClassifier.BLOCK_CLIPPING = BLOCK_CLIPPING;
UndoClassifier.BLOCK_FEATURE = BLOCK_FEATURE;
UndoClassifier.BLOCK_FRAME = BLOCK_FRAME;

// Claves de la ruta de una capa que son estado de presentación, no una acción del usuario.
var IGNORED_LAYER_KEYS = ['c'];

function UndoClassifier() {
};

// Devuelve null si no hay nada deshacible, o { label, blocks }.
// frameNote: encuadre previo a una acción que puede moverlo (clic en un elemento, recorte), o null.
UndoClassifier.Classify = function (before, after, frameNote) {
	var layersLabel = UndoClassifier.classifyLayers(before.layers, after.layers);
	var clippingLabel = UndoClassifier.classifyClipping(before.clipping, after.clipping);
	var basemapLabel = UndoClassifier.classifyBasemap(before.basemap, after.basemap);
	var featureLabel = UndoClassifier.classifyFeature(before.featureInfo, after.featureInfo);

	var blocks = [];
	var label = null;
	if (layersLabel !== null) {
		blocks.push(BLOCK_INFOS);
		label = layersLabel;
	}
	if (clippingLabel !== null) {
		blocks.push(BLOCK_CLIPPING);
		if (label === null) {
			label = clippingLabel;
		}
	}
	if (basemapLabel !== null) {
		blocks.push(BLOCK_BASEMAP);
		if (label === null) {
			label = basemapLabel;
		}
	}
	if (featureLabel !== null) {
		blocks.push(BLOCK_FEATURE);
		if (label === null) {
			label = featureLabel;
		}
	}
	if (label === null) {
		return null;
	}
	// Si el panel de un elemento se cierra junto con otra acción (p. ej. quitar la capa a la que
	// pertenecía), se restaura con ella.
	if (blocks.indexOf(BLOCK_FEATURE) === -1 && before.featureInfo !== after.featureInfo) {
		blocks.push(BLOCK_FEATURE);
	}
	var movesFrame = (blocks.indexOf(BLOCK_CLIPPING) !== -1 || blocks.indexOf(BLOCK_FEATURE) !== -1);
	if (movesFrame && frameNote !== null && frameNote !== undefined) {
		blocks.push(BLOCK_FRAME);
	}
	return { label: label, blocks: blocks };
};

// ---------- Capas (indicadores y delimitaciones) ----------

UndoClassifier.classifyLayers = function (beforeLayers, afterLayers) {
	var beforeKeys = beforeLayers.map(function (layer) { return layer.key; });
	var afterKeys = afterLayers.map(function (layer) { return layer.key; });
	var added = afterLayers.filter(function (layer) { return beforeKeys.indexOf(layer.key) === -1; });
	var removed = beforeLayers.filter(function (layer) { return afterKeys.indexOf(layer.key) === -1; });

	if (added.length > 0 || removed.length > 0) {
		return UndoClassifier.labelAddedAndRemoved(added, removed);
	}
	if (beforeKeys.join(',') !== afterKeys.join(',')) {
		return 'Reordenar las capas';
	}
	var labels = [];
	for (var n = 0; n < afterLayers.length; n++) {
		var label = UndoClassifier.classifyLayerState(beforeLayers[n], afterLayers[n]);
		if (label !== null) {
			labels.push(label);
		}
	}
	if (labels.length === 0) {
		return null;
	}
	if (labels.length === 1) {
		return labels[0];
	}
	return 'Cambiar las capas';
};

UndoClassifier.labelAddedAndRemoved = function (added, removed) {
	if (added.length === 1 && removed.length === 0) {
		return 'Agregar ' + UndoClassifier.layerName(added[0]);
	}
	if (removed.length === 1 && added.length === 0) {
		return 'Quitar ' + UndoClassifier.layerName(removed[0]);
	}
	if (removed.length === 0) {
		return 'Agregar ' + added.length + ' capas';
	}
	if (added.length === 0) {
		return 'Quitar ' + removed.length + ' capas';
	}
	return 'Cambiar las capas';
};

UndoClassifier.layerName = function (layer) {
	if (layer.name) {
		return '«' + layer.name + '»';
	}
	return 'la capa';
};

// Cambios dentro de una misma capa. Un cambio de nivel que acompaña al zoom (el nivel elegido
// coincide con el automático antes y después) no es una acción, y arrastra consigo las claves
// que dependen del nivel visible (variables, categorías, tramas).
UndoClassifier.classifyLayerState = function (before, after) {
	var changed = UndoClassifier.changedKeys(before.state, after.state);
	if (changed.length === 0) {
		return null;
	}
	if (UndoClassifier.levelFollowsZoom(before.state, after.state)) {
		return null;
	}
	if (after.isBoundary) {
		return UndoClassifier.labelBoundaryChange(before, after, changed);
	}
	return UndoClassifier.labelMetricChange(before, after, changed);
};

UndoClassifier.changedKeys = function (beforeState, afterState) {
	var keys = Object.keys(beforeState);
	for (var key in afterState) {
		if (keys.indexOf(key) === -1) {
			keys.push(key);
		}
	}
	var changed = [];
	for (var n = 0; n < keys.length; n++) {
		var key = keys[n];
		if (IGNORED_LAYER_KEYS.indexOf(key) === -1 && beforeState[key] !== afterState[key]) {
			changed.push(key);
		}
	}
	return changed;
};

// 'a' es el nivel elegido y 'q' el que resuelve el zoom: si en ambos estados son iguales, el
// nivel simplemente sigue al zoom.
UndoClassifier.levelFollowsZoom = function (beforeState, afterState) {
	var levelChanged = (beforeState.a !== afterState.a || beforeState.q !== afterState.q);
	if (!levelChanged) {
		return false;
	}
	return beforeState.a === beforeState.q && afterState.a === afterState.q;
};

UndoClassifier.labelMetricChange = function (before, after, changed) {
	var name = UndoClassifier.layerName(after);
	if (changed.indexOf('v') !== -1) {
		return UndoClassifier.labelVersionChange(before.state.v, after.state.v, name);
	}
	if (UndoClassifier.hasAny(changed, ['a', 'q', 'l'])) {
		return 'Cambiar el nivel de ' + name;
	}
	if (changed.indexOf('i') !== -1) {
		return 'Cambiar la variable de ' + name;
	}
	if (changed.indexOf('x') !== -1) {
		return 'Cambiar la partición de ' + name;
	}
	if (changed.indexOf('u') !== -1) {
		return 'Cambiar el filtro de urbanidad de ' + name;
	}
	if (changed.indexOf('m') !== -1) {
		return 'Cambiar la medida de ' + name;
	}
	if (changed.indexOf('k') !== -1) {
		return UndoClassifier.labelRankingChange(before.state.k, after.state.k, name);
	}
	if (changed.indexOf('w') !== -1) {
		return UndoClassifier.labelCategoriesChange(after.state.w, name);
	}
	return 'Cambiar las opciones de ' + name;
};

// Compare activo si la serie trae dos índices separados por coma.
UndoClassifier.labelVersionChange = function (beforeValue, afterValue, name) {
	var wasComparing = (String(beforeValue).indexOf(',') !== -1);
	var isComparing = (String(afterValue).indexOf(',') !== -1);
	if (!wasComparing && isComparing) {
		return 'Comparar series de ' + name;
	}
	if (wasComparing && !isComparing) {
		return 'Salir de la comparación de ' + name;
	}
	if (isComparing) {
		return 'Cambiar las series comparadas de ' + name;
	}
	return 'Cambiar la serie de ' + name;
};

UndoClassifier.labelRankingChange = function (beforeValue, afterValue, name) {
	if (beforeValue === '') {
		return 'Abrir el ranking de ' + name;
	}
	if (afterValue === '') {
		return 'Cerrar el ranking de ' + name;
	}
	return 'Cambiar el ranking de ' + name;
};

UndoClassifier.labelCategoriesChange = function (afterValue, name) {
	if (afterValue === '' || afterValue === undefined || afterValue === null) {
		return 'Seleccionar todas las categorías de ' + name;
	}
	return 'Cambiar las categorías visibles de ' + name;
};

UndoClassifier.labelBoundaryChange = function (before, after, changed) {
	var name = UndoClassifier.layerName(after);
	if (changed.indexOf('v') !== -1) {
		if (after.state.v === '0') {
			return 'Ocultar ' + name;
		}
		return 'Mostrar ' + name;
	}
	if (changed.indexOf('a') !== -1) {
		return 'Cambiar la serie de ' + name;
	}
	if (changed.indexOf('w') !== -1) {
		return UndoClassifier.labelCategoriesChange(after.state.w, name);
	}
	if (changed.indexOf('m') !== -1) {
		return 'Cambiar la medida de ' + name;
	}
	return 'Cambiar las opciones de ' + name;
};

UndoClassifier.hasAny = function (list, candidates) {
	for (var n = 0; n < candidates.length; n++) {
		if (list.indexOf(candidates[n]) !== -1) {
			return true;
		}
	}
	return false;
};

// ---------- Mapa base ----------

// El valor es el tipo de mapa seguido de 'n' (etiquetas ocultas) y de la letra de cada capa visible.
// Vacío equivale al tipo por defecto, 'r'.
UndoClassifier.classifyBasemap = function (before, after) {
	var beforeValue = UndoClassifier.normalizeBasemap(before);
	var afterValue = UndoClassifier.normalizeBasemap(after);
	if (beforeValue === afterValue) {
		return null;
	}
	if (beforeValue.charAt(0) !== afterValue.charAt(0)) {
		return 'Cambiar el mapa base';
	}
	if (UndoClassifier.withoutLabelsFlag(beforeValue) !== UndoClassifier.withoutLabelsFlag(afterValue)) {
		return 'Cambiar las capas del mapa base';
	}
	if (afterValue.indexOf('n') !== -1) {
		return 'Ocultar las etiquetas del mapa';
	}
	return 'Mostrar las etiquetas del mapa';
};

UndoClassifier.normalizeBasemap = function (value) {
	if (!value) {
		return 'r';
	}
	return value;
};

UndoClassifier.withoutLabelsFlag = function (value) {
	return value.charAt(0) + value.substr(1).split('n').join('');
};

// ---------- Recorte ----------

// Solo cuentan las regiones y el círculo; el nivel del recorte lo resuelve el zoom.
UndoClassifier.classifyClipping = function (before, after) {
	if (before.circle !== after.circle) {
		if (before.circle === '') {
			return 'Seleccionar un círculo';
		}
		if (after.circle === '') {
			return 'Quitar el círculo';
		}
		return 'Cambiar el círculo';
	}
	if (before.regions !== after.regions) {
		if (before.regions === '') {
			return 'Seleccionar un recorte';
		}
		if (after.regions === '') {
			return 'Quitar el recorte';
		}
		return 'Cambiar el recorte';
	}
	return null;
};

// ---------- Elemento seleccionado ----------

// Abrir, cambiar o cerrar el panel de un elemento son acciones.
UndoClassifier.classifyFeature = function (before, after) {
	if (after !== '' && after !== before) {
		return 'Seleccionar un elemento';
	}
	if (after === '' && before !== '') {
		return 'Cerrar el panel del elemento';
	}
	return null;
};
