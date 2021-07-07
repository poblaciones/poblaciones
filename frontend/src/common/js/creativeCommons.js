const Str = require('@/common/framework/str');

module.exports = {
	ResolveUrl(entity) {
		// pattern: https://creativecommons.org/licenses/by/2.5/ar/
		var ret = 'https://creativecommons.org/licenses/by';
		var licenseType = entity['licenseType'];
		var licenseVersion = entity['licenseVersion'];
		var licenseCommercial = entity['licenseCommercial'];
		var licenseOpen = entity['licenseOpen'];
		if (licenseType === '0' || licenseType === 0) {
			return '';
		}
		if (licenseCommercial !== '1' && licenseCommercial !== 1) {
			ret += '-nc';
		}
		if (licenseOpen === 'never') {
			ret += '-nd';
		} else {
			if (licenseOpen === 'same') {
				ret += '-sa';
			}
		}
		ret += '/' + licenseVersion;
		return ret;
	},

	GetLicenseImageByUrl(url, extension = 'png') {
		if (this.UrlIsCC(url) === false) {
			return '';
		}
		var availables = ['by', 'by-nc', 'by-nc-nd', 'by-nc-sa', 'by-nd', 'by-sa'];
		for (var n = 0; n < availables.length; n++) {
			var image = availables[n];
			if (Str.Contains(url, '/' + image + '/')) {
				return '/static/img/licenses/cc/' + image + '.' + extension;
			}
		}
		return '';
	},

	UrlIsCC(url) {
		return (Str.StartsWith(url, 'http://creativecommons.') ||
			Str.StartsWith(url, 'http://www.creativecommons.') ||
			Str.StartsWith(url, 'https://creativecommons.') ||
			Str.StartsWith(url, 'https://www.creativecommons.'));
	}

};
