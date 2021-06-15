import h from '@/public/js/helper';

export default AbstractTextComposer;

function AbstractTextComposer() {}


AbstractTextComposer.prototype.AbstractConstructor = function (value, total, description) {
	this.textStyle = '';
	this.textInTile = [];
	this.tileDataCache = [];
	this.usePreview = true;
	this.layerId = AbstractTextComposer.layerId++;
};

AbstractTextComposer.layerId = 1;

AbstractTextComposer.prototype.ResolveValueLabel = function (variable, effectiveId, dataElement, location, tileKey, backColor, markerSettings, zoom) {
	var number = null;
	if (variable.ShowValues == 1 && !variable.IsSimpleCount) {
		number = this.FormatValue(variable, dataElement);
	}
	var description = null;
	if (dataElement.Description !== null && dataElement.Description !== undefined &&
		(variable.ShowDescriptions || (markerSettings && markerSettings.ShowText))) {
		description = dataElement.Description;
	}
	var textElement = {
		type: 'F', FIDs: ['' + dataElement['FID']],
		caption: description,
		tooltip: description,
		clickId: effectiveId
	};
	this.SetTextOverlay(textElement, '' + tileKey,
		location, number, backColor, zoom);
};

AbstractTextComposer.prototype.SaveTileData = function (svg, tileData, x, y, z) {
	var localTileKey = this.GetTileCacheKey(x, y, z);
	if (localTileKey) {
		this.tileDataCache[localTileKey] = { Svg: svg, TileData: tileData };
	}
};

AbstractTextComposer.prototype.SetTextOverlay = function (textElement, tileKey, location,
	number, backColor, zoom) {

	var canvas = this.GetOrCreate(textElement.type, textElement.FIDs, tileKey, location, textElement.hidden, zoom);
	var v = null;
	if (textElement.caption !== null || textElement.symbol) {
		canvas.SetText(textElement.caption, textElement.tooltip, textElement.symbol, textElement.clickId);
	}
	if (textElement.clickId) {
		canvas.clickId = textElement.clickId;
	}
	if (number !== null) {
		var zIndex = 100000 - this.index;
		var sourceKey = this.layerId;
		v = canvas.CreateValue(number, zIndex, backColor, zoom, sourceKey);
	}
	this.textInTile[tileKey].push({ c: canvas, v: v });
	return canvas;
};

AbstractTextComposer.prototype.SetBackgroundText = function (div, tileBounds, textElement, tileKey, location,
	number, backColor, zoom) {

	var canvas = this.GetOrCreate(textElement.type, textElement.FIDs, tileKey, location, textElement.hidden, zoom);
	var v = null;
	if (textElement.caption !== null || textElement.symbol) {
		canvas.SetText(textElement.caption, textElement.tooltip, textElement.symbol, textElement.clickId);
	}
	if (number !== null) {
		var zIndex = 100000 - this.index;
		var sourceKey = this.layerId;
		v = canvas.CreateValue(number, zIndex, backColor, zoom, sourceKey);
	}
	var p = window.SegMap.MapsApi.gMap.getProjection();
	var min = p.fromLatLngToPoint(new window.SegMap.MapsApi.google.maps.LatLng(tileBounds.Min.Lat, tileBounds.Min.Lon));
	var position2 = p.fromLatLngToPoint(location);
	canvas.pixelLocation = { x: position2.x - min.x, y: position2.y - min.y };
	canvas.tileDiv = div;
};

AbstractTextComposer.prototype.FormatValue = function (variable, dataElement) {
	var ret = h.renderMetricValue(dataElement.Value, dataElement.Total,
		variable.HasTotals, variable.NormalizationScale, variable.Decimals) + ' ' + h.ResolveNormalizationCaption(variable);
	return ret.trimRight();
};


AbstractTextComposer.prototype.GetOrCreate = function(type, ids, tileKey, location, hidden, zoom) {
	var canvas = this.GetFeatureTextCanva(ids, hidden, zoom);
	if (canvas === null) {
		canvas = this.CreateFeatureTextCanva(type, ids, tileKey, location, hidden, zoom);
	} else {
		if (type !== null) {
			canvas.type = type;
		}
		if (ids !== null && (canvas.FIDs === null || ids.length > canvas.FIDs.length)) {
			canvas.SetFeatureIds(ids);
		}
		if (hidden === true) {
			canvas.RebuildHtml();
		}
	}
	return canvas;
};

AbstractTextComposer.prototype.inTile = function (bounds, latlng) {
	var latRange = latlng.lat() >= Math.min(bounds.Min.Lat, bounds.Max.Lat) && latlng.lat() < Math.max(bounds.Min.Lat, bounds.Max.Lat);
	var lngRange = latlng.lng() >= Math.min(bounds.Min.Lon, bounds.Max.Lon) && latlng.lng() < Math.max(bounds.Min.Lon, bounds.Max.Lon);
	return (latRange && lngRange);
};

AbstractTextComposer.prototype.UpdateTextStyle = function (z) {
	if (z >= 16) {
		this.textStyle = 'mapLabelsLarger mapLabels';
	} else {
		this.textStyle = 'mapLabels';
	}
};

AbstractTextComposer.prototype.clearTileText = function (tileKey) {
	// texts
	var items = this.textInTile[tileKey];
	if (items) {
		for (var i = 0; i < items.length; i++) {
			var txtOverlay = items[i].c;
			txtOverlay.Release(items[i].v);
		}
	}
	this.textInTile[tileKey] = [];
	delete this.textInTile[tileKey];
};


AbstractTextComposer.prototype.clearText = function () {
	for (var k in this.textInTile) {
		if (this.textInTile.hasOwnProperty(k)) {
			this.clearTileText(k);
		}
	}
};

AbstractTextComposer.prototype.CreateFeatureTextCanva = function(type, ids, tileKey, location, hidden, zoom) {
	var zIndex = 100000 - this.index;
	// lo resuelven los hijos
	var canvas = this.MapsApi.Write('', location, zIndex, this.textStyle, null, null, type, hidden);
	canvas.zoom = zoom;
	if (ids) {
		canvas.SetFeatureIds(ids);
	}
	return canvas;
};

AbstractTextComposer.prototype.GetFeatureTextCanva = function(ids, hidden, zoom) {
	if (ids === null) {
		return null;
	}
	for (var i = 0; i < ids.length; i++) {
		var ret = window.SegMap.textCanvas[ids[i]];
		if (ret !== undefined && ret.zoom === zoom) {
			ret.RefCount++;
			ret.UpdateHiddenAttribute(hidden);
			ret.UpdateTextStyle(this.textStyle);
			return ret;
		}
	}
	return null;
};
