import arr from '@/common/framework/arr';
import TextOverlay from '../overlays/TextOverlay';

export default TxtOverlay;

function TxtOverlay(map, pos, txt, className, zIndex, innerClassName, type, hidden) {
	this.overlay = new TextOverlay(this, map, pos, txt, className, zIndex, innerClassName, type, hidden);
	this.setMap(map);
}

TxtOverlay.prototype = new window.google.maps.OverlayView();

TxtOverlay.prototype.onAdd = function() {
	var div = document.createElement('div');
	div.className = this.overlay.className;
	this.overlay.div = div;
	this.overlay.RebuildHtml();

	var panes = this.getPanes();
	panes.floatPane.appendChild(div);
	var position2 = this.GetPointPosition();

	if (!this.overlay.Overlaps(position2)) {
		var overlayProjection = this.getProjection();
		var position = overlayProjection.fromLatLngToDivPixel(
			new window.SegMap.MapsApi.google.maps.LatLng(this.overlay.pos.Lat, this.overlay.pos.Lon));
		div.style.left = position.x + 'px';
		div.style.top = position.y + 'px';
		this.overlay.isVisible = true;
	}
	else {
		div.style.visibility = 'hidden';
		this.overlay.isVisible = false;

		var panes = this.getPanes();
		panes.floatPane.removeChild(div);
		this.setMap(null);
	}
};


TxtOverlay.prototype.GetPointPosition = function () {
	return this.map.getProjection().fromLatLngToPoint(
		new window.SegMap.MapsApi.google.maps.LatLng(this.overlay.pos.Lat, this.overlay.pos.Lon));
};


TxtOverlay.prototype.draw = function () {
	if (this.overlay.isVisible) {
		var overlayProjection = this.getProjection();
		var position = overlayProjection.fromLatLngToDivPixel(
			new window.SegMap.MapsApi.google.maps.LatLng(this.overlay.pos.Lat, this.overlay.pos.Lon));
		var div = this.overlay.div;
		div.style.left = position.x + 'px';
		div.style.top = position.y + 'px';
		div.style.zIndex = this.zIndex;
	}
};

TxtOverlay.prototype.onRemove = function () {
	if (this.overlay.div != null) {
		if (this.overlay.div.parentNode) {
			this.overlay.div.parentNode.removeChild(this.overlay.div);
		}
		this.overlay.div = null;
	}
	if (this.overlay.isVisible) {
		window.SegMap.OverlapRectangles.RemoveRectangle(this.overlay);
	}
};

TxtOverlay.prototype.Remove = function () {
	this.setMap(null);
};

