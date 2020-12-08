
export default Mercator;

function Mercator() {
	this.min = null;
	this.max = null;
};

Mercator.prototype.fromLatLngToPoint = function (latLng) {
	var siny = Math.min(Math.max(Math.sin(latLng.lat * (Math.PI / 180)),
		-0.9999),
		0.9999);
	var x = 128 + latLng.lng * (256 / 360);
	var y = 128 + 0.5 * Math.log((1 + siny) / (1 - siny)) * -(256 / (2 * Math.PI));

	return { x: x,	y: y };
};

Mercator.prototype.fromPointToLatLng = function (point) {
	return {
		Lat: (2 * Math.atan(Math.exp((point.y - 128) / -(256 / (2 * Math.PI)))) -
			Math.PI / 2) / (Math.PI / 180),
		Lon: (point.x - 128) / (256 / 360)
	};
};

Mercator.prototype.fromGoogleLatLngToLatLon = function (point) {
	return { Lat: point.lat(), Lon: point.lng() };
};

Mercator.prototype.fromLatLonToGoogleLatLng = function (point) {
	return new window.SegMap.MapsApi.google.maps.LatLng(point.Lat, point.Lon);
};

Mercator.prototype.fromTextToGoogleLatLng = function (point) {
	// Reconoce el formato (-34.584605, -58.47833800000001)
	var p = point.replace(/[\(\) ]+/g, '');
	var parts = p.split(',');
	return new window.SegMap.MapsApi.google.maps.LatLng(parts[0], parts[1]);
};

Mercator.prototype.getTileAtLatLng = function (latLng, zoom) {
	var t = Math.pow(2, zoom);
	var s = 256 / t;
	var p = this.fromLatLngToPoint(latLng);
	return { x: Math.floor(p.x / s), y: Math.floor(p.y / s), z: zoom };
};

Mercator.prototype.ProjectGeoJsonFeatures = function(features) {
	var retFeatures = [];
	for (var f = 0; f < features.length; f++) {
		var feature = features[f];
		var polygons = feature.geometry.coordinates;
		var coords;
		if (feature.geometry.type === 'LineString') {
			coords = this.Project1LevelCoords(polygons);
		} else if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiLineString') {
			coords = this.Project2LevelCoords(polygons);
		} else if (feature.geometry.type === 'MultiPolygon' || feature.geometry.type === '') {
			coords = this.Project3LevelCoords(polygons);
		} else if (feature.geometry.type === 'Point') {
			coords = this.ProjectSingleCoord(polygons);
		}	else {
			throw new Error('Tipo de geomeptry no válido (' + feature.geometry.type + ').');
		}

		var geo = { type: feature.geometry.type, coordinates: coords };
		var polygon = { id: feature.id, type: feature.type, properties: feature.properties, geometry: geo };
		retFeatures.push(polygon);
	}
	return {
		type: 'FeatureCollection',
		features: retFeatures
	};
};
Mercator.prototype.ProjectCoordinate = function (coord) {
	var p = this.fromLatLngToPoint({ lat: coord.Lat, lng: coord.Lon });
	return { Lat: p.y, Lon: p.x };
};

Mercator.prototype.Project3LevelCoords = function (inCoords) {
	var outCoords = [];
	for (var p = 0; p < inCoords.length; p++) {
		outCoords.push(this.Project2LevelCoords(inCoords[p]));
	}
	return outCoords;
};

Mercator.prototype.Project2LevelCoords = function (inCoords) {
	var outCoords = [];
	for (var r = 0; r < inCoords.length; r++) {
		var retcoords = this.Project1LevelCoords(inCoords[r]);
		outCoords.push(retcoords);
	}
	return outCoords;
};

Mercator.prototype.ProjectSingleCoord = function (inCoord) {
	var p = this.fromLatLngToPoint({ lat: inCoord[1], lng: inCoord[0] });
	var r = this.scaleToBoundedPixel(p);
	return [r.x, -r.y];
};

