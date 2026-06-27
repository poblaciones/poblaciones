module.exports = {
	Split(cad, separator) {
		return (cad + '').split(separator);
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
	Plural(term, count) {
		if (count == 1) return term;

		if (term.endsWith('ión')) {
			return term.slice(0, -3) + 'iones';
		}
		if (term.endsWith('z')) {
			return term.slice(0, -1) + 'ces';
		}
		if (/[áéó]$/.test(term)) {
			return term + 's';
		}
		if (/[íú]$/.test(term)) {
			return term + 'es';
		}
		if (/[sx]$/.test(term)) {
			return term; // muchos casos son invariables
		}
		if (/[aeiou]$/.test(term)) {
			return term + 's';
		}
		return term + 'es';
	},
	PatternUrl(url, pattern, accessLink) {
		if (!accessLink) {
			// trata de aplicar la forma acortada...
			if (pattern && url && url.length > 0) {
				var idParts = this.Split(url, '/');
				var id = idParts[idParts.length - 1];
				return this.Replace(pattern, '{id}', id);
			}
		}
		return this.AbsoluteUrl(this.AppendAccessLink(url, accessLink));
	},
	AppendAccessLink(url, accessLink) {
		if (accessLink) {
			return url + '/' + accessLink;
		} else {
			return url;
		}
	},
	FormatFloat(n, places) {
		//TODO: CultureInfo
		return ('' + parseFloat(n.toFixed(places))).replace(".", ",");
	},
	AnyToLower(cad) {
		if (cad === null || cad === undefined) {
			return "";
		}
		return cad.toString().toLowerCase();
	},
	AppendParam(url, param, value) {
		var parts = url.split('#');
		var n = parts[0].indexOf('?');
		var separator = (n >= 0 ? '&' : '?');
		var ret = parts[0] + separator + param + "=" + value;
		if (parts.length > 1) {
			ret += "#" + parts[1];
		}
		return ret;
	},
	LowerFirstIfOnlyUpper(cad) {
		if (cad.length === 1 || cad.substring(1) === cad.substring(1).toLowerCase()) {
			return cad.toLowerCase();
		}
		return cad;
	},
	isNumeric(n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	},
	removeAccents(str) {
		return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
	},
	padZeros(num, length) {
		return num.toString().padStart(length, "0");
	},
	humanCompare(text1, text2) {
		// divide el texto en partes, trata números como números
		// evita acentos.
		var a = this.humanPrepare(text1);
		var b = this.humanPrepare(text2);
		return a.localeCompare(b);
	},
	humanPrepare(text) {
		var tokens = text.split(" ");
		// Procesar cada token
		const procesados = tokens.map((token) => {
			// Remover acentos si el token contiene caracteres acentuados
			var sinAcentos = this.removeAccents(token);

			// Si el token es un número, aplicar padding de ceros
			if (sinAcentos.startsWith("(") && sinAcentos.endsWith(")")) {
				sinAcentos = sinAcentos.substring(1, sinAcentos.length - 2);
			}
			if (sinAcentos.startsWith("{") && sinAcentos.endsWith("}")) {
				sinAcentos = sinAcentos.substring(1, sinAcentos.length - 2);
			}
			if (sinAcentos.startsWith("[") && sinAcentos.endsWith("]")) {
				sinAcentos = sinAcentos.substring(1, sinAcentos.length - 2);
			}
			if (sinAcentos.endsWith(".")) {
				sinAcentos = sinAcentos.substring(0, sinAcentos.length - 1);
			}

			const esNumero = /^\d+$/.test(sinAcentos);
			const tokenProcesado = esNumero ? this.padZeros(sinAcentos, 10) : sinAcentos;

			return tokenProcesado;
		});
		return procesados.join(" ");
	},
	isNumericFlex(n) {
		var t = '' + n;
		t = t.replaceAll(",", ".");
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
	IsIntegerGreaterThan(str, than) {
		let n = Number(str);
		return Number.isInteger(n) && n > than;
	},
	IsNumberGreaterThan(str, than) {
		let n = Number(str);
		return n > than;
	},
	IsIntegerGreaterThan0(str) {
		return this.IsIntegerGreaterThan(str, 0);
	},
	IsNumberGreaterThan0(str) {
		return this.IsNumberGreaterThan(str, 0);
	},
	AddDot(str) {
		if (str !== null && this.EndsWith(str, ".") === false) {
			return str + '.';
		} else {
			return str;
		}
	},
	RemoveDot(str) {
		if (str === null) {
			return null;
		}
		return str.replace(/\.$/, '');
	},
	applySymbols(cad) {
		return cad.replace('km2', 'km²');
	},
	Capitalize(cad) {
		if (cad.length === 0) {
			return cad;
		} else {
			return cad.charAt(0).toUpperCase() + cad.slice(1);
		}
	},
	Wrap(text, size) {
		if (!text || size <= 0) return text;

		// -------------------------------------------------
		// 1. Proteger abreviaturas con espacio: "10 pp.", "5 p.m."
		//    Reemplazamos ese espacio por un marcador temporal.
		// -------------------------------------------------
		const MARK = '§§S§§';
		const abbrs = ['pp', 'km', '%', '/'];
		let t = text;

		for (const a of abbrs) {
			let p = t.indexOf(' ' + a);
			while (p !== -1) {
				// Solo si antes del espacio hay un dígito
				if (p > 0 && t[p - 1] >= '0' && t[p - 1] <= '9') {
					t = t.slice(0, p) + MARK + t.slice(p + 1);
				}
				p = t.indexOf(' ' + a, p + 1);
			}
		}
		// -------------------------------------------------
		// 2. Dividir por espacios y armar líneas
		// -------------------------------------------------
		const words = t.split(' ');
		const out = [];
		let line = '';

		for (let i = 0; i < words.length; i++) {
			// Restaurar el espacio original en las abreviaturas
			const w = words[i].split(MARK).join(' ');
			const sep = line.length > 0 ? ' ' : '';
			const cand = line + sep + w;

			if (cand.length <= size) {
				// Cabe en la línea actual
				line = cand;
			} else {
				// No cabe: guardar línea actual
				if (line.length > 0) {
					out.push(line);
				}

				// Si la palabra sola es más ancha que el límite, la partimos
				if (w.length > size) {
					for (let k = 0; k < w.length; k += size) {
						out.push(w.slice(k, k + size));
					}
					line = '';
				} else {
					// Empieza una línea nueva con esta palabra
					line = w;
				}
			}
		}
		if (line.length > 0) {
			out.push(line);
		}
		return out.join('<br>');
	},
	EscapeHtml(unsafe) {
		return ('' + unsafe)
			.replaceAll(/&/g, "&amp;")
			.replaceAll(/</g, "&lt;")
			.replaceAll(/>/g, "&gt;")
			.replaceAll(/"/g, "&quot;")
			.replaceAll(/'/g, "&#039;");
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
	StartsWith(cad, part, pos) {
		return cad.startsWith(part, pos);
		// return cad.lastIndexOf(part, 0) === 0;
	},
	EndsWith(cad, part, len) {
		return cad.endsWith(part, len);
		// return cad.indexOf(part, cad.length - part.length) !== -1;
	},
	Contains(cad, part, pos) {
		return cad.includes(part, pos);
		// return cad.indexOf(part) !== -1;
	},
	GetHashCode(str) {
		var hash = 0;
		for (var i = 0; i < str.length; i++) {
			var character = str.charCodeAt(i);
			hash = ((hash << 5) - hash) + character;
			hash = hash & hash; // Convert to 32bit integer
		}
		return hash;
	},
	// Versión modificada quitando los caracteres que sería raro tenga un mail...
	// no valida mail que tengan: !#$%&'*/=?^`{|}~
	IsEmail(email) {
		// see: http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
		const re = /^[a-zA-Z0-9+_\-]+(?:\.[a-zA-Z0-9+_\-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?$/;
		// Versión original de la función de validación
		// const re = /^[a-zA-Z0-9!#$%&'*+\/=?\^_`{|}~\-]+(?:\.[a-zA-Z0-9!#$%&'\*+\/=?\^_`{|}~\-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?$/;
		return re.test(email);
	},
	QuoteAttr(s, preserveCR) {
		preserveCR = preserveCR ? '&#13;' : '\n';
		return ('' + s) // Forces the conversion to string.
			.replace(/&/g, '&amp;') // This MUST be the 1st replacement.
			.replace(/'/g, '&apos;') // The 4 other predefined entities, required.
			.replace(/"/g, '&quot;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			// otros replaces...
			.replace(/\r\n/g, preserveCR) // Must be before the next replacement.
			.replace(/[\r\n]/g, preserveCR);
	},
};
