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
	IsIntegerGreaterThan0(str) {
		let n = Number(str);
		return Number.isInteger(n) && n > 0;
	},
	AddDot(str) {
		if (str !== null && this.EndsWith(str, ".") === false) {
			return str + '.';
		} else {
			return str;
		}
	},
	GenerateAccessLink() {
		return 'l-' + this.GetRandomString(16);
	},
	GetRandomString(length) {
    var text = "";
    var possible = "abcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
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