Mercator.prototype.Project1LevelCoords = function (inCoords) {
	var outCoords = [];
	var last = {};
	for (var i = 0; i < inCoords.length; i++) {
		var p = this.fromLatLngToPoint({ lat: inCoords[i][1], lng: inCoords[i][0] });
		var r = this.scaleToBoundedPixel(p);
		if (r.x !== last.x || r.y !== last.y) {
			outCoords.push([r.x, -r.y]);
		}
		last = r;
	}
	return outCoords;
};

Mercator.prototype.scaleToBoundedPixel  = function (p) {
	if (this.min) {
		var xRange = this.max.x - this.min.x;
		var yRange = this.max.y - this.min.y;
		return { x: Math.round((p.x - this.min.x) / xRange * 256), y: Math.round((p.y - this.min.y) / yRange * 256) };
	} else {
		return p;
	}
};

Mercator.prototype.getTileBoundsLatLon = function (tile) {
	var rect = this.getTileBounds(tile);
	return {
		Min: this.fromGoogleLatLngToLatLon(rect.Min),
		Max: this.fromGoogleLatLngToLatLon(rect.Max)
	};
};

Mercator.prototype.getTileBounds = function (tile) {
	tile = this.normalizeTile(tile);
	var t = Math.pow(2, tile.z);
	var s = 256 / t;
	var sw = {
		x: tile.x * s,
		y: (tile.y * s) + s
	};
	var ne = {
		x: tile.x * s + s,
		y: (tile.y * s)
	};
	var min = new window.SegMap.MapsApi.google.maps.Point(sw.x, ne.y);
	var max = new window.SegMap.MapsApi.google.maps.Point(ne.x, sw.y);

	return {
		Min: this.fromLatLonToGoogleLatLng(this.fromPointToLatLng(min)),
		Max: this.fromLatLonToGoogleLatLng(this.fromPointToLatLng(max))
	};

	return {
		Min: window.SegMap.MapsApi.gMap.getProjection().fromPointToLatLng(min),
		Max: window.SegMap.MapsApi.gMap.getProjection().fromPointToLatLng(max)
	};
};

Mercator.prototype.normalizeTile = function (tile) {
	var t = Math.pow(2, tile.z);
	tile.x = ((tile.x % t) + t) % t;
	tile.y = ((tile.y % t) + t) % t;
	return tile;
};

Mercator.prototype.alignRectangle = function (r) {
	var min = { Lat: Math.min(r.Min.Lat, r.Max.Lat), Lon: Math.min(r.Min.Lon, r.Max.Lon) };
	var max = { Lat: Math.max(r.Min.Lat, r.Max.Lat), Lon: Math.max(r.Min.Lon, r.Max.Lon) };
	return { Min: min, Max: max };
};

Mercator.prototype.rectanglesIntersection = function (R1free, R2free) {
	var R1 = this.alignRectangle(R1free);
	var R2 = this.alignRectangle(R2free);
	if (this.rectanglesIntersect(R1, R2)) {
		return {
			Min: {
				Lat: Math.max(R1.Min.Lat, R2.Min.Lat),
				Lon: Math.max(R1.Min.Lon, R2.Min.Lon)
			},
			Max: {
				Lat: Math.min(R1.Max.Lat, R2.Max.Lat),
				Lon: Math.min(R1.Max.Lon, R2.Max.Lon)
			}
		};
	} else {
		return null;
	}
};
Mercator.prototype.rectanglePixelArea = function (r) {
	var rProjected = {
		Min: this.ProjectCoordinate(r.Min),
		Max: this.ProjectCoordinate(r.Max)
	};
	return Math.abs((rProjected.Max.Lat - rProjected.Min.Lat) * (rProjected.Max.Lon - rProjected.Min.Lon));
};

Mercator.prototype.rectanglesIntersect = function (R1free, R2free) {
	var R1 = this.alignRectangle(R1free);
	var R2 = this.alignRectangle(R2free);
	if ((R1.Min.Lon < R2.Max.Lon) && (R1.Max.Lon > R2.Min.Lon) &&
		(R1.Min.Lat < R2.Max.Lat) &&
		(R1.Max.Lat > R2.Min.Lat)) {
		return true;
	} else {
		return false;
	}
};

