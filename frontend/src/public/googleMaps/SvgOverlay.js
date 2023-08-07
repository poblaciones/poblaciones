import Mercator from '@/public/js/Mercator';

export default SvgOverlay;

function SvgOverlay(map, svg, index, bounds) {
	this.svg = svg;
	this.index = index;
	this.bounds = bounds;
	this.div_ = null;
	//this.clickEvent = clickEvent;

	this.setMap(map);
}

SvgOverlay.prototype = new window.google.maps.OverlayView();

SvgOverlay.prototype.onAdd = function () {

	/*var div = document.createElement('div');
	div.style.borderStyle = 'none';
	div.style.borderWidth = '0px';
	div.style.position = 'absolute';
	div.style.pointerEvents = 'none';
	div.style.zIndex = this.index;

	div.appendChild(this.svg);

	this.div_ = div;
  */
	this.svg.style.position = 'absolute';
	this.svg.style.zIndex = this.index;
	this.div_ = this.svg;

	// Add the element to the "overlayMetric" pane.
	var panes = this.getPanes();
	// overlayMetric, overlayMouseTarget
	panes.overlayMetric.appendChild(this.div_);
};

SvgOverlay.prototype.draw = function () {

	// We use the south-west and north-east
	// coordinates of the overlay to peg it to the correct position and size.
	// To do this, we need to retrieve the projection from the overlay.
	var overlayProjection = this.getProjection();
	var m = new Mercator();
	// Retrieve the south-west and north-east coordinates of this overlay
	// in LatLngs and convert them to pixel coordinates.
	// We'll use these coordinates to resize the div.
	var sw = overlayProjection.fromLatLngToDivPixel(
		m.fromLatLonToGoogleLatLng(this.bounds.Min));
	var ne = overlayProjection.fromLatLngToDivPixel(
		m.fromLatLonToGoogleLatLng(this.bounds.Max));

	// Resize the image's div to fit the indicated dimensions.
	var div = this.div_;
	div.style.left = sw.x + 'px';
	div.style.top = ne.y + 'px';
	div.style.width = (ne.x - sw.x) + 'px';
	div.style.height = (sw.y - ne.y) + 'px';
};


SvgOverlay.prototype.Release = function () {
	this.setMap(null);
};

SvgOverlay.prototype.onRemove = function () {
	if (this.div_ !== null) {
		this.div_.parentNode.removeChild(this.div_);
		this.div_ = null;
	}
};
