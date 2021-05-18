import arr from '@/common/js/arr';
import iconManager from '@/common/js/iconManager';

export default TxtContainerOverlay;

function TxtContainerOverlay(map, pos) {
	this.div = null;
	this.pos = pos;
	this.zIndex = zIndex;
	this.setMap(map);
}

TxtContainerOverlay.prototype = new window.google.maps.OverlayView();

TxtContainerOverlay.prototype.onAdd = function() {
	var div = document.createElement('div');
	this.div = div;
	var panes = this.getPanes();
	panes.floatPane.appendChild(div);
};

TxtContainerOverlay.prototype.draw = function () {
	var overlayProjection = this.getProjection();
	var position = overlayProjection.fromLatLngToDivPixel(this.pos);
	var div = this.div;
	div.style.left = position.x + 'px';
	div.style.top = position.y + 'px';
	div.style.zIndex = this.zIndex;
};

TxtContainerOverlay.prototype.onRemove = function () {
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

TxtContainerOverlay.prototype.Release = function () {
	this.setMap(null);
};
