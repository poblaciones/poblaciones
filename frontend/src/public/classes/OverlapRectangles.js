import arr from '@/common/framework/arr';

export default OverlapRectangles;

function OverlapRectangles() {
	this.Rectangles = [];
	this.currentZoomLevel = null;
}

OverlapRectangles.prototype.AddRectangle = function (rect) {
	this.Rectangles.push(rect);
};

OverlapRectangles.prototype.RemoveRectangle = function (rect) {
	arr.Remove(this.Rectangles, rect);
};

OverlapRectangles.prototype.CheckZoomLevel = function (zoom) {
	if (this.currentZoomLevel !== zoom) {
		this.Rectangles = [];
		this.currentZoomLevel = zoom;
	}
};

OverlapRectangles.prototype.Intersects = function (overlay) {
	this.CheckZoomLevel(overlay.zoom);
	var startTime = performance.now();

	var rect = overlay.Bounds;
	for (var n = 0; n < this.Rectangles.length; n++) {
		var r2 = this.Rectangles[n].Bounds;
		if (rect.top <= r2.bottom && rect.bottom >= r2.top
			&& rect.left <= r2.right && rect.right >= r2.left) {
		//	var endTime2 = performance.now();
		//	console.log('done true for ' + this.Rectangles.length + ' in ' + (endTime2 - startTime));
			return true;
		}
	}
	//var endTime = performance.now();
	//console.log('done false for ' + this.Rectangles.length + ' in ' + (endTime - startTime));

	return false;
};
