import Helper from '@/public/js/helper';

export default AbstractTextComposer;

function AbstractTextComposer() {}


AbstractTextComposer.prototype.AbstractConstructor = function (value, total, description) {
	this.textStyle = '';
	this.textInTile = [];
};

AbstractTextComposer.prototype.ResolveValueLabel = function (dataElement, location, tileKey, backColor) {
	var number = null;
	if (this.activeSelectedMetric.SelectedVariable().ShowValues == 1) {
		number = this.FormatValue(dataElement['Value'], dataElement['Summary'], dataElement['Total']);
	} else {
		var pattern = this.activeSelectedMetric.GetPattern();
		if (pattern === 2) {
			number = '&nbsp;&nbsp;';
		}
	}
	this.SetTextOverlay(null, [dataElement['FID']], '' + tileKey, location, null, null, number, backColor);
};

AbstractTextComposer.prototype.SetTextOverlay = function (type, fids, tileKey, location, description, tooltip, number, backColor, clickId, hidden) {
	var canvas = this.GetOrCreate(type, fids, tileKey, location, hidden);
	var v = null;
	if (description !== null) {
		canvas.SetText(description, tooltip, clickId);
	}
	if (number !== null) {
		var zIndex = 100000 - this.index;
		v = canvas.CreateValue(number, zIndex, backColor);
	}
	this.textInTile[tileKey].push({ c: canvas, v: v });

};

AbstractTextComposer.prototype.FormatValue = function (value, summary, total) {
	var number = value;
	if (summary) {
		number = summary;
	}
	if (total) {
		number = Helper.formatPercent(value, total);
		if (number !== '-') {
			number += '%';
		}
	}
	return number;
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
	var canvas = this.MapsApi.Write('', location, zIndex, this.textStyle);
	if (type !== null) {
		canvas.type = type;
	}
	if (hidden === true) {
		canvas.Hide();
	}
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
