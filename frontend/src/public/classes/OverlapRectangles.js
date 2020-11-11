import arr from '@/common/js/arr';

export default OverlapRectangles;

function OverlapRectangles() {
	this.Rectangles = [];
}

OverlapRectangles.prototype.AddRectangle = function (rect) {
	this.Rectangles.push(rect);
};

OverlapRectangles.prototype.RemoveRectangle = function (rect) {
	arr.Remove(this.Rectangles, rect);
};

OverlapRectangles.prototype.Intersects = function (overlay) {
	var rect = overlay.Bounds;
	for (var n = 0; n < this.Rectangles.length; n++) {
		var r2 = this.Rectangles[n].Bounds;
		if (rect.top <= r2.bottom && rect.bottom >= r2.top
			&& rect.left <= r2.right && rect.right >= r2.left) {
			return true;
		}
	}
	return false;
};
