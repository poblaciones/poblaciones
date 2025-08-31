
export default SvgMarkerMaker;

function SvgMarkerMaker(z, scale) {
	// NO REDUCIDO
// pruebas: https://codepen.io/pablodegrande/pen/zYZmWwq
	const TILE_SIZE = 256;
	const TILE_PRJ_SIZE = 8192;
	var GLOBAL_FIT = TILE_PRJ_SIZE / TILE_SIZE;

	this.scale = scale * GLOBAL_FIT;
	this.zoom = z;
};

SvgMarkerMaker.prototype.CreateCircleMarker = function (o2, color) {
	var circleSize = 3; // * this.scale;
	var size = circleSize * 2; // * this.scale;
	return o2.marker(size, size, function(add) {
		add.circle(circleSize).center(circleSize, circleSize).fill(color);
	});
};

SvgMarkerMaker.prototype.ArrowMarker = function (o2, color) {
	var arrowSize = 3; // * this.scale;
	var size = arrowSize * 2; // * this.scale;
	return o2.marker(size, size, function(add) {
		add.path("M0,0 L0," + arrowSize * 2 + " L" + arrowSize * 2 + "," + arrowSize + " z").fill(color);
	}).ref(size, arrowSize);
};

