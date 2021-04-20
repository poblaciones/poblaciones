const Str = require('@/common/js/str');
const fontAwesomeIconsList = require('./fontAwesomeIconsList.js');
const mapIconsList = require('./mapIconsList.js');

module.exports = {
	getSymbolImage(customIconList, symbol) {
		if (!customIconList) {
			return '';
		}
		if (customIconList.length === undefined) {
			return customIconList[symbol];
		}
		for (var n = 0; n < customIconList.length; n++) {
			if (customIconList[n].Caption === symbol) {
				return customIconList[n].Image;
			}
		}
		return '';
	},
	showIcon(symbol, customIconList, maxWidth, rightMargin, sizeEm, doNotShowError) {
		var html;
		if (!symbol) {
			return '';
		}
		var info = this.formatIcon(symbol);
		if (info.unicode) {
			// pone un ícono de fontawesome o mapicons
			html = this.buildIconBlock(info, rightMargin, sizeEm);
		} else {
			var src = this.getSymbolImage(customIconList, symbol);
			if (src) {
				// pone un ícono custom
				var maxW = (maxWidth ? maxWidth : '2rem');
				var maxH = maxW;
				html = "<img src='" + src + "' style='max-height: " + maxH + "; max-width: " + maxW + ";";
				if (rightMargin) {
					html += "margin-right: " + rightMargin + "px;";
				}
				html += "'/>";
			} else {
				// pone un ícono de error
				if (doNotShowError) {
					html = '';
				} else {
					html = this.buildIconBlock(this.formatIcon('fa-exclamation'), rightMargin, sizeEm);
				}
			}
		}
		return html;
	},
	buildIconBlock(info, rightMargin, sizeEm) {
		var html = "<span style=\"font-family: '" + info['family'] + "';";
		if (info.weight) {
			html += "font-weight: " + info.weight + ";";
		}
		if (sizeEm) {
			html += "font-size: " + sizeEm + "em;";
		}
		if (rightMargin) {
			html += "margin-right: " + rightMargin + "px;";
		}
		html += '">' + info.unicode + "</span>";
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
