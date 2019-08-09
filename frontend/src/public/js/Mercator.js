
export default Mercator;

function Mercator() {
};


Mercator.prototype.fromLatLngToPoint = function (latLng) {
	var siny = Math.min(Math.max(Math.sin(latLng.lat * (Math.PI / 180)),
		-0.9999),
		0.9999);
	return {
		x: 128 + latLng.lng * (256 / 360),
		y: 128 + 0.5 * Math.log((1 + siny) / (1 - siny)) * -(256 / (2 * Math.PI))
	};
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
		if (feature.geometry.type === 'Polygon') {
			coords = this.ProjectCoords(polygons);
		} else {
			if (feature.geometry.type === 'MultiPolygon') {
				coords = [];
				for (var p = 0; p < polygons.length; p++) {
					coords.push(this.ProjectCoords(polygons[p]));
				}
			} else {
				coords = [];
			}
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

Mercator.prototype.ProjectCoords = function (coords) {
	var coordsGroup = [];
	for (var r = 0; r < coords.length; r++) {
		var retcoords = [];
		for (var i = 0; i < coords[r].length; i++) {
			var p = this.fromLatLngToPoint({ lat: coords[r][i][1], lng: coords[r][i][0] });
			retcoords.push([p.x, -p.y]);
		}
		coordsGroup.push(retcoords);
	}
	return coordsGroup;
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
