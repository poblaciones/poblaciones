import arr from '@/common/framework/arr';
import Mercator from '@/public/js/Mercator';

export default Summary;

function Summary(session) {
	this.session = session,
	this.ZoomHistory = [];
	this.BoundsHistory = [];
	this.Data = {
		Scope: {
			Bounds: {
				Min: { Lat: null, Lon: null },
				Max: { Lat: null, Lon: null },
				DeltaKM: { NS: null, WE: null }
			},
			Bounds80: {
				Min: { Lat: null, Lon: null },
				Max: { Lat: null, Lon: null },
				DeltaKM: { NS: null, WE: null }
			},
			Zoom: { Min: null, Max: null, Delta: null },
			Zoom80: { Min: null, Max: null, Delta: null },
			Years: { Min: null, Max: null },
			ActiveDurationSecs: 0,
			DurationSecs: 0,
		},
		Content: {
				Metrics: 0,
				Downloads: 0,
				Metadata: 0,
				Boundaries: 0,
				Regions: 0,
				Circles: 0,
				Elements: 0
			},
		/*Performance: {
			+ #requests per server
			+ total memory used ?
			+ client side delays ?
			+ total network errors
			+ total javascript errors
			} */
		};
};

Summary.prototype.UpdateEllapsed = function () {
	var time = this.session.GetTimeMs();
	this.Data.Scope.DurationSecs = time / 1000;
	this.Data.Scope.ActiveDurationSecs += (this.session.INTERVAL_SECS);
};

Summary.prototype.MetricAdded = function () {
	this.Data.Content.Metrics++;
};

Summary.prototype.BoundaryAdded = function () {
	this.Data.Content.Boundaries++;
};

Summary.prototype.RegionSelected = function () {
	this.Data.Content.Regions++;
};

Summary.prototype.Download = function () {
	this.Data.Content.Downloads++;
};

Summary.prototype.Metadata = function () {
	this.Data.Content.Metadata++;
};

Summary.prototype.CircleSelected = function () {
	this.Data.Content.Circles++;
};

Summary.prototype.FeatureSelected = function () {
	this.Data.Content.Elements++;
};


Summary.prototype.SerieSelected = function (serie) {
	var year = parseInt(serie);
	if (isNaN(year) || year < 1800 || year > 2100) {
		return;
	}
	if (this.Data.Scope.Years.Min === null || this.Data.Scope.Years.Min > year) {
		this.Data.Scope.Years.Min = year;
	}
	if (this.Data.Scope.Years.Max === null || this.Data.Scope.Years.Max < year) {
		this.Data.Scope.Years.Max = year;
	}
};

Summary.prototype.ZoomChanged = function (zoomValue) {
	// registra lo recibido
	this.ZoomHistory.push({ value: zoomValue, time: this.session.GetTimeMs() });
	// los pone ordenados con los delta de tiempo
	var sortedList = this.fillTimeListSorted(this.ZoomHistory, 'value');
	// registra máximo y mínimo
	this.Data.Scope.Zoom.Min = sortedList[0].value;
	this.Data.Scope.Zoom.Max = sortedList[sortedList.length - 1].value;
	this.Data.Scope.Zoom.Delta = this.Data.Scope.Zoom.Max - this.Data.Scope.Zoom.Min;
	// calcula los valores para %
	var maxMinLimited = this.calcMaxMinLimited(sortedList, 0.2);
	this.Data.Scope.Zoom80.Min = maxMinLimited.min;
	this.Data.Scope.Zoom80.Max = maxMinLimited.max;
	this.Data.Scope.Zoom80.Delta = this.Data.Scope.Zoom80.Max - this.Data.Scope.Zoom80.Min;
};

