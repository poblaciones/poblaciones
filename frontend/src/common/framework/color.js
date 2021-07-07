module.exports = {
	IsLightColor(color) {
		if (!color || color.length === 0) {
			return false;
		}
		if (color[0] !== "#") {
			color = "#" + color;
		}
		var val = parseInt(color.substr(1, 2), 16) +
			parseInt(color.substr(3, 2), 16) + parseInt(color.substr(5, 2), 16);
		return val / 3 > 220;
	},
	IsReallyLightColor(color) {
		if (!color || color.length === 0) {
			return false;
		}
		if (color[0] !== "#") {
			color = "#" + color;
		}
		var val = parseInt(color.substr(1, 2), 16) +
			parseInt(color.substr(3, 2), 16) + parseInt(color.substr(5, 2), 16);
		return val / 3 > 234;
	},
	ParseColorParts(color) {
		var r = parseInt(color.substr(1, 2), 16);
		var g = parseInt(color.substr(3, 2), 16);
		var b = parseInt(color.substr(5, 2), 16);
		return [r, g, b];
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
