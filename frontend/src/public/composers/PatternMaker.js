
export default PatternMaker;

function PatternMaker(patternId, z, scale) {
	// posible api de texturas: https://github.com/riccardoscalco/textures
	// test de Pattern: https://jsfiddle.net/wout/jckwhha7/
	this.patternId = patternId;
	this.scale = scale;
	this.zoom = z;
};

PatternMaker.prototype.CreatePattern = function (o2) {
	switch (parseInt(this.patternId)) {
	case 3:
	case 4:
	case 5:
		return this.GetPipeline(o2, this.patternId - 3);
	case 7:
		return this.GetLine(o2, 45);
	case 8:
		return this.GetLine(o2, 90);
	case 9:
		return this.GetLine(o2, 135);
	case 10:
		return this.GetLine(o2, 180);
	case 11:
		return this.GetDots(o2, true);
	case 12:
		return this.GetLine(o2, false);
	}
};


PatternMaker.prototype.GetDots = function (o2, fill) {
	var size = 16 * this.scale;
	var circleSize = 4 * this.scale;

	if (fill) {
		var pos = 12 * this.scale;
		return o2.pattern(size, size, function (add) {
			add.circle(circleSize).center(pos, pos).style('stroke-width: 0px');
		});
	} else {
		var pos = 4 * this.scale;
		return o2.pattern(size, size, function (add) {
			add.circle(circleSize).center(pos, pos).style('stroke-width: ' + this.scale + 'px').fill('transparent');
		});
	}
};


PatternMaker.prototype.GetLine = function (o2, rot) {
	var pattern;
	var loc = this;
	var size = 16 * this.scale;

	if (rot === 135) {
		pattern = o2.pattern(size, size, function (add) {
			loc.addLineWidth(add, 0, 0, 16, 16, 1);
			loc.addLineWidth(add, -1, 15, 1, 17, 1);
			loc.addLineWidth(add, 15, -1, 17, 1, 1);
		});
	} else if (rot === 45) {
		pattern = o2.pattern(size, size, function (add) {
			loc.addLineWidth(add, 0, 16, 16, 0, 1);
			loc.addLineWidth(add, -1, 1, 1, -1, 1);
			loc.addLineWidth(add, 15, 17, 17, 15, 1);
		});
	} else {
		pattern = o2.pattern(size, size, function (add) {
			loc.addLineWidth(add, 8, 0, 8, 16, 1);
		});
		pattern.attr('patternTransform', 'rotate(' + rot + ' 0 0)');
	}
	return pattern;
};

PatternMaker.prototype.addLine = function (add, x1, y1, x2, y2) {
	return add.line(x1 * this.scale, y1 * this.scale,
					x2 * this.scale, y2 * this.scale);
};

PatternMaker.prototype.addLineWidth = function (add, x1, y1, x2, y2, width) {
	var widthScaled = this.scale * width;
	return add.line(x1 * this.scale, y1 * this.scale,
					x2 * this.scale, y2 * this.scale).style('stroke-width', widthScaled + 'px');
};

PatternMaker.prototype.GetPipeline = function (o2, offset) {
	var patch = this.calculatePatchwork();
	var loc = this;
	var size = patch.v4 * this.scale;
	var pattern = o2.pattern(size, size, function (add) {
		loc.addLineWidth(add, 0, 0, patch.v4, patch.v4, patch.bigLinesWidth);
		loc.addLineWidth(add, 0, patch.v4, patch.v4, 0, patch.bigLinesWidth);

		loc.addLine(add, 0, patch.v1, patch.v3, patch.v4);
		loc.addLine(add, 0, patch.v2, patch.v2, patch.v4);
		loc.addLine(add, 0, patch.v3, patch.v1, patch.v4);

		loc.addLine(add, patch.v4, patch.v1, patch.v3, 0);
		loc.addLine(add, patch.v4, patch.v2, patch.v2, 0);
		loc.addLine(add, patch.v4, patch.v3, patch.v1, 0);

		loc.addLine(add, 0, patch.v1, patch.v1, 0);
		loc.addLine(add, 0, patch.v2, patch.v2, 0);
		loc.addLine(add, 0, patch.v3, patch.v3, 0);

		loc.addLine(add, patch.v1, patch.v4, patch.v4, patch.v1);
		loc.addLine(add, patch.v2, patch.v4, patch.v4, patch.v2);
		loc.addLine(add, patch.v3, patch.v4, patch.v4, patch.v3);

	});
	pattern.attr('patternTransform', 'translate(' + ((patch.v1 * offset / 3 + (patch.v1 * offset)) * this.scale) + ')');
	pattern.style('stroke-width: ' + (patch.smallLinesWidth * this.scale) + 'px;');

	return pattern;
};


PatternMaker.prototype.calculatePatchwork = function() {
	var divi = 4;
	switch (this.zoom) {
	case 11:
	case 12:
		divi = 2;
		break;
	case 13:
	case 14:
		divi = 1;
		break;
	case 15:
	case 16:
		divi = 0.5;
		break;
	case 17:
		divi = 0.25;
		break;
	case 18:
	case 19:
	case 20:
	case 21:
		divi = 0.125;
		break;
	}

	var v4 = 128 / divi;
	var v3 = 96 / divi;
	var v2 = 64 / divi;
	var v1 = 32 / divi;

	var bigLinesWidth = 4;
	var smallLinesWidth = 2;
	if (divi === 2) {
		bigLinesWidth = 3;
		smallLinesWidth = 1;
	}
	if (divi < 1) {
		bigLinesWidth = 3 / divi;
		smallLinesWidth = 1 / divi;
	}
	if (this.zoom <= 10) {
		smallLinesWidth = 1;
		bigLinesWidth = smallLinesWidth;
	} else if (this.zoom >= 17) {
		bigLinesWidth = smallLinesWidth;
	}
	return { v1: v1, v2: v2, v3: v3, v4: v4, bigLinesWidth: bigLinesWidth, smallLinesWidth: smallLinesWidth };
};
