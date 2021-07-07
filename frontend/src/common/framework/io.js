module.exports = {
	GetExtension(filename) {
		filename = filename || '';
		if(filename.includes('.') === false
			|| filename.startsWith('.')
			|| filename.endsWith('.')) {
			return '';
		}
		return filename.split('.').pop();
	},
	ExtensionIn(filename, extensions) {
		var ext = this.GetExtension(filename);
		return extensions.includes(ext);
	}
};

