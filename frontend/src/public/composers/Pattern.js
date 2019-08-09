
export default Pattern;

function Pattern(patternId, scale) {
	// posible api de texturas: https://github.com/riccardoscalco/textures
	// test de Pattern: https://jsfiddle.net/wout/jckwhha7/
	this.patternId = patternId;
	this.scale = scale;
};

Pattern.prototype.GetPattern = function (o2) {
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

Pattern.prototype.GetDots = function (o2, fill) {
	if (fill) {
		return o2.pattern(16, 16, function (add) {
			add.circle(4).center(12, 12).style('stroke-width: 0px');
		});
	} else {
		return o2.pattern(16, 16, function (add) {
			add.circle(4).center(4, 4).style('stroke-width: 1px').fill('transparent');
		});
	}
};


Pattern.prototype.GetLine = function (o2, rot) {
	var pattern;
	if (rot === 135) {
		pattern = o2.pattern(16, 16, function (add) {
			add.line(0, 0, 16, 16).style('stroke-width', '1px');
			add.line(-1, 15, 1, 17).style('stroke-width', '1px');
			add.line(15, -1, 17, 1).style('stroke-width', '1px');
		});
	} else if (rot === 45) {
		pattern = o2.pattern(16, 16, function (add) {
			add.line(0, 16, 16, 0).style('stroke-width', '1px');
			add.line(-1, 1, 1, -1).style('stroke-width', '1px');
			add.line(15, 17, 17, 15).style('stroke-width', '1px');
		});
	} else {
		pattern = o2.pattern(16, 16, function (add) {
			add.line(8, 0, 8, 16).style('stroke-width', '1px');
		});
		pattern.attr('patternTransform', 'rotate(' + rot + ' 0 0)');
	}
	return pattern;
};

Pattern.prototype.GetPipeline = function (o2, offset) {
	var loc = this;
	var pattern = o2.pattern(this.scale.v4, this.scale.v4, function (add) {
		add.line(0, 0, loc.scale.v4, loc.scale.v4).style('stroke-width', loc.scale.anc + 'px');
		add.line(0, loc.scale.v4, loc.scale.v4, 0).style('stroke-width', loc.scale.anc + 'px');

		add.line(0, loc.scale.v1, loc.scale.v3, loc.scale.v4);
		add.line(0, loc.scale.v2, loc.scale.v2, loc.scale.v4);
		add.line(0, loc.scale.v3, loc.scale.v1, loc.scale.v4);

		add.line(loc.scale.v4, loc.scale.v1, loc.scale.v3, 0);
		add.line(loc.scale.v4, loc.scale.v2, loc.scale.v2, 0);
		add.line(loc.scale.v4, loc.scale.v3, loc.scale.v1, 0);

		add.line(0, loc.scale.v1, loc.scale.v1, 0);
		add.line(0, loc.scale.v2, loc.scale.v2, 0);
		add.line(0, loc.scale.v3, loc.scale.v3, 0);

		add.line(loc.scale.v1, loc.scale.v4, loc.scale.v4, loc.scale.v1);
		add.line(loc.scale.v2, loc.scale.v4, loc.scale.v4, loc.scale.v2);
		add.line(loc.scale.v3, loc.scale.v4, loc.scale.v4, loc.scale.v3);

	});
	pattern.attr('patternTransform', 'translate(' + (this.scale.v1 * offset / 3 + (loc.scale.v1 * offset)) + ')');

	return pattern;
};

