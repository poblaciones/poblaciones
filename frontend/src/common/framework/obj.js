export default class obj {
	/**
	 * Crea un nuevo objeto copiando en los * valores los keys (si estos no existen).
	 * ej: (src: {'a': 1, 'b': 2, 'c': 3}, dst: {'c': 0}) => {'a': 'a', 'b': 'b', 'c': 0}
	 */
	static CloneNonExistentKeysToValues(src, dst) {
		var ret = dst;
		for (var k in src) {
			if(dst[k] !== undefined) {
				ret[k] = dst[k];
			} else {
				ret[k] = k;
			}
		}
		return ret;
	}

	static IsObject(obj) {
		return typeof obj === 'object'
			&& !Array.isArray(obj)
			&& obj !== null;
	}

};

