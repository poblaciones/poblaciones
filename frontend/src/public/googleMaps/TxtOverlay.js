import arr from '@/common/js/arr';

export default TxtOverlay;

function TxtOverlay(map, pos, txt, className, zIndex, innerClassName, type, hidden) {
	this.pos = pos;
	this.txt = txt;
	this.tooltip = null;
	this.clickId = null;
	this.className = className;
	this.innerClassName = innerClassName;
	this.hidden = (hidden !== undefined ? hidden : false);
	this.RefCount = 1;
	this.map = map;
	this.type = type;
	this.FIDs = null;
	this.zIndex = zIndex;
	this.div = null;
	this.Values = [];
	this.setMap(map);
}

TxtOverlay.prototype = new window.google.maps.OverlayView();

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
		if (this.clickId) {
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
			text += "<span title='" + tooltip + "' onClick=\"event.stopPropagation(); window.SegMap.SelectId('" + this.type + "', '" + clickIdAsText +
				"', " + this.pos.lat() + ', ' + this.pos.lng() + ", event.ctrlKey);\" class='ibLink'>";
		}
		text += this.txt;
		if (this.clickId && this.type === 'C') {
			text += '</span>';
		}
		if (this.innerClassName) {
			text += '</div>';
		}
	}
	text += "</div><div class='bottomBox'>";
	if (this.Values.length > 1) {
		text += "<span class='bItemGroup'>";
	}
	for (var n = 0; n < this.Values.length; n++) {
		var value = this.Values[n];
		text += "<span class='bItem";
		if (n === 0) {
			text += ' bItemRL';
		}
		if (n === this.Values.length - 1) {
			text += ' bItemRR';
		}
		text += "' style='background-color: " + value.backColor + "'>" + value.value + '</span>';
	}
	if (this.Values.length > 1) {
		text += '</span>';
	}
	text += '</div>';
	this.div.innerHTML = text;
};

TxtOverlay.prototype.onAdd = function() {

	var div = document.createElement('div');
	div.className = this.className;

	this.div = div;
	this.RebuildHtml();

	var panes = this.getPanes();
	panes.floatPane.appendChild(div);

	if (!this.Overlaps()) {
		var overlayProjection = this.getProjection();
		var position = overlayProjection.fromLatLngToDivPixel(this.pos);
		div.style.left = position.x + 'px';
		div.style.top = position.y + 'px';
	}
	else {
		div.style.display = 'none';
	}
};

TxtOverlay.prototype.Overlaps = function () {
	if (this.hidden) {
		return false;
	}
	var position2 = this.map.getProjection().fromLatLngToPoint(this.pos);
	var scale = Math.pow(2, this.map.getZoom());
	var left = Math.floor(position2.x * scale);
	var top = Math.floor(position2.y * scale);
	var w = null;
	var h = null;
	if (this.div.firstChild) {
		var span = this.div.firstChild.firstElementChild;
		if (span) {
			w = span.offsetWidth;
			h = span.offsetHeight;
		}
	}
	if (!w) {
		w = this.div.offsetWidth;
	}
	if (!h) {
		h = this.div.offsetHeight;
	}
	this.Bounds = { left: left - w / 2, top: top, right: left + w / 2, bottom: top + h };
	if (window.SegMap.OverlapRectangles.Intersects(this)) {
		this.hidden = true;
		return true;
	}
	window.SegMap.OverlapRectangles.AddRectangle(this);
	return false;
};

TxtOverlay.prototype.SetText = function (text, tooltip, clickId) {
	this.txt = text;
	this.tooltip = tooltip;
	this.clickId = (clickId !== undefined ? clickId : null);
	this.RebuildHtml();
};

TxtOverlay.prototype.Hide = function() {
	this.hidden = true;
};

TxtOverlay.prototype.CreateValue = function (value, zindex, backColor) {
	for (var n = 0; n < this.Values.length; n++) {
		if (zindex > this.Values[n].zIndex) {
			break;
		}
	}
	var ret = { value: value, zIndex: zindex, backColor: backColor };
	arr.InsertAt(this.Values, n, ret);
	this.RebuildHtml();
	return ret;
};

TxtOverlay.prototype.draw = function() {
	var overlayProjection = this.getProjection();
	var position = overlayProjection.fromLatLngToDivPixel(this.pos);
	var div = this.div;
	div.style.left = position.x + 'px';
	div.style.top = position.y + 'px';
	div.style.zIndex = this.zIndex;
};

TxtOverlay.prototype.onRemove = function () {
	if (this.div != null) {
		this.div.parentNode.removeChild(this.div);
		this.div = null;
	}
	window.SegMap.OverlapRectangles.RemoveRectangle(this);
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
