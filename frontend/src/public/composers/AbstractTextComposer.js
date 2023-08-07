import h from '@/public/js/helper';

export default AbstractTextComposer;

function AbstractTextComposer() {}


AbstractTextComposer.prototype.AbstractConstructor = function (value, total, description) {
	this.textStyle = '';
	this.textInTile = [];
	this.perimetersInTile = [];
	this.tileDataCache = [];
	this.usePreview = true;
	this.layerId = AbstractTextComposer.layerId++;
};

AbstractTextComposer.layerId = 1;

AbstractTextComposer.prototype.ResolveValueLabel = function (variable, effectiveId, dataElement, location, tileKey, backColor, markerSettings, zoom, isSemaphore) {
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
		location, number, backColor, zoom, isSemaphore);
};

AbstractTextComposer.prototype.SaveTileData = function (svg, tileData, x, y, z) {
	var localTileKey = this.GetTileCacheKey(x, y, z);
	if (localTileKey) {
		this.tileDataCache[localTileKey] = { Svg: svg, TileData: tileData };
	}
};

AbstractTextComposer.prototype.SetTextOverlay = function (textElement, tileKey, location,
	number, backColor, zoom, isSemaphore) {

	var canvas = this.GetOrCreate(textElement.type, textElement.FIDs, tileKey, location, textElement.hidden, zoom);
	var v = null;
	if (textElement.caption !== null || textElement.symbol) {
		canvas.SetText(textElement.caption, textElement.tooltip, textElement.symbol, textElement.clickId);
	}
	if (textElement.clickId) {
		canvas.clickId = textElement.clickId;
	}
	if (number !== null || isSemaphore) {
		var zIndex = 100000 - this.index;
		var sourceKey = this.layerId;
		if (number === null) {
			number = '&nbsp;';
		}
		v = canvas.CreateValue(number, zIndex, backColor, zoom, sourceKey);
	}
	this.textInTile[tileKey].push({ c: canvas, v: v });
	return canvas;
};

AbstractTextComposer.prototype.AddPerimeter = function(variable, val, dataElement, tileKey, tileBounds, colorMap) {
	var usePerimeter = window.SegMap.Configuration.UsePerimeter;
	if (parseInt(variable.ShowPerimeter) == 0 || !usePerimeter) {
		return;
	}
	var location = { Lat: parseFloat(dataElement['Lat']), Lon: parseFloat(dataElement['Lon']) };
	if (this.inTile(tileBounds, location)) {
		var color = colorMap[val];
		var polygon = window.SegMap.MapsApi.DrawPerimeter(location, variable.Perimeter, color);
		this.perimetersInTile[tileKey].push(polygon);
	}
};

AbstractTextComposer.prototype.FormatValue = function (variable, dataElement) {
	if (dataElement.DeltaValue) {
		var number = h.getValueFormatted(dataElement.DeltaValue, false, 1);
		var ret = (dataElement.DeltaValue >= 0 ? '+' : '') + number;
		if (number !== '-' && number !== 'n/d') {
			ret += variable.ComparableUnit;
		}
		return ret;
	} else {
		var ret = h.renderMetricValue(dataElement.Value, dataElement.Total,
			variable.HasTotals, variable.NormalizationScale, variable.Decimals) + h.ResolveNormalizationCaption(variable);
		return ret.trimRight();
	}
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
	var latRange = latlng.Lat >= Math.min(bounds.Min.Lat, bounds.Max.Lat) && latlng.Lat < Math.max(bounds.Min.Lat, bounds.Max.Lat);
	var lngRange = latlng.Lon >= Math.min(bounds.Min.Lon, bounds.Max.Lon) && latlng.Lon < Math.max(bounds.Min.Lon, bounds.Max.Lon);
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

AbstractTextComposer.prototype.clearTilePerimeters = function (tileKey) {
	// texts
	var items = this.perimetersInTile[tileKey];
	if (items) {
		for (var i = 0; i < items.length; i++) {
			items[i].setMap(null);
		}
	}
	this.perimetersInTile[tileKey] = [];
	delete this.perimetersInTile[tileKey];
};

AbstractTextComposer.prototype.clearPerimeter = function () {
	for (var k in this.perimetersInTile) {
		if (this.perimetersInTile.hasOwnProperty(k)) {
			this.clearTilePerimeters(k);
		}
	}
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
	canvas.overlay.zoom = zoom;
	if (ids) {
		canvas.overlay.SetFeatureIds(ids);
	}
	return canvas.overlay;
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