Summary.prototype.BoundsChanged = function (bounds) {
	// registra lo recibido
	var reverseLat = true;
	if (reverseLat) {
		this.reverse(bounds);
	}
	this.BoundsHistory.push({
		minLat: bounds.Min.Lat, maxLat: bounds.Max.Lat,
		minLon: bounds.Min.Lon, maxLon: bounds.Max.Lon,
		time: this.session.GetTimeMs()
	});
	// 1. Latitud mínimo
	// los pone ordenados con los delta de tiempo
	var sortedList = this.fillTimeListSorted(this.BoundsHistory, 'minLat');
	// registra el mínimo y calcula los valores para %
	this.Data.Scope.Bounds.Min.Lat = sortedList[0].value;
	var maxMinLimited = this.calcMaxMinLimited(sortedList, 0.2);
	this.Data.Scope.Bounds80.Min.Lat = maxMinLimited.min;

	// 2. Latitud máximo
	// los pone ordenados con los delta de tiempo
	var sortedList = this.fillTimeListSorted(this.BoundsHistory, 'maxLat');
	// registra el mínimo y calcula los valores para %
	this.Data.Scope.Bounds.Max.Lat = sortedList[sortedList.length - 1].value;
	var maxMinLimited = this.calcMaxMinLimited(sortedList, 0.2);
	this.Data.Scope.Bounds80.Max.Lat = maxMinLimited.max;

	// 3. Longitud mínimo
	// los pone ordenados con los delta de tiempo
	var sortedList = this.fillTimeListSorted(this.BoundsHistory, 'minLon');
	// registra el mínimo y calcula los valores para %
	this.Data.Scope.Bounds.Min.Lon = sortedList[0].value;
	var maxMinLimited = this.calcMaxMinLimited(sortedList, 0.2);
	this.Data.Scope.Bounds80.Min.Lon = maxMinLimited.min;

	// 4. Longitud máximo
	// los pone ordenados con los delta de tiempo
	var sortedList = this.fillTimeListSorted(this.BoundsHistory, 'maxLon');
	// registra el mínimo y calcula los valores para %
	this.Data.Scope.Bounds.Max.Lon = sortedList[sortedList.length - 1].value;
	var maxMinLimited = this.calcMaxMinLimited(sortedList, 0.2);
	this.Data.Scope.Bounds80.Max.Lon = maxMinLimited.max;

	if (reverseLat) {
		this.reverse(this.Data.Scope.Bounds);
		this.reverse(this.Data.Scope.Bounds80);
	}

	this.Data.Scope.Bounds.DeltaKM = this.deltaBounds(this.Data.Scope.Bounds);
	this.Data.Scope.Bounds80.DeltaKM = this.deltaBounds(this.Data.Scope.Bounds80);
};


Summary.prototype.reverse = function (bounds) {
	var max = bounds.Max;
	bounds.Max = bounds.Min;
	bounds.Min = max;
};

Summary.prototype.deltaBounds = function (bounds) {
	var latDelta = Math.abs(bounds.Max.Lat > bounds.Min.Lat ? bounds.Max.Lat - bounds.Min.Lat : bounds.Min.Lat - bounds.Max.Lat);
	var latAverage = (bounds.Max.Lat + bounds.Min.Lat) / 2;
	var m = new Mercator();
	var dist = m.measure(latAverage, bounds.Min.Lon, latAverage, bounds.Max.Lon);
	return {
		NS: m.degreesToMetersLatitude(latDelta) / 1000,
		WE: dist / 1000
	};
};

Summary.prototype.fillTimeListSorted = function (source, attribute) {
	var list = [];
	for (var n = 0; n < source.length; n++) {
		var item = source[n];
		var nextTime = (n < source.length - 1 ? source[n + 1].time : item.time);
		list.push({ value: item[attribute], time: nextTime - item.time });
	}
	arr.SortByValue(list, 'value');
	return list;
};


Summary.prototype.calcMaxMinLimited = function (lista, share) {
	// Calcular el tiempo total transcurrido
	var tiempoTotal = lista.reduce((acumulador, elemento) => acumulador + elemento.time, 0);
	// Calcular el umbral mínimo para considerar un valor de valor
	var umbralMinimo = share * tiempoTotal;
	// Calcular el tiempo acumulado y el valor máximo de valor
	var tiempoAcumulado = 0;
	var valorMinimo = null;
	for (var i = 0; i < lista.length; i++) {
		tiempoAcumulado += lista[i].time;

		if (tiempoAcumulado >= umbralMinimo) {
			valorMinimo = lista[i].value;
			break;
		}
	}
	tiempoAcumulado = 0;
	var valorMaximo = null;
	for (var j = lista.length - 1; j >= 0; j--) {
		tiempoAcumulado += lista[j].time;

		if (tiempoAcumulado >= umbralMinimo) {
			valorMaximo = lista[j].value;
			break;
		}
	}
	return { min: valorMinimo, max: valorMaximo };
};
