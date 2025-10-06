module.exports = {
	IsAlmostLightColor(color) {
		return this.colorForce(color, 180);
	},
	IsLightColor(color) {
		return this.colorForce(color, 220);
	},
	IsReallyLightColor(color) {
		return this.colorForce(color, 234);
	},
	colorForce(color, force) {
		if (!color || color.length === 0) {
			return false;
		}
		var parts = this.ParseColorPartsRGB(color);
		var val = parts.r + parts.g + parts.b;
		return val / 3 > force;
	},
	ReduceColor(color, multiplier) {
		var parts = this.ParseColorPartsRGB(color);
		return '#' + this.toHex(Math.floor(parts.r * multiplier)) + this.toHex(Math.floor(parts.g * multiplier)) + this.toHex(Math.floor(parts.b * multiplier));
	},
	ParseColorPartsRGB(color) {
		var parts = this.ParseColorParts(color);
		if (parts.length === 3) {
			return { r: parts[0], g: parts[1], b: parts[2] };
		} else {
				return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] };
		}
	},
	ParseColorParts(color) {
		if (color[0] !== "#") {
			color = "#" + color;
		}
		var r = parseInt(color.substr(1, 2), 16);
		var g = parseInt(color.substr(3, 2), 16);
		var b = parseInt(color.substr(5, 2), 16);
		if (color.length === 9) {
			var a = parseInt(color.substr(7, 2), 16);
			return [r, g, b, a];
		} else {
			return [r, g, b];
		}
	},
	GetColorPalete() {
		return ['F44E3B', 'FE9200', 'FCDC00',
			'DBDF00', 'A4DD00', '68CCCA', '73D8FF', 'AEA1FF', 'FDA1FF',
			'D33115', 'E27300', 'FCC400',
			'B0BC00', '68BC00', '16A5A5', '009CE0', '7B64FF', 'FA28FF',
			'9F0500', 'C45100', 'FB9E00',
			'808900', '194D33', '0C797D', '0062B1', '653294', 'AB149E'];
	},
	GetRandomDefaultColor() {
		var palette = this.GetColorPalete();
		return palette[Math.floor(Math.random() * palette.length)];
	},
	MakeColor(r, g, b) {
		return "#" + this.toHex(Math.floor(r)) + this.toHex(Math.floor(g)) + this.toHex(Math.floor(b));
	},
	toHex(n) {
		var ret = n.toString(16);
		if (ret.length == 1) ret = "0" + ret;
		return ret;
	}
};
