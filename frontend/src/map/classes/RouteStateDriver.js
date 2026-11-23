import UndoClassifier from '@/map/classes/UndoClassifier';

export default RouteStateDriver;

// Orden en que se restauran los bloques: las capas primero, porque el panel de un elemento
// y el recorte dependen de ellas.
var APPLY_ORDER = [
	UndoClassifier.BLOCK_INFOS,
	UndoClassifier.BLOCK_BASEMAP,
	UndoClassifier.BLOCK_CLIPPING,
	UndoClassifier.BLOCK_FEATURE,
	UndoClassifier.BLOCK_FRAME
];

// Une UndoHistory con el visor: captura el estado a partir de los routers de SaveRoute y lo
// restaura por los mismos caminos que usa la ruta al cargarse (FromRoute de cada router).
function RouteStateDriver(segMap) {
	this.segMap = segMap;
};

RouteStateDriver.prototype.Capture = function () {
	var save = this.segMap.SaveRoute;
	var routers = save.subscribersByName;
	var clippingValues = this.routeValuesToMap(routers.clipping.ToRoute());
	return {
		route: save.calculateState(),
		frame: save.callSubscriber(routers.frame),
		basemap: save.callSubscriber(routers.basemap),
		featureInfo: save.callSubscriber(routers.featureInfo),
		clipping: {
			regions: this.valueOrEmpty(clippingValues, 'r'),
			circle: this.valueOrEmpty(clippingValues, 'c')
		},
		layers: this.captureLayers(routers.infos)
	};
};

RouteStateDriver.prototype.captureLayers = function (infosRouter) {
	var layers = [];
	var metrics = this.segMap.Metrics.metrics;
	for (var n = 0; n < metrics.length; n++) {
		var metric = metrics[n];
		var values = this.routeValuesToMap(infosRouter.SelectedInfoToRoute(metric, false));
		var prefix = 'm';
		var name = metric.properties.Name;
		if (metric.isBoundary) {
			prefix = 'b';
		} else {
			name = metric.properties.Metric.Name;
		}
		layers.push({
			key: prefix + values[''],
			name: name,
			isBoundary: !!metric.isBoundary,
			state: values
		});
	}
	return layers;
};

// Convierte la lista [clave, valor, default] de un router en un mapa clave -> texto.
// Una clave repetida (la 'a' del nivel y la 'a' de los pasos de secuencia) se numera.
RouteStateDriver.prototype.routeValuesToMap = function (list) {
	var ret = {};
	for (var n = 0; n < list.length; n++) {
		var item = list[n];
		if (item.length === 1) {
			ret[''] = String(item[0]);
		} else {
			var key = item[0];
			if (ret.hasOwnProperty(key)) {
				key = key + '2';
			}
			ret[key] = String(item[1]);
		}
	}
	return ret;
};

RouteStateDriver.prototype.valueOrEmpty = function (values, key) {
	if (values.hasOwnProperty(key)) {
		return values[key];
	}
	return '';
};

// Lo que hace falta para volver a un estado: la ruta completa (de la que se leen los bloques
// afectados) y el encuadre, que se guarda aparte porque puede venir de una nota previa.
RouteStateDriver.prototype.Pick = function (snapshot, blocks) {
	return { route: snapshot.route, frame: snapshot.frame };
};

RouteStateDriver.prototype.Apply = async function (values, blocks) {
	var segMap = this.segMap;
	var routers = segMap.SaveRoute.subscribersByName;
	segMap.Session.UI.isRegisterEnabled = false;
	try {
		for (var block of APPLY_ORDER) {
			if (blocks.indexOf(block) !== -1) {
				await this.applyBlock(block, values, routers);
			}
		}
	} finally {
		segMap.Session.UI.isRegisterEnabled = true;
	}
	segMap.SaveRoute.UpdateRoute();
};

RouteStateDriver.prototype.applyBlock = function (block, values, routers) {
	if (block === UndoClassifier.BLOCK_INFOS) {
		return this.applyInfos(values, routers.infos);
	}
	if (block === UndoClassifier.BLOCK_BASEMAP) {
		this.applyBasemap(values, routers.basemap);
	} else if (block === UndoClassifier.BLOCK_CLIPPING) {
		this.applyClipping(values, routers.clipping);
	} else if (block === UndoClassifier.BLOCK_FEATURE) {
		this.applyFeature(values, routers.featureInfo);
	} else {
		this.applyFrame(values, routers.frame);
	}
	return Promise.resolve();
};

RouteStateDriver.prototype.parse = function (values, router) {
	return this.segMap.RestoreRoute.parseRoute(values.route, router);
};

RouteStateDriver.prototype.applyInfos = function (values, router) {
	return router.FromRoute(this.parse(values, router), false);
};

// Sin bloque en la ruta el mapa base es el predeterminado.
RouteStateDriver.prototype.applyBasemap = function (values, router) {
	var args = this.parse(values, router);
	if (!args || args.length < 1) {
		args = ['r'];
	}
	router.FromRoute(args);
};

// Recorte: se usan las mismas operaciones que la interfaz, porque la ruta no sabe quitar un recorte.
RouteStateDriver.prototype.applyClipping = function (values, router) {
	var clipping = this.segMap.Clipping;
	var target = router.clippingFromRoute(this.parse(values, router));
	if (target.ClippingCircle !== null) {
		clipping.SetClippingCircle(this.circleToNumbers(target.ClippingCircle));
	} else if (target.ClippingRegionIds !== null) {
		clipping.SetClippingRegion(target.ClippingRegionIds, false, false, false);
	} else if (clipping.FrameHasClippingCircle()) {
		clipping.ResetClippingCircle();
	} else if (clipping.FrameHasClippingRegionId()) {
		clipping.ResetClippingRegion(null);
	}
};

RouteStateDriver.prototype.circleToNumbers = function (circle) {
	return {
		Center: { Lat: parseFloat(circle.Center.Lat), Lon: parseFloat(circle.Center.Lon) },
		Radius: { Lat: parseFloat(circle.Radius.Lat), Lon: parseFloat(circle.Radius.Lon) }
	};
};

// Sin bloque en la ruta no hay elemento seleccionado: se cierra su panel.
RouteStateDriver.prototype.applyFeature = function (values, router) {
	var args = this.parse(values, router);
	if (args) {
		router.FromRoute(args);
	} else {
		router.Clear();
	}
};

RouteStateDriver.prototype.applyFrame = function (values, router) {
	router.FromRoute(values.frame.split(','));
};
