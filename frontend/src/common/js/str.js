module.exports = {
	Split(cad, separator) {
		return (cad + '').split(separator);
	},
	StartsWith(cad, part) {
		return cad.lastIndexOf(part, 0) === 0;
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
	AddDot(str) {
		if (str !== null && this.EndsWith(str, ".") === false) {
			return str + '.';
		} else {
			return str;
		}
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
	EndsWith(cad, part) {
		return cad.indexOf(part, cad.length - part.length) !== -1;
	},
	Contains(cad, part) {
		return cad.indexOf(part) !== -1;
	}
};

