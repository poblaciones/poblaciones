import axios from 'axios';
import str from '@/common/framework/str';
import err from '@/common/framework/err';
import session from '@/common/framework/session';

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

// Aplica el startup del work al pivot: métricas y filas iniciales. Equivalente a
// ReceiveWorkStartup + LoadStartMetrics de StartMap, adaptado a la pivot: el
// recorte del work se traduce a la selección de filas.
StartTable.prototype.ApplyWorkStartup = function (startup) {
	var loc = this;
	var tasks = [];

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

	loc._applyStartupRegion(startup);
	return Promise.all(tasks);
};

// Con un recorte por región (startup.Type === 'R'), ese elemento pasa a ser la
// selección de filas (con su cadena desde la raíz, desplegado). Sin recorte, las
// filas quedan en la raíz por defecto.
StartTable.prototype._applyStartupRegion = function (startup) {
	var tree = this.pivot.RowTree;
	if (startup.Type === 'R' && startup.ClippingRegionItemId != null) {
		var chain = tree.Hierarchy().ChainForCandidates([startup.ClippingRegionItemId]);
		if (chain.length) {
			tree.ReplaceSelection(chain);
		}
	}
	tree.EnsureRoot();
};
