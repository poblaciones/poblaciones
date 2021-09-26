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
	GetRandomDefaultColor() {
		var palette = ['F44E3B', 'FE9200', 'FCDC00',
			'DBDF00', 'A4DD00', '68CCCA', '73D8FF', 'AEA1FF', 'FDA1FF',
			'D33115', 'E27300', 'FCC400',
			'B0BC00', '68BC00', '16A5A5', '009CE0', '7B64FF', 'FA28FF',
			'9F0500', 'C45100', 'FB9E00',
			'808900', '194D33', '0C797D', '0062B1', '653294', 'AB149E'];
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
