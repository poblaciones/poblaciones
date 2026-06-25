import axios from 'axios';
import str from '@/common/framework/str';
import err from '@/common/framework/err';
import session from '@/common/framework/session';
import { findBoundaryNode, flattenLeaves } from '@/table/classes/boundaryTree';

export default StartTable;

function StartTable(workReference, config, pivot) {
	this.workReference = workReference;
	this.config = config;
	this.pivot = pivot;
}

// Idéntica a StartMap.ResolveWorkIdFromUrl, pero busca /table/ en lugar de /map/.
StartTable.ResolveWorkIdFromUrl = function () {
	var pathArray = window.location.pathname.split('/');
	if (pathArray.length > 0 && pathArray[pathArray.length - 1] === '') {
		pathArray.pop();
	}
	if (pathArray.length > 0 && pathArray[pathArray.length - 1] === 'table') {
		pathArray.pop();
	}
	var link = null;
	if (pathArray.length > 0 && pathArray[pathArray.length - 1].length === 18) {
		link = pathArray.pop();
	}
	if (pathArray.length === 0 || !str.isNumeric(pathArray[pathArray.length - 1])) {
		return { workId: null, link: null };
	} else {
		return { workId: parseInt(pathArray[pathArray.length - 1]), link: link };
	}
};

// Trae el work y sus datos de startup, luego aplica el estado inicial al pivot.
// Solo se llama cuando hay un workId en la URL y la ruta no tiene contenido
// serializado (ruta "limpia", sin parámetros de pivot en la query).
// Trae el work y sus datos de startup. Siempre setea workReference.Current (de
// lo que depende el zócalo informativo). Aplica el estado inicial al pivot solo
// si applyStartup es true: cuando la ruta trae el estado de la pivot serializado
// (deep-link), ese estado manda y no se pisa con el startup del work.
StartTable.prototype.RestoreWork = function (workId, link, applyStartup) {
	var loc = this;
	return axios.get(window.host + '/services/works/GetWorkAndDefaultFrame', session.AddSession(window.host, {
		params: { w: workId },
		headers: (link ? { 'Access-Link': link } : {})
	})).then(function (res) {
		session.ReceiveSession(window.host, res);
		loc.workReference.Current = res.data.work;
		if (applyStartup) {
			return loc.ApplyWorkStartup(loc.workReference.Current.Startup);
		}
		return null;
	}).catch(function (error) {
		err.errDialog('GetWork', 'obtener la información del servidor', error);
	});
};

// Aplica el startup del work al pivot: métricas y región/filtro inicial.
// Equivalente a ReceiveWorkStartup + LoadStartMetrics de StartMap, adaptado
// a la pivot: el clipping se traduce a FilterSet y la región de filas se
// resuelve desde los defaults de configuración.
StartTable.prototype.ApplyWorkStartup = function (startup) {
	var loc = this;
	var tasks = [];

	// ── Métricas ──────────────────────────────────────────────────────────────
	// startup.ActiveMetrics: lista separada por comas de metricIds.
	// Si no hay, se toma la única métrica del work; si hay más de una sin
	// preselección, se deja la pivot sin columnas y el usuario elige.
	if (startup.ActiveMetrics) {
		var metricIds = startup.ActiveMetrics.split(',');
		for (var n = 0; n < metricIds.length; n++) {
			tasks.push(loc.pivot.AddMetricById(metricIds[n]));
		}
	} else {
		var current = loc.workReference.Current;
		if (current.Metrics.length === 1) {
			tasks.push(loc.pivot.AddMetricById(current.Metrics[0].Id));
		}
	}

	// ── Región de filas y filtro ──────────────────────────────────────────────
	var regionTask = loc._applyStartupRegion(startup);
	if (regionTask) tasks.push(regionTask);

	return Promise.all(tasks);
};

// Resuelve qué boundary usar como filas y, si aplica, cuál como filtro.
//
// Con ClippingRegionItemId (startup.Type === 'R'):
//   - El item de clipping se agrega al FilterSet (semántica AND).
//   - Para las filas se elige un boundary más desagregado:
//       · Si el boundary del item coincide con DefaultPivotBoundaryId
//         → filas = DefaultPivotSubBoundaryId.
//       · Si no coincide (el item ya es de un sub-nivel)
//         → filas = DefaultPivotSubSubBoundaryId.
//
// Sin ClippingRegionItemId (cualquier otro tipo de startup):
//   - Filas = DefaultPivotBoundaryId completo.
StartTable.prototype._applyStartupRegion = function (startup) {
	var loc = this;
	var config = loc.config;

	if (startup.Type !== 'R' || startup.ClippingRegionItemId == null) {
		if (config.DefaultPivotBoundaryId == null) return null;
		return loc.pivot.AddRegionById(config.DefaultPivotBoundaryId);
	}

	var itemId = startup.ClippingRegionItemId;
	var clippingBoundaryId = _findBoundaryIdForItem(itemId);

	var rowBoundaryId;
	/* eslint-disable-next-line eqeqeq */
	if (clippingBoundaryId != null && clippingBoundaryId == config.DefaultPivotBoundaryId) {
		rowBoundaryId = config.DefaultPivotSubBoundaryId;
	} else {
		rowBoundaryId = config.DefaultPivotSubSubBoundaryId;
	}

	var tasks = [];
	if (clippingBoundaryId != null) {
		tasks.push(loc.pivot.AddFilterItemsById(clippingBoundaryId, [itemId]));
	}
	if (rowBoundaryId != null) {
		tasks.push(loc.pivot.AddRegionById(rowBoundaryId));
	}
	return Promise.all(tasks);
};

// Busca en el árbol de boundaries (window.Context.Boundaries, ya cargado)
// el boundaryId (Id del nodo "tipo") al que pertenece un itemId dado.
// Usa findBoundaryNode/flattenLeaves de boundaryTree para respetar la
// estructura del árbol (Items planos o agrupados por Parent).
// Devuelve el boundaryId o null si no se encuentra.
function _findBoundaryIdForItem(itemId) {
	var boundaries = window.Context ? window.Context.Boundaries : null;
	if (!boundaries) return null;
	return _searchNodes(boundaries, itemId);
}

function _searchNodes(nodes, itemId) {
	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		// Nodo "tipo" seleccionable: tiene VersionId. Se busca el itemId entre
		// sus hojas usando flattenLeaves, que maneja tanto Items planos como
		// agrupados por Parent.
		if (node.VersionId != null) {
			var leaves = flattenLeaves(node);
			for (var j = 0; j < leaves.length; j++) {
				/* eslint-disable-next-line eqeqeq */
				if (leaves[j].FID == itemId) return node.Id;
			}
		}
		// Sub-categorías navegables: nodos intermedios sin VersionId.
		if (Array.isArray(node.Items) && node.Items.length &&
				node.Items[0] && node.Items[0].Items !== undefined) {
			var found = _searchNodes(node.Items, itemId);
			if (found != null) return found;
		}
	}
	return null;
}
