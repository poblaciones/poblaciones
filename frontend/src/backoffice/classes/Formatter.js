const str = require('@/common/js/str');

module.exports = {
	absoluteUrl(url) {
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
			return host + url;
		} else {
			return null;
		}
	},
	formatDate(date) {
		if (date === null) {
			return '-';
		}
		var parsed = new Date(Date.parse(date));
		var mm = parsed.getMonth() + 1; // getMonth() is zero-based
		var dd = parsed.getDate();

		return [(dd>9 ? '' : '0') + dd,
					(mm > 9 ? '' : '0') + mm,
					parsed.getFullYear(),
         ].join('/');
	},
	formatColumn(column, varnameOnly) {
		if (column === null) {
			return '';
		}
		if (column.Label === '' || column.Label === null || column.Label === undefined) {
			if (column.Variable === undefined) {
				return column.Caption;
			} else {
				return column.Variable;
			}
		} else {
			if (varnameOnly) {
				return column.Variable;
			} else {
				return column.Variable + ' - ' + column.Label;
			}
		}
	},
	formatColumnText(column) {
		if (column.Label === '' || column.Label === null || column.Label === undefined) {
			if (column.Variable === undefined) {
				return column.Caption;
			} else {
				return column.Variable;
			}
		} else {
			return column.Label;
		}
	},
	formatColumnTooltip(column) {
		if (column.Label === '' || column.Label === null || column.Label === undefined) {
			return '';
		} else {
			return column.Label;
		}
	},
	formatFile(type, size, pages) {
		var pagesBlock = '';
		if (pages === 1) {
			pagesBlock = ', 1 página';
		} else if (pages !== null && pages !== undefined) {
			pagesBlock = ', ' + pages + ' páginas';
		}
		if (size > 1024 * 1024) {
			return type + ' (' + Math.round(size / 1024 / 1024 * 10) / 10 + ' mb' + pagesBlock + ')';
		} else {
			return type + ' (' + Math.round(size / 1024) + ' kb' + pagesBlock + ')';
		}
	},
	clone(src) {
		return JSON.parse(JSON.stringify(src));
	},
};

