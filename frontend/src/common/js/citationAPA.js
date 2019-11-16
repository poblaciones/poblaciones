const str = require('@/common/js/str');

module.exports = {
	onlineMapCitation(escapedAuthor, escapedDate, escapedTitle, url, noformat) {
			var ret = escapedAuthor;
			if (str.Contains(escapedDate, "/")) {
				var parts = str.Split(escapedDate, '/');
				escapedDate = parts[parts.length - 1];
			}
			if (escapedDate) {
				ret += " (" + escapedDate + "). ";
			} else {
				ret += " (s/f). ";
			}
			if (noformat) {
				ret += escapedTitle + '. ';
			} else {
				ret += '<i>' + escapedTitle + '</i>. ';
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

