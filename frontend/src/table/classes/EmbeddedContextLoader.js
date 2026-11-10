import axios from 'axios';
import arr from '@/common/framework/arr';
import session from '@/common/framework/session';
import Context from '@/table/classes/Context';
import BoundaryHierarchy from '@/table/classes/BoundaryHierarchy.js';

export default EmbeddedContextLoader;

// EmbeddedContextLoader — prepara, dentro del visor, el contexto que la tabla
// espera (window.Context con sus stores y el catálogo de delimitaciones con su
// jerarquía). El visor no carga nada de esto al arrancar: se hace la primera vez
// que el usuario pide la tabla, y las siguientes aperturas lo reutilizan. Las
// definiciones y los datos de los indicadores los trae la propia pivot al
// restaurarse y renderizarse (MetricStore), y quedan cacheados en el contexto.
function EmbeddedContextLoader(segmentedMap) {
	this.map = segmentedMap;
}

// Carga en curso o ya resuelta, compartida entre aperturas del popup.
EmbeddedContextLoader.pending = null;

EmbeddedContextLoader.prototype.EnsureContext = function () {
	if (!EmbeddedContextLoader.pending) {
		EmbeddedContextLoader.pending = this._load();
	}
	return EmbeddedContextLoader.pending;
};

EmbeddedContextLoader.prototype._load = function () {
	if (!window.Context) {
		window.Context = new Context();
	}
	var context = window.Context;
	var config = this.map.Configuration;
	// Mismo pedido (y misma firma) que hace el visor para su catálogo: si ya lo
	// hizo, el navegador lo sirve desde su caché.
	var params = session.AddSession(window.host, {
		params: { w: this.map.Signatures.FabMetrics, h: this.map.Signatures.Suffix }
	});
	return axios.get(window.host + '/services/metrics/GetFabBoundaries', params).then(function (res) {
		session.ReceiveSession(window.host, res);
		arr.AddRange(context.Boundaries, res.data);
		context.BoundaryHierarchy = new BoundaryHierarchy(res.data, config.DefaultPivotBoundaryId);
		return context;
	}).catch(function (error) {
		// Permite reintentar en una próxima apertura; el error sigue su curso.
		EmbeddedContextLoader.pending = null;
		throw error;
	});
};
