import SelectedInfoRouter from '@/map/router/SelectedInfoRouter';
import RestoreRoute from '@/map/classes/RestoreRoute';
import axios from 'axios';
import str from '@/common/framework/str';
import err from '@/common/framework/err';
import Tutorial from './Tutorial';
import session from '@/common/framework/session';
import ActiveAnnotations from '@/map/classes/ActiveAnnotations';

export default StartMap;

function StartMap(workReference, boundaryReference, frameReference, setupMap) {
	this.hash = '';
	this.SetupMap = setupMap;
	this.frameReference = frameReference;
	this.workReference = workReference;
	this.boundaryReference = boundaryReference;
};
StartMap.prototype.Start = function () {
	this.hash = window.location.hash;
	window.accessLink = null;
	window.accessWorkId = null;

	var args = StartMap.ResolveWorkIdFromUrl();

	// Solo limpiar workReference.Current / boundaryReference.Current si la
	// URL apunta a un id distinto del actualmente cargado (o a ninguno).
	// Limpiarlos incondicionalmente —como hacía el código original— dispara
	// watchers que llaman a SaveRoute.RemoveWork / RemoveBoundary cuando
	// work/boundary se vacían, perdiendo el segmento /map/<id>/ de la ruta
	// aun cuando la URL sigue apuntando al mismo work/boundary (caso típico:
	// cerrar un popup, donde EscapeCloseHandler.Close() llama a back() y
	// aterriza en una entrada con state={route:...} que dispara Start()).
	var currentWorkId = (this.workReference.Current && this.workReference.Current.Id !== undefined)
		? this.workReference.Current.Id : null;
	var currentBoundaryId = (this.boundaryReference.Current && this.boundaryReference.Current.Id !== undefined)
		? this.boundaryReference.Current.Id : null;

	if (args.workId !== currentWorkId) {
		this.workReference.Current = null;
	}
	if (args.boundaryId !== currentBoundaryId) {
		this.boundaryReference.Current = null;
	}

	if (args.workId) {
		this.RestoreWork(args.workId, args.link);
	} else if (args.boundaryId) {
		this.RestoreBoundary(args.boundaryId);
	} else {
		if (new RestoreRoute(null).RouteHasLocation(this.hash)) {
			this.StartByUrl();
		} else {
			this.GetAndStartByDefaultFrame();
		}
	}
};

// Un segmento de ruta identifica una delimitación cuando es 'b' seguido de
// solo dígitos (p. ej. 'b45'); en cualquier otro caso no es una delimitación.
StartMap.ParseBoundarySegment = function (segment) {
	if (!segment || segment.length < 2 || segment[0] !== 'b' || !str.isNumeric(segment.substr(1))) {
		return null;
	}
	return parseInt(segment.substr(1));
};

StartMap.ResolveWorkIdFromUrl = function () {
	var pathArray = window.location.pathname.split('/');
	if (pathArray.length > 0 && pathArray[pathArray.length - 1] === '') {
		pathArray.pop();
	}
	if (pathArray.length > 0 && pathArray[pathArray.length - 1] === 'map') {
		pathArray.pop();
	}
	var link = null;
	if (pathArray.length > 0 && pathArray[pathArray.length - 1].length === 18) {
		link = pathArray.pop();
	}
	if (pathArray.length === 0) {
		return { workId: null, boundaryId: null, link: null };
	}
	var lastSegment = pathArray[pathArray.length - 1];
	var boundaryId = StartMap.ParseBoundarySegment(lastSegment);
	if (boundaryId !== null) {
		return { workId: null, boundaryId: boundaryId, link: link };
	}
	if (!str.isNumeric(lastSegment)) {
		return { workId: null, boundaryId: null, link: null };
	} else {
		return { workId: parseInt(lastSegment), boundaryId: null, link: link };
	}
};

StartMap.prototype.RestoreWork = function (workId, link) {
	var loc = this;
	window.accessWorkId = workId;
	window.accessLink = link;
	axios.get(window.host + '/services/works/GetWorkAndDefaultFrame', session.AddSession(window.host, {
		params: { w: workId },
		headers: (window.accessLink ? { 'Access-Link': window.accessLink } : {})
	})).then(function (res) {
		session.ReceiveSession(window.host, res);
		loc.workReference.Current = res.data.work;
		loc.workReference.Current.tutorialOpened = false;
		loc.workReference.Current.Tutorial = new Tutorial(loc.workReference.Current, res.data.work.Id);
		loc.ReceiveWorkStartup(loc.workReference.Current.Startup, res.data.frame);
	}).catch(function (error) {
		err.errDialog('GetWork', 'obtener la información del servidor', error);
	});
	return true;
};

