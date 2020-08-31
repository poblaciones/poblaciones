module.exports = {
	Split(cad, separator) {
		return (cad + '').split(separator);
	},
	StartsWith(cad, part) {
		return cad.lastIndexOf(part, 0) === 0;
	},
	AbsoluteUrl(url) {
		if (url) {
			var protocol = window.location.protocol;
			if (url.startsWith(protocol)) {
				return url;
			}
			var slashes = protocol + "//";
			var host = slashes + window.location.hostname + ( window.location.port ? ':' + window.location.port : '');
			if (!url.startsWith('/')) {
				url = '/' + url;
			}
			return host + url.trim();
		} else {
			return null;
		}
	},
	AppendParam(url, param, value) {
		var parts = url.split('#');
		var n = parts[0].indexOf('?');
		var separator = (n >= 0 ? '&' : '?');
		var ret = parts[0] + separator + param + "=" + value;
		if (parts.length > 1) {
			ret += "#" + parts[1];
		}
		return ret;
	},
	LowerFirstIfOnlyUpper(cad) {
		if (cad.length === 1 || cad.substring(1) === cad.substring(1).toLowerCase()) {
			return cad.toLowerCase();
		} else {
			return cad;
		}
	},
	isNumeric(n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	},
	isNumericFlex(n) {
		var t = '' + n;
		t = t.replace(",", ".");
		if (this.countMatches(t, ".") > 1) {
			return false;
		}
		return !isNaN(parseFloat(t)) && isFinite(t);
	},
	countMatches(cad, item) {
		var ret = 0;
		var i = 0;
		while ((i = cad.indexOf(item, i) + 1) !== 0) {
			ret++;
		}
		return ret;
	},
	IsIntegerGreaterThan(str, than) {
		let n = Number(str);
		return Number.isInteger(n) && n > than;
	},
	IsIntegerGreaterThan0(str) {
		return this.IsIntegerGreaterThan(str, 0);
	},
	AddDot(str) {
		if (str !== null && this.EndsWith(str, ".") === false) {
			return str + '.';
		} else {
			return str;
		}
	},
	applySymbols(cad) {
		return cad.replace('km2', 'km²');
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
	},
	EscapeHtml(unsafe) {
    return ('' + unsafe)
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
	},
	EscapeRegExp(str) {
		return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
	},
	Replace(cad, text, text2) {
		if (cad === null) {
			return null;
		}
		return (cad.toString()).replace(new RegExp(this.EscapeRegExp(text), "g"), text2);
	},

	GetMonthLabel(m) {
		switch(m + 1)
		{
			case 1:
				return 'Enero';
			case 2:
				return 'Febrero';
			case 3:
				return 'Marzo';
			case 4:
				return 'Abril';
			case 5:
				return 'Mayo';
			case 6:
				return 'Junio';
			case 7:
				return 'Julio';
			case 8:
				return 'Agosto';
			case 9:
				return 'Septiembre';
			case 10:
				return 'Octubre';
			case 11:
				return 'Noviembre';
			case 12:
				return 'Diciembre';
			default:
				return '';
		}
	},
	EndsWith(cad, part) {
		return cad.indexOf(part, cad.length - part.length) !== -1;
	},
	Contains(cad, part) {
		return cad.indexOf(part) !== -1;
	}
};

