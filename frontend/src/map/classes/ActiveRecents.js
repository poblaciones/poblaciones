export default ActiveRecents;

var STORAGE_KEY = 'poblaciones.map.recents';
var MAX_ITEMS = 100;
var ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Tipos válidos de reciente. Coinciden con los cuatro orígenes que puede
// tener un resultado de búsqueda (Search.js): un indicador agregado al
// mapa, una delimitación agregada como capa, una región de recorte, o un
// feature puntual (p. ej. una escuela).
ActiveRecents.Types = {
	Metric: 'metric',
	Boundary: 'boundary',
	ClippingRegion: 'clippingRegion',
	Location: 'location',
};

// Lista de navegación reciente del visor, al estilo del "Visto
// recientemente" de Google Maps. Se persiste en localStorage: la
// instancia sólo mantiene en memoria una copia de lo ya guardado. No
// notifica cambios por su cuenta: es una clase "clásica" sin reactividad de
// Vue, así que quien la consulta (searchPanel.vue) vuelve a pedir los datos
// explícitamente (GetRecents/GetGroupedRecents) en el momento que le sirve
// (p. ej. al abrir el panel), en vez de mantener una copia cacheada.
function ActiveRecents() {
	this.items = this.loadFromStorage();
};

ActiveRecents.prototype.RegisterMetric = function (metricId, caption) {
	this.register({
		Type: ActiveRecents.Types.Metric,
		DedupeKey: 'metric:' + metricId,
		Caption: caption,
		Subtitle: 'Indicadores',
		Lat: null,
		Lon: null,
		Payload: { MetricId: metricId },
	});
};

ActiveRecents.prototype.RegisterBoundary = function (boundaryId, caption) {
	this.register({
		Type: ActiveRecents.Types.Boundary,
		DedupeKey: 'boundary:' + boundaryId,
		Caption: caption,
		Subtitle: 'Delimitaciones',
		Lat: null,
		Lon: null,
		Payload: { BoundaryId: boundaryId },
	});
};

// regionIds: un id de región o un array (recorte por selección múltiple).
// subtitle: el/los TypeName de la región (p. ej. "Localidad", "Comuna"), que
// distingue en la lista dos regiones de mismo nombre y distinto tipo
// (Clipping.GetClippingTypeName).
ActiveRecents.prototype.RegisterClippingRegion = function (regionIds, caption, subtitle) {
	var idsArray;
	if (Array.isArray(regionIds)) {
		idsArray = regionIds;
	} else {
		idsArray = [regionIds];
	}
	this.register({
		Type: ActiveRecents.Types.ClippingRegion,
		DedupeKey: 'clippingRegion:' + idsArray.join(','),
		Caption: caption,
		Subtitle: (subtitle === undefined ? null : subtitle),
		Lat: null,
		Lon: null,
		Payload: { RegionIds: idsArray },
	});
};

// key: el mismo objeto que usa InfoWindow para pedir la info de un feature
// (MetricId, VariableId, LevelId, Sequence, Id -el fid-). lat/lon: el
// centroide del feature, para poder mostrarlo y centrar el mapa ahí al
// reabrirlo desde la lista de recientes.
ActiveRecents.prototype.RegisterLocation = function (key, caption, lat, lon) {
	this.register({
		Type: ActiveRecents.Types.Location,
		DedupeKey: this.resolveLocationDedupeKey(key, lat, lon),
		Caption: caption,
		Subtitle: null,
		Lat: lat,
		Lon: lon,
		Payload: {
			MetricId: resolveOrNull(key, 'MetricId'),
			VariableId: resolveOrNull(key, 'VariableId'),
			LevelId: resolveOrNull(key, 'LevelId'),
			Sequence: resolveOrNull(key, 'Sequence'),
			Id: resolveOrNull(key, 'Id'),
		},
	});
};

// Un feature con id estable (fid) identifica siempre el mismo lugar; sin
// fid (una coordenada suelta) se redondea a 4 decimales (~11 metros) para
// no duplicar un mismo punto por pequeñas diferencias de precisión.
ActiveRecents.prototype.resolveLocationDedupeKey = function (key, lat, lon) {
	var fid = resolveOrNull(key, 'Id');
	if (fid !== null) {
		return 'location:feature:' + resolveOrNull(key, 'MetricId') + ':' + resolveOrNull(key, 'VariableId') + ':' + fid;
	} else {
		return 'location:coord:' + lat.toFixed(4) + ',' + lon.toFixed(4);
	}
};