// Análogo a RestoreWork, pero para una delimitación (ruta /map/b<id>): no
// hay startup propio de la delimitación, así que arranca por el frame
// default del servidor y, una vez montado el mapa, agrega la delimitación.
// Igual que en ReceiveWorkStartup, si la ruta ya trae sus propios parámetros
// (zoom y centro, una región de clipping, o la lista de capas activas vía
// l=...), esos parámetros mandan: no se encuadra en los Extents de la
// delimitación, y tampoco se la agrega como capa (StartByDefaultFrame ya
// restaura las capas declaradas en la ruta a través de LoadRoute, y si la
// delimitación estaba entre ellas, agregarla de nuevo acá la duplicaría).
// Con ruta, solo se piden sus datos para poblar el zócalo (boundary activo).
StartMap.prototype.RestoreBoundary = function (boundaryId) {
	var loc = this;
	var hasRoute = new RestoreRoute(null).RouteHasLocation(this.hash);
	this.GetAndStartByDefaultFrame(function () {
		if (hasRoute) {
			window.SegMap.GetBoundaryInfo(boundaryId).then(function (res) {
				if (res) {
					loc.boundaryReference.Current = res.data;
				}
			});
			return;
		}
		window.SegMap.AddBoundaryById(boundaryId).then(function (activeBoundary) {
			if (!activeBoundary) {
				return;
			}
			loc.boundaryReference.Current = activeBoundary.properties;
			var extents = activeBoundary.SelectedVersion().Extents;
			if (extents) {
				loc.frameReference.frame.Envelope = extents;
				window.SegMap.FitCurrentEnvelope();
			}
		});
	});
};

StartMap.prototype.ReceiveWorkStartup = function (startup, frame) {
	var hasRoute = new RestoreRoute(null).RouteHasLocation(this.hash);
	if (hasRoute) {
		this.StartByUrl();
		return;
	}
	var setMapPosition;
	if (startup.Type === 'R' && startup.ClippingRegionItemId !== null) {
		setMapPosition = function () {
			window.SegMap.Clipping.SetClippingRegion(startup.ClippingRegionItemId, true, !startup.Selected);
		};
	}
	else if (startup.Type === 'E' && this.workReference.Current.Extents) {
		var loc = this;
		setMapPosition = function () {
			loc.frameReference.frame.Envelope = loc.workReference.Current.Extents;
			window.SegMap.FitCurrentEnvelope();
		};
	}
	else if (startup.Type === 'L') {
		this.frameReference.frame.Envelope.Min = startup.Center;
		this.frameReference.frame.Envelope.Max = startup.Center;
		this.frameReference.frame.Zoom = startup.Zoom;

		setMapPosition = function () {
			window.SegMap.SetCenter(startup.Center);
			window.SegMap.SetZoom(startup.Zoom);
		};
	} else {
		// Type === 'D' || 'R' sin región
		var loc = this;
		this.StartByDefaultFrame(frame, function () {
			loc.LoadAnnotations();
			loc.LoadStartMetrics(startup);
		});
		return;
	}
	this.SetupMap(setMapPosition);
	this.Finish();
	this.LoadAnnotations();
	this.LoadStartMetrics(startup);
};

StartMap.prototype.LoadAnnotations = function () {
	if (this.workReference.Current) {
		for (var annotation of this.workReference.Current.Annotations) {
			window.SegMap.CreateActiveAnnotation(annotation);
		}
	}
};

