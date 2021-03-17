import h from '@/public/js/helper';

export default AbstractTextComposer;

function AbstractTextComposer() {}


AbstractTextComposer.prototype.AbstractConstructor = function (value, total, description) {
	this.textStyle = '';
	this.textInTile = [];
};

AbstractTextComposer.prototype.ResolveValueLabel = function (variable, effectiveId, dataElement, location, tileKey, backColor, markerSettings) {
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
		caption: description, tooltip: description,
		clickId: effectiveId
	};
	this.SetTextOverlay(textElement, '' + tileKey,
		location, number, backColor, effectiveId);
};

AbstractTextComposer.prototype.SetTextOverlay = function (textElement, tileKey, location,
																													number, backColor) {
	var canvas = this.GetOrCreate(textElement.type, textElement.FIDs, tileKey, location, textElement.hidden);
	var v = null;
	if (textElement.caption !== null || textElement.symbol) {
		canvas.SetText(textElement.caption, textElement.tooltip, textElement.symbol, textElement.clickId);
	}
	if (number !== null) {
		var zIndex = 100000 - this.index;
		v = canvas.CreateValue(number, zIndex, backColor);
	}
	this.textInTile[tileKey].push({ c: canvas, v: v });
};

AbstractTextComposer.prototype.FormatValue = function (variable, dataElement) {
	var ret = h.renderMetricValue(dataElement.Value, dataElement.Total,
		variable.HasTotals, variable.NormalizationScale, variable.Decimals) + ' ' + h.ResolveNormalizationCaption(variable);
	return ret.trimRight();
};


AbstractTextComposer.prototype.GetOrCreate = function(type, ids, tileKey, location, hidden) {
	var canvas = this.GetFeatureTextCanva(ids, hidden);
	if (canvas === null) {
		canvas = this.CreateFeatureTextCanva(type, ids, tileKey, location, hidden);
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

AbstractTextComposer.prototype.CreateFeatureTextCanva = function(type, ids, tileKey, location, hidden) {
	var zIndex = 100000 - this.index;
	// lo resuelven los hijos
	var canvas = this.MapsApi.Write('', location, zIndex, this.textStyle, null, null, type, hidden);
	if (ids) {
		canvas.SetFeatureIds(ids);
	}
	return canvas;
};

AbstractTextComposer.prototype.GetFeatureTextCanva = function(ids, hidden) {
	if (ids === null) {
		return null;
	}
	for (var i = 0; i < ids.length; i++) {
		var ret = window.SegMap.textCanvas[ids[i]];
		if (ret !== undefined) {
			ret.RefCount++;
			if (hidden === true) {
				ret.Hide();
			}
			return ret;
		}
	}
	return null;
};
