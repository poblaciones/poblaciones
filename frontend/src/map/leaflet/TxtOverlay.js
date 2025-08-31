import arr from '@/common/framework/arr';
import Mercator from '@/map/js/Mercator';
import TextOverlay from '../overlays/TextOverlay';

export default TxtOverlay;

function TxtOverlay(map, pos, txt, className, zIndex, innerClassName, type, hidden) {
	this.overlay = new TextOverlay(this, map, pos, txt, className, zIndex, innerClassName, type, hidden);

	this.marker = new L.marker(L.latLng(this.overlay.pos.Lat, this.overlay.pos.Lon), {
		icon: L.divIcon({
			className: 'leaflet-mouse-marker',
			iconAnchor: [20, 20],
			iconSize: [40, 40]
		})
	});
	this.onAdd();
}

TxtOverlay.prototype.onAdd = function() {
	var div = document.createElement('div');
	div.className = this.overlay.className;
	this.overlay.div = div;
	var container = document.getElementById('panLabelCalculus');
	container.appendChild(div);
	this.overlay.RebuildHtml();
	var position2 = this.GetPointPosition();

	if (!this.overlay.Overlaps(position2)) {
		this.overlay.isVisible = true;
		this.marker.addTo(this.overlay.map);
		this.marker.bindTooltip(this.overlay.div, {
			permanent: true,
			direction: 'center',
			className: '',
			opacity: 1,
			offset: [0, 0]
		});
	} else {
		div.style.visibility = 'hidden';
		container.removeChild(div);
		this.overlay.isVisible = false;
		this.overlay.map.removeLayer(this.marker);
	}

};

TxtOverlay.prototype.GetPointPosition = function () {
	var m = new Mercator();
	return m.fromLatLngToPoint({ lat: this.overlay.pos.Lat, lng: this.overlay.pos.Lon });
};

TxtOverlay.prototype.draw = function () {
	if (!this.overlay.tileDiv && this.overlay.isVisible) {
		var overlayProjection = this.getProjection();
		var position = overlayProjection.fromLatLngToDivPixel(this.overlay.pos);
		var div = this.overlay.div;
		div.style.left = position.x + 'px';
		div.style.top = position.y + 'px';
		div.style.zIndex = this.zIndex;
	}
};

TxtOverlay.prototype.Remove = function () {
	if (this.overlay.isVisible) {
		this.overlay.map.removeLayer(this.marker);
		window.SegMap.OverlapRectangles.RemoveRectangle(this.overlay);
	}
};