StartMap.prototype.LoadStartMetrics = function (startup) {
	// Carga la lista de indicadores
	var list = [];

	var selectedMetricsRouter = new SelectedInfoRouter();
	var metricsFromRoute = new RestoreRoute().parseRoute(this.hash, selectedMetricsRouter);
	if (metricsFromRoute) {
		list = selectedMetricsRouter.parseInfos(metricsFromRoute);
	}
	if (list.length === 0) {
		if (startup.ActiveMetrics) {
			var metrics = startup.ActiveMetrics.split(',');
			for (var n = 0; n < metrics.length; n++) {
				list.push({ Id: metrics[n] });
			}
		} else {
			// no tiene por default y no hay en la ruta
			var current = this.workReference.Current;
			if (current.Metrics.length > 1) {
				if (!window.Embedded.Active || !window.Embedded.Compact) {
					window.Popups.AddMetric.show(current.Metrics, current.Id);
				}
			} else if (current.Metrics.length === 1) {
				list.push({ Id: current.Metrics[0].Id });
			}
		}
	}
	var router = new SelectedInfoRouter();
	router.LoadInfos(list, true, true);
};

StartMap.prototype.StartByUrl = function () {
	var route = this.hash;
	var loc = this;
	var afterLoaded = function () {
		loc.LoadAnnotations();
		window.SegMap.RestoreRoute.LoadRoute(route, true);
		loc.Finish();
	};
	this.SetupMap(afterLoaded);
};

StartMap.prototype.GetAndStartByDefaultFrame = function (extrafunc) {
	const loc = this;
	axios.get(window.host + '/services/clipping/GetDefaultFrame', session.AddSession(window.host, {
		params: {}
	})).then(function (res) {
		session.ReceiveSession(window.host, res);
		loc.StartByDefaultFrame(res.data, extrafunc);
	}).catch(function(error) {
		err.errDialog('GetDefaultFrame', 'conectarse con el servidor', error);
	});
};

StartMap.prototype.StartByDefaultFrame = function (frame, extrafunc) {
	var loc = this;
	var route = null;
	if (this.hash.length > 2 && this.hash.substr(0, 2) === '#/') {
		route = this.hash;
	}
	this.frameReference.frame = frame;
	var afterLoaded = function() {
		if (route) {
			window.SegMap.RestoreRoute.LoadRoute(route, true);
		}
		window.SegMap.SaveRoute.UpdateRoute();

		if (window.accessWorkId === null) {
			window.SegMap.Tutorial.CheckOpenTutorial();
		}
		if (extrafunc) {
			extrafunc();
		}
	};
	loc.SetupMap(afterLoaded);

	if (this.frameReference.frame && this.frameReference.frame.Center.Lat && this.frameReference.frame.Center.Lon) {
		window.SegMap.SetCenter(this.frameReference.frame.Center);
		setTimeout(() => {
			window.SegMap.SetCenter(this.frameReference.frame.Center);
		}, 50);
	}
	if (this.frameReference.frame && (this.frameReference.frame.Zoom || this.frameReference.frame.Zoom === 0)) {
		window.SegMap.SetZoom(this.frameReference.frame.Zoom);
	}
	this.Finish();
};
StartMap.prototype.Finish = function () {
	window.SegMap.MapsApi.BindEvents();
};

StartMap.prototype.StartByDefaultFrameAndClipping = function (route) {
	const loc = this;
	axios.get(window.host + '/services/clipping/GetDefaultFrameAndClipping', session.AddSession(window.host, {
		params: {}
	})).then(function (res) {
		session.ReceiveSession(window.host, res);
		var canvas = res.data.clipping.Canvas;
		res.data.clipping.Canvas = null;

		loc.clipping.Region = res.data.clipping;
		this.frameReference.frame = res.data.frame;
		if (!window.SegMap) {
			var afterLoaded = function() {
				window.SegMap.SaveRoute.UpdateRoute();
				if (route) {
					window.SegMap.RestoreRoute.LoadRoute(route, true);
				}
			};
			loc.SetupMap(afterLoaded);
		}
		if (loc.workToLoad === false) {
			window.SegMap.Tutorial.CheckOpenTutorial();
		}
		if (canvas) {
			window.SegMap.Clipping.FitCurrentRegion();
			window.SegMap.Clipping.SetClippingCanvas(canvas);
		} else {
			if (this.frameReference.frame.Center.Lat && this.frameReference.frame.Center.Lon) {
				window.SegMap.SetCenter(this.frameReference.frame.Center);
			}
			if (this.frameReference.frame.Zoom || this.frameReference.frame.Zoom === 0) {
				window.SegMap.SetZoom(this.frameReference.frame.Zoom);
			}
		}
		loc.Finish();
	}).catch(function(error) {
		err.errDialog('GetDefaultFrameAndClipping', 'conectarse con el servidor', error);
	});
};
