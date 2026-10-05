export default WorkSearch;

const PUBLIC_TYPE = 'P';
const PUBLIC_TAG = 'Datos públicos';

/*
 * Búsqueda de cartografías, datasets e indicadores (series) del usuario, con el destino de cada resultado.
 * Solo atiende la consulta más reciente: Search resuelve null para una consulta que fue superada por otra.
 * Si el servidor no responde, resuelve con failed en true; una respuesta que no cumple el contrato falla con su error.
 */
function WorkSearch(limitPerGroup) {
	this.limitPerGroup = limitPerGroup;
	this.lastRequest = 0;
}

WorkSearch.prototype.Search = function (text) {
	var loc = this;
	this.lastRequest++;
	var request = this.lastRequest;
	return window.Db.SearchUserWorks(text, this.limitPerGroup).then(function (response) {
		if (request !== loc.lastRequest) {
			return null;
		}
		return loc.ReadResponse(response);
	}, function () {
		if (request !== loc.lastRequest) {
			return null;
		}
		return { results: null, truncatedKinds: [], failed: true };
	});
};

WorkSearch.prototype.Cancel = function () {
	this.lastRequest++;
};

WorkSearch.prototype.ReadResponse = function (response) {
	var results = [];
	var truncatedKinds = [];
	this.AddGroup(results, truncatedKinds, response.Works, 'cartography', this.ReadWork);
	this.AddGroup(results, truncatedKinds, response.Datasets, 'dataset', this.ReadDataset);
	this.AddGroup(results, truncatedKinds, response.Metrics, 'metric', this.ReadMetric);
	return { results: results, truncatedKinds: truncatedKinds, failed: false };
};

WorkSearch.prototype.AddGroup = function (results, truncatedKinds, group, kind, readItem) {
	for (var item of group.Items) {
		results.push(readItem(item));
	}
	if (group.HasMore) {
		truncatedKinds.push(kind);
	}
};

WorkSearch.prototype.ReadWork = function (item) {
	return {
		id: item.Id,
		kind: 'cartography',
		caption: item.Caption,
		context: '',
		tag: publicTag(item.Type),
		route: { path: '/cartographies/' + item.Id }
	};
};

WorkSearch.prototype.ReadDataset = function (item) {
	return {
		id: item.Id,
		kind: 'dataset',
		caption: item.Caption,
		context: 'Cartografía: ' + item.WorkCaption,
		tag: publicTag(item.WorkType),
		route: { path: '/cartographies/' + item.WorkId + '/datasets/' + item.Id + '/data' }
	};
};

// Cada serie del indicador es un resultado propio: LevelId permite ubicar su fila en la solapa Indicadores.
WorkSearch.prototype.ReadMetric = function (item) {
	return {
		id: item.LevelId,
		kind: 'metric',
		caption: item.Caption + ' (' + item.VersionCaption + ')',
		context: 'Dataset: ' + item.DatasetCaption + ' · Cartografía: ' + item.WorkCaption,
		tag: publicTag(item.WorkType),
		route: {
			path: '/cartographies/' + item.WorkId + '/datasets/' + item.DatasetId + '/metrics',
			query: { level: String(item.LevelId) }
		}
	};
};

function publicTag(workType) {
	if (workType === PUBLIC_TYPE) {
		return PUBLIC_TAG;
	}
	return '';
}
