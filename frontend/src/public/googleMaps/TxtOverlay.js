import arr from '@/common/js/arr';
import iconManager from '@/common/js/iconManager';

export default TxtOverlay;

function TxtOverlay(map, pos, txt, className, zIndex, innerClassName, type, hidden) {
	this.pos = pos;
	this.txt = txt;
	this.symbol = null;
	this.tooltip = null;
	this.clickId = null;
	this.className = className;
	this.innerClassName = innerClassName;
	this.hidden = (hidden !== undefined ? hidden : false);
	this.RefCount = 1;
	this.map = map;
	this.type = type;
	this.FIDs = null;
	this.zoom = null;
	this.zIndex = zIndex;
	this.div = null;
	this.Values = [];
	this.tileDiv = null;
	this.alwaysVisible = false;
	this.pixelLocation = null;
	this.isVisible = false;
	this.setMap(map);

}

TxtOverlay.prototype = new window.google.maps.OverlayView();


TxtOverlay.prototype.UpdateTextStyle = function (className) {
	if (className !== this.className) {
		this.className = className;
		if (this.div) {
			this.div.className = className;
		}
	}
};

TxtOverlay.prototype.SetFeatureIds = function (ids) {
	this.FIDs = ids;
	for (var i = 0; i < ids.length; i++) {
		window.SegMap.textCanvas[ids[i]] = this;
	}
};

TxtOverlay.prototype.RebuildHtml = function () {
	if (this.div === null) {
		return;
	}
	if (this.hidden) {
		this.div.innerHTML = '';
		return;
	}
	var extraStyle = (this.innerClassName ? ' innerBoxTooltip' : '');
	var text = "<div class='innerBox" + extraStyle + "'>";

	if (this.txt) {
		if (this.innerClassName) {
			text += "<div class='" + this.innerClassName + "'>";
		}
		var closeSpan = '';
		if (this.clickId) {
			text += this.resolveLinkPart();
			closeSpan = '</span>';
		}
		if (window.SegMap.frame.Zoom >= 9) {
			text += this.resolveSymbolPart();
		}
		text += this.txt;
		text += closeSpan;
		if (this.innerClassName) {
			text += '</div>';
		}
	}
	text += "</div><div class='bottomBox'>";
	text += this.resolveValuesPart();
	text += '</div>';
	this.div.innerHTML = text;
};

TxtOverlay.prototype.resolveSymbolPart = function () {
	var size = null;
	if (this.symbol === 'fa-chart-bar') {
		// TODO: parametrizar esto según se aclare la necesidad
		size = .85;
	}
	return iconManager.showIcon(this.symbol, null, null, 2, size, true);
};


TxtOverlay.prototype.resolveValuesPart = function () {
	var text = '';
	var zoom = this.zoom;
	var valid = this.Values.filter(item => item.z === zoom);

	for (var n = 0; n < valid.length; n++) {
		var value = valid[n];
		text += "<span class='bItem";
		if (n === 0) {
			text += ' bItemRL';
		}
		if (n === valid.length - 1) {
			text += ' bItemRR';
		}
		text += "' style='background-color: " + value.backColor + "'>" + value.value + '</span>';
	}
	if (valid.length > 1) {
		text = "<span class='bItemGroup'>" + text + '</span>';
	}
	return text;
};

TxtOverlay.prototype.resolveLinkPart = function () {
	var tooltip = '';
	if (this.type === 'C') {
		tooltip = 'Focalizar en ' + this.txt + ' (' + this.tooltip + ')';
	} else if (this.tooltip) {
		tooltip = 'Más información de ' + this.txt;
	}
	if (this.clickId.length === 1) {
		this.clickId = this.clickId[0];
	}
	var clickIdAsText = (this.clickId instanceof Object ? JSON.stringify(this.clickId).replaceAll('"', '@') : this.clickId);
	return "<span title='" + tooltip + "' onClick=\"event.stopPropagation(); window.SegMap.SelectId('" +
							this.type + "', '" + clickIdAsText + "', " + this.pos.lat() + ', '
							+ this.pos.lng() + ", event.ctrlKey);\" class='ibLink'>";
};

