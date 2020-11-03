import Svg from '@/public/js/svg';
import h from '@/public/js/helper';
import arr from '@/common/js/arr';

export default SequenceComposer;

function SequenceComposer(mapsApi, composer, activeSelectedMetric) {
	this.MapsApi = mapsApi;
	this.activeSelectedMetric = activeSelectedMetric;
	this.composer = composer;
	this.sequenceMarkersByTile = {};
	this.sequenceMarkersByLabelIdPos = {};

	if (this.activeSelectedMetric.HasSelectedVariable()) {
		this.variable = this.activeSelectedMetric.SelectedVariable();
	} else {
		this.variable = null;
	}
};

SequenceComposer.prototype.registerSequenceItem = function (tileKey, feature) {
	var key = feature.LabelId + '-' + feature.Sequence;
	var item = this.sequenceMarkersByTile[key];
	if (!item) {
		item = {
			LabelId: feature.LabelId,
			Feature: feature,
			MarkersByTile: {},
			NextLinesByZ: {},
			PrevLinesByZ: {},
		};
		this.sequenceMarkersByLabelIdPos[key] = item;
	}
	return item;
};

SequenceComposer.prototype.registerByTileSequenceItem = function (tileKey, item) {
	if (this.sequenceMarkersByTile.hasOwnProperty(tileKey) === false) {
		this.sequenceMarkersByTile[tileKey] = [];
	}
	this.sequenceMarkersByTile[tileKey].push(item);
};

SequenceComposer.prototype.registerSequenceMarker = function (tileKey, feature, marker, z) {
	var item = this.registerSequenceItem(tileKey, feature);
	item.MarkersByTile[tileKey] = marker;
	this.registerByTileSequenceItem(tileKey, item);

	// Ahora se fija quiénes son los nexos de ese punto
	var prevLine = item.PrevLinesByZ[z];
	var color = marker.icon.fillColor;
	if (prevLine) {
		// existía en este punto
		prevLine.NextCount++;
	} else {
		// Se fija si la puede crear
		var prev = this.findSequenceElement(feature.LabelId, feature.Sequence - 1);
		if (prev) {
			var existingPrevLine = prev.NextLinesByZ[z];
			if (existingPrevLine) {
				// existía en el otro punto
				existingPrevLine.NextCount++;
				item.PrevLinesByZ[z] = existingPrevLine;
			} else {
				// la crea
				var line = this.createLine(prev, item, z, color);
				item.PrevLinesByZ[z] = line;
				line.NextCount++;
			}
		}
	}

	var nextLine = item.NextLinesByZ[z];
	if (nextLine) {
		// existía en este punto
		nextLine.PrevCount++;
	} else {
		// Se fija si la puede crear
		var next = this.findSequenceElement(feature.LabelId, feature.Sequence + 1);
		if (next) {
		var existingNextLine = next.PrevLinesByZ[z];
			if (existingNextLine) {
				// existía en el otro punto
				existingNextLine.PrevCount++;
				item.NextLinesByZ[z] = existingNextLine;
			} else {
				// la crea
				var line = this.createLine(item, next, z, color);
				item.NextLinesByZ[z] = line;
				line.PrevCount++;
			}
		}
	}
};

SequenceComposer.prototype.findSequenceElement = function (labelId, itemPos) {
	var key = labelId + '-' + itemPos;
	if (this.sequenceMarkersByLabelIdPos.hasOwnProperty(key)) {
		return this.sequenceMarkersByLabelIdPos[key];
	} else {
		return null;
	}
};

SequenceComposer.prototype.GetZoomFromTileKey = function (tileKey) {
	var parts = tileKey.split('&');
	var subparts = parts[2].split('=');
	var z = parseInt(subparts[1]);
	return z;
};

SequenceComposer.prototype.removeTileSequenceMarker = function (tileKey) {
	var elements = this.sequenceMarkersByTile[tileKey];
	if (!elements) {
		return;
	}
	var z = this.GetZoomFromTileKey(tileKey);
	for (var n = 0; n < elements.length; n++) {
		var item = elements[n];
		// quita el marker de la lista (lo mantiene para poder regenerarlo)
		this.destroySequenceMarkerItem(item, tileKey);
		// quita las líneas
		var prevLine = item.PrevLinesByZ[z];
		if (prevLine) {
			prevLine.NextCount--;
			if (prevLine.NextCount === 0) {
				// Se desvincula
				delete item.PrevLinesByZ[z];

				if (prevLine.PrevCount == 0) {
					// la borra
					this.destroyLine(prevLine);
				}
			}
		}
		var nextLine = item.NextLinesByZ[z];
		if (nextLine) {
			nextLine.PrevCount--;
			if (nextLine.PrevCount === 0) {
				// Se desvincula
				delete item.NextLinesByZ[z];

				if (nextLine.NextCount == 0) {
					// la borra
					this.destroyLine(nextLine);
				}
			}
		}
	}
	this.sequenceMarkersByTile[tileKey] = [];
	delete this.sequenceMarkersByTile[tileKey];
};

SequenceComposer.prototype.RecreateSequenceMarker = function (labelId, itemPos) {
	var item = this.findSequenceElement(labelId, itemPos);
	if (item === null) {
		return;
	}
	var newMarkersByTile = {};
	var markerSettings = this.activeSelectedMetric.SelectedLevel().Dataset.Marker;
	for (var tileKey in item.MarkersByTile) {
		// Lo remueve
		this.composer.destroyMarker(tileKey, item.MarkersByTile[tileKey]);
		// Lo regenera
		newMarkersByTile[tileKey] = this.composer.createMarker(item.TileKey, item.Feature, markerSettings);
	}
	item.MarkersByTile = newMarkersByTile;
};


SequenceComposer.prototype.destroySequenceMarkerItem = function (item, tileKey) {
	var existing = item.MarkersByTile[tileKey];
	if (!existing) {
		return;
	}
	// lo elimina
	delete item.MarkersByTile[tileKey];
};

SequenceComposer.prototype.createLine = function (startItem, endItem, z, color) {
	var line = {};
	var coords = [{ lat: startItem.Feature.lat, lng: startItem.Feature.lon },
									{ lat: endItem.Feature.lat, lng: endItem.Feature.lon }];
	line.Shadow = new this.MapsApi.google.maps.Polyline({
			path: coords,
			geodesic: true,
			zIndex: this.composer.zIndex,
			strokeColor: 'white',
			strokeOpacity: 1.0,
			strokeWeight: (z / 5 - 1) * 1.5 + 2
		});
	line.Shadow.setMap(this.MapsApi.gMap);
	line.Polygon = new this.MapsApi.google.maps.Polyline({
			path: coords,
			geodesic: true,
			zIndex: this.composer.zIndex + 1,
			strokeColor: color,
			strokeOpacity: 1.0,
			strokeWeight: (z / 5 - 1) * 1.5
	});
	line.Polygon.setMap(this.MapsApi.gMap);
	line.PrevCount = 0;
	line.NextCount = 0;
	return line;
};

SequenceComposer.prototype.destroyLine = function (line) {
	line.Polygon.setMap(null);
	line.Shadow.setMap(null);
};
