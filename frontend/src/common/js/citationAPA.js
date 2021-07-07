const str = require('@/common/framework/str');

module.exports = {
	onlineMapCitation(escapedAuthor, escapedDate, escapedTitle, url, noformat) {
		if (!escapedAuthor) {
			escapedAuthor = escapedTitle;
			escapedTitle = null;
		}
		var ret = escapedAuthor;

		if (str.Contains(escapedDate, "/")) {
			var parts = str.Split(escapedDate, '/');
			escapedDate = parts[parts.length - 1];
		}
		if (escapedDate && escapedDate !== 'null') {
			ret += " (" + escapedDate + "). ";
		} else {
			ret += " (s/f). ";
		}
		if (escapedTitle) {
			if (noformat) {
				ret += escapedTitle + '. ';
			} else {
				ret += '<i>' + escapedTitle + '</i>. ';
			}
		}
		if (!url) {
			url = str.AbsoluteUrl(' ');
		}
		var dt = new Date();
		ret += "Recuperado el " + dt.getDate() + " de " + str.GetMonthLabel(dt.getMonth()).toLowerCase() + ", " + dt.getFullYear();
		ret += ", de " + url;
		return ret;
	},
};