// Da de alta una entrada, o la mueve a la posición más reciente si ya
// estaba. Dos filtros evitan que la lista termine con ítems inútiles:
// - Sin Caption (p. ej. un polígono sin descripción) no se guarda: no hay
//   forma de reconocerlo después en la lista.
// - Por DedupeKey no queda más de una copia de un mismo elemento, pero
//   además se descarta cualquier otra entrada del mismo Type que se vea
//   igual (mismo Caption y mismo Subtitle, incluyendo cuando ambos son
//   nulos), aunque su DedupeKey sea distinto: dos regiones de recorte
//   llamadas "San Fabián" son elementos distintos, pero si no hay forma de
//   distinguirlas en la lista (mismo nombre, mismo o ningún subtítulo) no
//   tiene sentido ofrecer las dos.
ActiveRecents.prototype.register = function (entry) {
	var caption = normalizeText(entry.Caption);
	if (caption === '') {
		return;
	}
	entry.Caption = caption;
	var subtitle = normalizeText(entry.Subtitle);
	this.items = this.items.filter(function (existing) {
		if (existing.DedupeKey === entry.DedupeKey) {
			return false;
		}
		if (existing.Type === entry.Type && normalizeText(existing.Caption) === caption && normalizeText(existing.Subtitle) === subtitle) {
			return false;
		}
		return true;
	});
	entry.When = Date.now();
	this.items.unshift(entry);
	if (this.items.length > MAX_ITEMS) {
		this.items.length = MAX_ITEMS;
	}
	this.saveToStorage();
};

ActiveRecents.prototype.Remove = function (dedupeKey) {
	this.items = this.items.filter(function (existing) {
		return existing.DedupeKey !== dedupeKey;
	});
	this.saveToStorage();
};

ActiveRecents.prototype.GetRecents = function (limit) {
	if (limit === null || limit === undefined) {
		return this.items.slice();
	} else {
		return this.items.slice(0, limit);
	}
};

// Agrupa los recientes en cortes temporales relativos al momento de la
// consulta (se arman al vuelo, no se guardan agrupados): Hoy, Última
// semana (los 7 días previos, sin contar hoy) y Último mes (los 23 días
// previos a esa semana, completando una ventana de 30 días desde hoy). Un
// grupo sin elementos no aparece en el resultado. Lo anterior al último
// mes se agrupa igual, con Label null, para que la lista lo muestre sin
// encabezado de grupo en vez de perderlo.
ActiveRecents.prototype.GetGroupedRecents = function () {
	var startOfToday = this.resolveStartOfDay(Date.now());
	var startOfLastWeek = startOfToday - 7 * ONE_DAY_MS;
	var startOfLastMonth = startOfToday - 30 * ONE_DAY_MS;

	var today = [];
	var lastWeek = [];
	var lastMonth = [];
	var older = [];
	for (var item of this.items) {
		if (item.When >= startOfToday) {
			today.push(item);
		} else if (item.When >= startOfLastWeek) {
			lastWeek.push(item);
		} else if (item.When >= startOfLastMonth) {
			lastMonth.push(item);
		} else {
			older.push(item);
		}
	}

	var groups = [];
	if (today.length > 0) {
		groups.push({ Label: 'Hoy', Items: today });
	}
	if (lastWeek.length > 0) {
		groups.push({ Label: 'Última semana', Items: lastWeek });
	}
	if (lastMonth.length > 0) {
		groups.push({ Label: 'Último mes', Items: lastMonth });
	}
	if (older.length > 0) {
		groups.push({ Label: null, Items: older });
	}
	return groups;
};

ActiveRecents.prototype.resolveStartOfDay = function (timestamp) {
	var date = new Date(timestamp);
	date.setHours(0, 0, 0, 0);
	return date.getTime();
};

// localStorage es una fuente externa, no un componente de este código: en
// modo privado del navegador puede no estar disponible, la cuota puede
// estar agotada, o puede contener un valor corrupto de una versión
// anterior de este mismo formato. Nada de eso es un error de lógica de
// esta clase, y no debe impedir que el resto del visor funcione: por eso,
// a diferencia del resto del código del módulo, acá sí se lo trata como
// una falla esperable de un recurso externo.
ActiveRecents.prototype.loadFromStorage = function () {
	if (typeof window === 'undefined' || !window.localStorage) {
		return [];
	}
	try {
		var raw = window.localStorage.getItem(STORAGE_KEY);
		var parsed = (raw ? JSON.parse(raw) : []);
		if (Array.isArray(parsed)) {
			return parsed;
		} else {
			return [];
		}
	} catch (e) {
		return [];
	}
};

ActiveRecents.prototype.saveToStorage = function () {
	if (typeof window === 'undefined' || !window.localStorage) {
		return;
	}
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
	} catch (e) {
		// Ver comentario de loadFromStorage.
	}
};

function resolveOrNull(obj, key) {
	if (obj && obj[key] !== undefined && obj[key] !== null) {
		return obj[key];
	} else {
		return null;
	}
}

// null/undefined y '' se tratan como "sin texto" por igual, tanto para
// rechazar un Caption vacío como para comparar Subtitle entre ítems.
function normalizeText(text) {
	if (text === null || text === undefined) {
		return '';
	} else {
		return String(text).trim();
	}
}
