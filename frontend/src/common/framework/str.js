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

		const result = [];
		let currentLine = '';
		let currentWord = '';

		// Recorrer el texto caracter por caracter
		for (let i = 0; i < text.length; i++) {
			const char = text[i];

			// Si es un espacio o símbolo, es posible punto de corte
			if (/\s|[.,;:!?)\]}<>\/\\-]/.test(char)) {
				// Si añadir esta palabra excede el tamaño
				if ((currentLine + currentWord + char).length > size) {
					// Guardar línea actual y empezar nueva
					result.push(currentLine);
					currentLine = currentWord + char;
				} else {
					// Añadir palabra y separador a la línea actual
					currentLine += currentWord + char;
				}
				currentWord = '';
			} else {
				// Añadir caracter a la palabra actual
				currentWord += char;

				// Si la palabra actual es más grande que el tamaño permitido
				if (currentWord.length >= size) {
					// Si hay contenido en la línea actual, guardarla
					if (currentLine.length > 0) {
						result.push(currentLine);
						currentLine = '';
					}
					// Cortar la palabra y guardarla
					result.push(currentWord.substring(0, size));
					currentWord = currentWord.substring(size);
				}
			}
		}

		// Procesar la última palabra y línea
		if (currentWord.length > 0) {
			if ((currentLine + currentWord).length > size) {
				if (currentLine.length > 0) {
					result.push(currentLine);
				}
				result.push(currentWord);
			} else {
				result.push(currentLine + currentWord);
			}
		} else if (currentLine.length > 0) {
			result.push(currentLine);
		}

		return result.join('<br>');
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



String.prototype.removeHtmlRange = function(start, end) {
	return this.slice(start, end).removeHtml();
};

String.prototype.removeHtml = function() {
	return this.replace(/<\/?[^>]+(>|$)/g, "");
};

String.prototype.insert = function(index, str) {
	if (index === 0) {
		return str + this;
	}
	return this.slice(0, index) + str + this.slice(index);
};

String.prototype.replaceRange = function(start, end, str) {
	return this.slice(0, start) + str + this.slice(end);
};