TxtOverlay.prototype.onAdd = function() {
	var div = document.createElement('div');
	div.className = this.className;

	this.div = div;
	this.RebuildHtml();

	if (this.tileDiv) {
		this.tileDiv.appendChild(div);
	} else {
		var panes = this.getPanes();
		panes.floatPane.appendChild(div);
	}

	if (!this.Overlaps()) {
		if (this.tileDiv) {
			div.style.left = this.pixelLocation.x + 'px';
			div.style.top = this.pixelLocation.y + 'px';
			div.style.position = 'absolute';
		} else {
			var overlayProjection = this.getProjection();
			var position = overlayProjection.fromLatLngToDivPixel(this.pos);
			div.style.left = position.x + 'px';
			div.style.top = position.y + 'px';
		}
		this.isVisible = true;
	}
	else {
		div.style.visibility = 'hidden';
		this.isVisible = false;

		var panes = this.getPanes();
		panes.floatPane.removeChild(div);
		this.setMap(null);
	}
};

TxtOverlay.prototype.UpdateHiddenAttribute = function (hidden) {
	this.hidden = hidden;
};

TxtOverlay.prototype.Overlaps = function () {
	if (this.hidden) {
		return false;
	}
	if (this.alwaysVisible) {
		return false;
	}
	var intersects = false;

	var startTime = performance.now();

	var position2 = this.map.getProjection().fromLatLngToPoint(this.pos);
	var scale = Math.pow(2, this.map.getZoom());
	var left = Math.floor(position2.x * scale);
	var top = Math.floor(position2.y * scale);

	// Hace un cálculo preliminar tomando solo en cuenta el punto de inserción
	var w = 60;
	var h = 14;
	this.Bounds = { left: left - w / 2, top: top, right: left + w / 2, bottom: top + h };

	if (window.SegMap.OverlapRectangles.Intersects(this)) {
		intersects = true;
	} else {
		this.Bounds = this.CalculateBounds(left, top);
		intersects = window.SegMap.OverlapRectangles.Intersects(this);
	}
	if (intersects) {
		this.hidden = true;
		return true;
	} else {
		window.SegMap.OverlapRectangles.AddRectangle(this);
		return false;
	}
};

TxtOverlay.prototype.CalculateBounds = function (left, top) {
	var w = null;
	var h = null;
	var div = this.div;
	if (div.firstChild) {
		var span = div.firstChild.firstElementChild;
		if (span) {
			w = span.offsetWidth;
			h = span.offsetHeight;
		}
	}
	if (!w) {
		w = div.offsetWidth;
	}
	if (!h) {
		h = div.offsetHeight;
	}
	return { left: left - w / 2, top: top, right: left + w / 2, bottom: top + h };
};

TxtOverlay.prototype.SetText = function (text, tooltip, symbol, clickId) {
	this.txt = text;
	this.tooltip = tooltip;
	this.symbol = symbol;
	this.clickId = (clickId !== undefined ? clickId : null);
	this.RebuildHtml();
};

TxtOverlay.prototype.CreateValue = function (value, zindex, backColor, zoom) {
	for (var n = 0; n < this.Values.length; n++) {
		if (zindex > this.Values[n].zIndex) {
			break;
		}
	}
	var ret = { value: value, zIndex: zindex, backColor: backColor, z: zoom };
	arr.InsertAt(this.Values, n, ret);
	this.RebuildHtml();
	return ret;
};

TxtOverlay.prototype.draw = function () {
	if (!this.tileDiv && this.isVisible) {
		var overlayProjection = this.getProjection();
		var position = overlayProjection.fromLatLngToDivPixel(this.pos);
		var div = this.div;
		div.style.left = position.x + 'px';
		div.style.top = position.y + 'px';
		div.style.zIndex = this.zIndex;
	}
};

TxtOverlay.prototype.onRemove = function () {
	if (this.div != null) {
		if (this.div.parentNode) {
			this.div.parentNode.removeChild(this.div);
		}
		this.div = null;
	}
	if (this.isVisible) {
		window.SegMap.OverlapRectangles.RemoveRectangle(this);
	}
};

TxtOverlay.prototype.Release = function (subFeature) {
	this.RefCount--;
	if (this.RefCount === 0) {
		if (this.FIDs !== null) {
			for (var i = 0; i < this.FIDs.length; i++) {
				delete window.SegMap.textCanvas[this.FIDs[i]];
			}
		}
		this.setMap(null);
	} else if (subFeature) {
		if (arr.Remove(this.Values, subFeature)) {
			this.RebuildHtml();
		}
	}
};
