const Str = require('@/common/js/str');
const fontAwesomeIconsList = require('./fontAwesomeIconsList.js');
const mapIconsList = require('./mapIconsList.js');

module.exports = {
	getSymbolImage(customIconList, symbol) {
		for (var n = 0; n < customIconList.length; n++) {
			if (customIconList[n].Caption === symbol) {
				return customIconList[n].Image;
			}
		}
		return '';
	},
	showIcon(symbol, customIconList, maxWidth) {
		var html;
		if (!symbol) {
			return '';
		}
		var info = this.formatIcon(symbol);
		if (info.unicode) {
			html = "<span style=\"font-family: '" + info['family'] + "';";
			if (info.weight) {
				html += "font-weight: " + info.weight + ";";
			}
			html += '">' + info.unicode + "</span>";
		} else {
			var src = this.getSymbolImage(customIconList, symbol);
			if (src) {
				var maxv = (maxWidth ? maxWidth : '2rem');
				html = "<img src='" + src + "' style='max-height: " + maxv + "; max-width: " + maxv + ";'/>";
			} else {
				html = '';
			}
		}
		return html;
	},
	isCustom(symbol) {
		return symbol && symbol.startsWith('usu-');
	},
	formatIcon(symbol) {
		var ret = { 'family': 'Arial', 'unicode': '', 'weight': '400' };
		if (symbol === null || symbol === undefined || symbol === '') {
			return ret;
		}
		var preffix = symbol.substr(0, 3);
		var unicode = null;
		if (preffix === 'fa-') {
			unicode = fontAwesomeIconsList.icons[symbol];
		} else if (preffix === 'mp-') {
			unicode = mapIconsList.icons[symbol];
		}
		var family;
		var weight = 'normal';
		switch (preffix) {
			case 'fa-':
				family = 'Font Awesome\\ 5 Free';
				weight = '900';
				break;
			case 'mp-':
				family = 'Flaticon';
				break;
			default:
				family = '';
				break;
		}
		if (unicode) {
			ret = { 'family': family, 'unicode': unicode, 'weight': weight };
		}
		return ret;
	}
};
