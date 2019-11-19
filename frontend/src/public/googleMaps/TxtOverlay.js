import arr from '@/common/js/arr';

export default TxtOverlay;

function TxtOverlay(map, pos, txt, className, zIndex, innerClassName) {
	this.pos = pos;
	this.txt = txt;
	this.tooltip = null;
	this.clickId = null;
	this.className = className;
	this.innerClassName = innerClassName;
	this.hidden = false;
	this.RefCount = 1;
	this.map = map;
	this.FIDs = null;
	this.zIndex = zIndex;
	this.type = null;
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
			} else {
				tooltip = 'Más información de ' + this.tooltip;
			}
			text += "<span title='" + tooltip + "' onClick=\"window.SegMap.SelectId('" + this.type + "', '" + this.clickId +
				"', " + this.pos.lat() + ', ' + this.pos.lng() + ");\" class='ibLink'>";
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
	var overlayProjection = this.getProjection();
	var position = overlayProjection.fromLatLngToDivPixel(this.pos);
	div.style.left = position.x + 'px';
	div.style.top = position.y + 'px';

	var panes = this.getPanes();
	panes.floatPane.appendChild(div);
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

	// Retrieve the southwest and northeast coordinates of this overlay
	// in latlngs and convert them to pixels coordinates.
	// We'll use these coordinates to resize the div.
	var position = overlayProjection.fromLatLngToDivPixel(this.pos);

	var div = this.div;
	div.style.left = position.x + 'px';
	div.style.top = position.y + 'px';
	div.style.zIndex = this.zIndex;

};

// Optional: helper methods for removing and toggling the text overlay.
TxtOverlay.prototype.onRemove = function () {
	if (this.div != null) {
		this.div.parentNode.removeChild(this.div);
		this.div = null;
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
