const TWEEN = require('@tweenjs/tween.js');
const str = require('@/common/framework/str');

module.exports = {
	trimNumberCoords(n) {
		return parseFloat(Number('' + n).toFixed(6));
	},
	formatPercent(num, tot) {
		if (num === '') {
			return '-';
		}
		if (tot === 0) {
			return '-';
		}
		return Number(Number(num) / Number(tot) * 100).toFixed(1).toLocaleString('es');
	},
	capitalize(cad) {
		if (cad === null || cad === undefined || cad === '') {
			return cad;
		} else {
			return cad.charAt(0).toUpperCase() + cad.slice(1);
		}
	},
	divsOverlap(div1, div2) {
		var x1 = div1.offset().left;
		var y1 = div1.offset().top;
		var h1 = div1.outerHeight(true);
		var w1 = div1.outerWidth(true);
		var b1 = y1 + h1;
		var r1 = x1 + w1;
		var x2 = div2.offset().left;
		var y2 = div2.offset().top;
		var h2 = div2.outerHeight(true);
		var w2 = div2.outerWidth(true);
		var b2 = y2 + h2;
		var r2 = x2 + w2;

		if (b1 < y2 || y1 > b2 || r1 < x2 || x1 > r2) {
			return false;
		}
		return true;
	},
	renderTooltip(feature) {
		var caption = null;
		var value = null;
		if (feature.value) {
			var varName = window.SegMap.GetVariableName(feature.parentInfo.MetricId, feature.parentInfo.VariableId);
			value = (str.EscapeHtml(varName) + '').trim() + ': ' + feature.value;
		}
		if (feature.description) {
			caption = feature.description;
		}
		var divider = (value !== null ? 'tpValueTitle' : '');
		var html = '';
		if (caption) {
			html = "<div class='" + divider + "'>" + str.EscapeHtml(caption) + '</div>';
		}
		if (value) {
			html += '<div>' + value + '</div>';
		}
		if (html === '') {
			html = null;
		}
		return html;
	},
	calculateCompareValue(useProportionalDelta, totalTuple, compareTuple) {
		var value1 = this.calculateValue(totalTuple);
		var value2 = this.calculateValue(compareTuple);
		if (useProportionalDelta) {
			if (value2 === 0) {
				return '';
			} else {
				return (value1 / value2) * 100 - 100;
			}
		} else {
			return value1 - value2;
		}
	},
	calculateValue(tuple) {
		if (tuple.normalization == 0) {
			return 0;
		} else if (tuple.normalization === undefined || tuple.normalization === null) {
			return tuple.value;
		} else {
			return tuple.value / tuple.normalization;
		}
	},
	renderMetricValue(value, total, hasTotals, normalizationScale, decimals) {
		if (value === '-') {
			return '-';
		}
		var calculatedValue;
		if (hasTotals) {
			calculatedValue = (total > 0 ? value * normalizationScale / total : 0);
		} else {
			calculatedValue = value;
		}
		return this.getValueFormatted(calculatedValue, hasTotals, decimals);
	},
	getValueFormatted(value, hasTotals, decimals) {
		if (value === '-') {
			return '-';
		} else if (hasTotals) {
			return this.formatPercentNumber(value);
		} else {
			return this.formatNum(value, decimals);
		}
	},
	formatPercentNumber(num) {
		if (num === '') {
			return '-';
		}
		return Number(num).toFixed(1).toLocaleString('es');
	},
	ResolveNormalizationCaption(variable, preffixN) {
		var pref = (preffixN ? ' N' : '');
		if (variable.Normalization === null) {
			return pref;
		}
		var unit = this.ResolveNormalizationUnit(variable);
		var ret = '';
		switch (variable.NormalizationScale) {
			case 100:
				ret = '%';
				break;
			case 1:
				ret = '';
				break;
			case 1000:
				ret = ' / mil ' + unit;
				break;
			case 10000:
				ret = ' / 10 mil ' + unit;
				if (unit === 'm²')
					ret = ' / ha';
				break;
			case 100000:
				ret = ' / 100 mil ' + unit;
				if (unit === 'm²')
					ret = ' / ,1 km²';
				break;
			case 1000000:
				ret = ' / millón de ' + unit;
				if (unit === 'm²')
					ret = ' / km²';
				break;
		}
		if (ret !== '%') {
			ret = pref + ret;
		}
		return ret.trimLeft();
	},
	ResolveNormalizationUnit(variable) {
		switch (variable.Normalization) {
			case 'P':
				return 'hab.';
			case 'H':
				return 'hog.';
			case 'A':
				return 'adultos';
			case 'C':
				return 'niños';
			case 'P':
				return 'hab.';
			case 'H':
				return 'hog.';
			case 'N':
				return '';
			case 'M':
				return 'm²';
			case 'O':
				return (variable.NormalizationColumn ? variable.NormalizationColumn.Caption : '');
			default:
				return 'unidad no reconocida';
		}
	},
	ensureFinalDot(str) {
		str = (str + '').trim();
		if (str.length > 0 && str.substr(str.length - 1) !== '.') {
			return str + '.';
		}
		return str;
	},
	ensureFinalBar(urlPath) {
		if (urlPath.length === 0 || urlPath.substr(urlPath.length - 1, 1) !== '/') {
			urlPath += '/';
		}
		return urlPath;
	},
	formatKm(num) {
		function isInteger(value) {
			// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger
			return typeof value === 'number'
				&& isFinite(value)
				&& Math.floor(value) === value;
		};
		if (num === '') {
			return '-';
		}
		var ret = Number(num);
		if (isInteger(ret) === false) {
			if (ret > 10) {
				return Number(Math.round(ret)).toLocaleString('es');
			}
			if (ret > 0.5) {
				return Number(ret).toFixed(1).replace('.', ',');
			}
			if (ret > 0.05) {
				return Number(ret).toFixed(2).replace('.', ',');
			}
			return Number(ret).toLocaleString('es');
		}
		return Number(ret).toLocaleString('es');
	},
	formatNum(num, decimals = 0) {
		if (num === '' || num === '-') {
			return '-';
		} else if (num === 'n/d') {
			return 'n/d';
		} else {
			var n = Number(num);
			n = +n.toFixed(decimals);
			return n.toLocaleString('es');
		}
	},
	animateNum(vm, element, newValue, oldValue, formatMode, decimals) {
		var fix = 0;
		var format = null;
		if (formatMode === 'km') {
			format = this.formatKm;
			fix = 2;
		} else if (formatMode && formatMode.substr(0, 1) === '%') {
			format = this.formatPercent;
			fix = 2;
		} else {
			format = this.formatNum;
			fix = decimals;
		}
		if (newValue === '' || newValue === '-' || newValue === 'n/d' || oldValue === '' || oldValue === 'n/d' || oldValue === '-') {
			vm[element] = this.quickFormat(format, fix, newValue, true);
			return;
		}
		var loc = this;
		function animate() {
			if (TWEEN.update()) {
				requestAnimationFrame(animate);
			}
		};
		new TWEEN.Tween({ tweeningNumber: oldValue })
			.easing(TWEEN.Easing.Quadratic.Out)
			.to({ tweeningNumber: newValue }, 500)
			.onUpdate(function (object) {
				var number = loc.quickFormat(format, fix, object.tweeningNumber, true);
				vm[element] = number;
			})
			.start();

		animate();
	},
	extractFileExtension(file) {
		if(file.indexOf('.') == -1) {
			return '';
		}
		return file.split(".").pop().toLowerCase();
	},
	extractFilename(file) {
		var ext = this.extractFileExtension(file);
		if (ext.length > 0) {
			ext = '.' + ext;
		}
		return file.substr(0, file.length - ext.length);
	},
	quickFormat(format, fix, number, tolerantOnZero) {
		if (number === '' || number === '-' || number === 'n/d') {
			return number;
		}
		var numberFormatted = Number(number).toFixed(fix);
		if (tolerantOnZero && parseFloat(numberFormatted) === 0)
			numberFormatted = Number(number).toFixed(fix + 2);

		return format(numberFormatted, 100);
	},
	l(a, b, c, d, e, f, g, h) {
		if(a === undefined) { return; }
		if(b === undefined) { console.log(a); return; }
		if(c === undefined) { console.log(a, b); return; }
		if(d === undefined) { console.log(a, b, c); return; }
		if(e === undefined) { console.log(a, b, c, d); return; }
		if(f === undefined) { console.log(a, b, c, d, e); return; }
		if(g === undefined) { console.log(a, b, c, d, e, f); return; }
		if(h === undefined) { console.log(a, b, c, d, e, f, g); return; }
		console.log(a, b, c, d, e, f, g, h);
	},
	qualifyURL(url) {
		var a = document.createElement('a');
		a.href = url;
		return a.href;
	},
	getCenter(geometry) {
		var bounds = new window.google.maps.LatLngBounds();
		geometry.forEachLatLng(function (coords) {
			bounds.extend(new window.google.maps.LatLng(coords.lat(), coords.lng()));
		});
		return bounds.getCenter();
	},
	parseSingleLetterArgs(text) {
		var ret = {};
		var parts = text.split('!');
		for (var l = 0; l < parts.length; l++) {
			if (parts[l].length > 1) {
				var key = parts[l].substring(0, 1);
				ret[key] = parts[l].substring(1);
			}
		}
		return ret;
	},
	getSafeValueBool(arr, key, def) {
		var ret = this.getSafeValue(arr, key, def);
		if (ret !== def) {
			ret = (ret && ret !== '0');
		}
		return ret;
	},
	removeAllChildren(e) {
		var child = e.lastElementChild;
    while (child) {
        e.removeChild(child);
        child = e.lastElementChild;
    }
	},
	removeAllChildrenButOne(e, exception) {
		for (var n = e.childNodes.length - 1; n >= 0; n--) {
			if (e.childNodes[n] !== exception) {
				e.removeChild(e.childNodes[n]);
			}
		}
	},
	getVariableFrameKey(v, x, y, z) {
		var args = 'v=' + v + '&' + this.getFrameKey(x, y, z);
		return args;
	},
	getFrameKey(x, y, z) {
		var args = 'x=' + x + '&y=' + y + '&z=' + z;
		return args;
	},
	getSafeValue(arr, key, def) {
		if (key in arr) {
			return arr[key];
		}
		if (def === undefined) {
			throw new Error('Parámetro no válido.');
		}
		return def;
	},
	getSafeValueInt(arr, key, def) {
		if (key in arr) {
			return parseInt(arr[key]);
		}
		if (def === undefined) {
			throw new Error('Parámetro no válido.');
		}
		return def;
	},
	getGeojsonCenter(feature) {
		var bounds = new window.google.maps.LatLngBounds();
		var polygons = feature.geometry.coordinates;
		if (feature.geometry.type === 'Point') {
			this.getPolygonCoords([[polygons]], bounds);
		} else if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'LineString') {
			this.getPolygonCoords(polygons, bounds);
		} else if (feature.geometry.type === 'MultiPolygon' || feature.geometry.type === 'MultiLineString') {
			for (var p = 0; p < polygons.length; p++) {
				this.getPolygonCoords(polygons[p], bounds);
			}
		} else {
			throw new Error('Tipo de geomeptry no válido (' + feature.geometry.type + ').');
		}
		return bounds.getCenter();
	},
	getPolygonCoords(polygon, bounds) {
		for (var r = 0; r < polygon.length; r++) {
			for (var i = 0; i < polygon[r].length; i++) {
				bounds.extend(new window.google.maps.LatLng(polygon[r][i][1], polygon[r][i][0]));
			}
		}
	},
	getMetric(metrics, id) {
		var res = null;
		metrics.forEach(function(metric) {
			if(metric.Metric.Id === id) {
				res = metric;
				return;
			}
		});
		return res;
	},
	getVariable(variables, id) {
		var res = null;
		variables.forEach(function(variable) {
			if(variable.Id === id) {
				res = variable;
				return;
			}
		});
		return res;
	},
	getValueLabel(valueLabels, id) {
		var res = null;
		valueLabels.forEach(function(valueLabel) {
			if(valueLabel.Id === id) {
				res = valueLabel;
				return;
			}
		});
		return res;
	},
	getLevel(levels, id) {
		var res = null;
		levels.forEach(function(level) {
			if(level.Id === id) {
				res = level;
				return;
			}
		});
		return res;
	},
	getCreateClippingParams(frame, clipping, revision, suffix) {
		var levelId = null;
		if (clipping.Region.Levels && clipping.Region.SelectedLevelIndex < clipping.Region.Levels.length) {
			levelId = clipping.Region.Levels[clipping.Region.SelectedLevelIndex].Id;
		}
		return this.mergeObject({
			a: levelId, w: revision, h: suffix
		}, this.getFrameParams(frame));
	},
	getCreateClippingParamsByName(frame, name, revision, suffix) {
		return this.mergeObject({
			n: name, w: revision, h: suffix
		}, this.getFrameParams(frame));
	},
	getLabelsParams(frame, x, y, revision, suffix) {
		var ret = {
			x: x,
			y: y,
			z: frame.Zoom,
			w: revision,
			h: suffix
		};
		return ret;
	},
	getBlockLabelsParams(frame, x, y, revision, suffix, size) {
		var ret = {
			x: x - x % size,
			y: y - y % size,
			s: size,
			z: frame.Zoom,
			w: revision,
			h: suffix
		};
		return ret;
	},
	urlParam(paramName, paramValue) {
		if (!paramValue) {
			return '';
		}
		return "&" + paramName + "=" + encodeURI(paramValue);
	},
	addListener(element, eventName, handler) {
		if (element.addEventListener) {
			element.addEventListener(eventName, handler, false);
		} else if (element.attachEvent) {
			element.attachEvent('on' + eventName, handler);
		} else {
			element['on' + eventName] = handler;
		}
	},
	getBoundaryParams(boundary, frame, x, y, rev, suffix) {
		var ret = this.mergeObject({
			a: boundary.properties.Id,
			x: x,
			y: y,
			w: rev,
			h: suffix
		}, this.getFrameParams(frame));
		ret.e = null;
		return ret;
	},
	getTileParams(metric, frame, x, y, suffix) {
		const ver = metric.Versions[metric.SelectedVersionIndex];
		if (metric.Compare.Active) {
			compare = metric.Compare.SelectedLevel().Id;
		} else {
			compare = null;
		}
		var ret = this.mergeObject({
			l: metric.Metric.Id,
			v: ver.Version.Id,
			a: ver.Levels[ver.SelectedLevelIndex].Id,
			u: metric.SelectedUrbanity,
			g: metric.EffectivePartition,
			p: compare,
			x: x,
			y: y,
			w: metric.Metric.Signature,
			h: suffix
		}, this.getFrameParams(frame));
		ret.e = null;
		return ret;
	},
	getLayerDataParams(metric, frame) {
		const ver = metric.Versions[metric.SelectedVersionIndex];
		var ret = this.mergeObject({
			l: metric.Metric.Id,
			v: ver.Version.Id,
			a: ver.Levels[ver.SelectedLevelIndex].Id,
			u: metric.SelectedUrbanity,
			g: metric.EffectivePartition,
			w: metric.Metric.Signature
		}, this.getFrameParams(frame));
		delete ret.e;
		delete ret.z;
		ret.e = null;
		return ret;
	},
	getBlockTileParams(metric, frame, x, y, suffix, size) {
		const ver = metric.Versions[metric.SelectedVersionIndex];
		var ret = this.mergeObject({
			l: metric.Metric.Id,
			v: ver.Version.Id,
			a: ver.Levels[ver.SelectedLevelIndex].Id,
			u: metric.SelectedUrbanity,
			g: metric.EffectivePartition,
			x: x - x % size,
			y: y - y % size,
			s: size,
			w: metric.Metric.Signature,
			h: suffix
		}, this.getFrameParams(frame));
		ret.e = null;
		return ret;
	},
	resolveMultiUrl(servers, path) {
		if (!Array.isArray(servers)) {
			return servers + path;
		}
		var ret = [];
		for (var n = 0; n < servers.length; n++) {
			ret.push(servers[n] + path);
		}
		return ret;
	},
	selectMultiUrl(url, seed) {
		if (!Array.isArray(url)) {
			// tiene múltiples fuentes
			return url;
		}
		if (url.length === 1) {
			return url[0];
		}
		var pos;
		if (seed) {
			if (Array.isArray(seed)) {
				seed = seed[0];
			}
			pos = Math.floor(Math.floor(seed) % url.length);
		} else {
			pos = Math.floor(Math.random() * url.length);
		}
		return url[pos];
	},
	getRankingParams(activeMetric, frame, size, direction, hiddenValueLabels) {
		const metric = activeMetric.properties;
		const ver = metric.Versions[metric.SelectedVersionIndex];
		const level = ver.Levels[ver.SelectedLevelIndex];
		const variable = level.Variables[level.SelectedVariableIndex];
		if (activeMetric.Compare.Active) {
			compare = activeMetric.Compare.SelectedLevel().Id;
		} else {
			compare = null;
		}
		return this.mergeObject({
			l: metric.Metric.Id,
			v: ver.Version.Id,
			a: level.Id,
			i: variable.Id,
			t: (variable.HasTotals ? 1 : 0),
			u: metric.SelectedUrbanity,
			g: metric.EffectivePartition,
			w: metric.Metric.Signature,
			s: size,
			d: direction,
			h: hiddenValueLabels,
			p: compare
		}, this.getFrameParams(frame));
	},
	getNavigationParams(metric, frame, hiddenValueLabels) {
		const ver = metric.Versions[metric.SelectedVersionIndex];
		const level = ver.Levels[ver.SelectedLevelIndex];
		const variable = level.Variables[level.SelectedVariableIndex];
		return this.mergeObject({
			l: metric.Metric.Id,
			i: variable.Id,
			u: metric.SelectedUrbanity,
			g: metric.EffectivePartition,
			w: metric.Metric.Signature,
			h: (hiddenValueLabels ? hiddenValueLabels : null)
		}, this.getFrameParams(frame));
	},
	getSummaryParams(metric, frame) {
		const ver = metric.properties.Versions[metric.properties.SelectedVersionIndex];
		if (metric.Compare.Active) {
			compare = metric.Compare.SelectedLevel().Id;
		} else {
			compare = null;
		}
		return this.mergeObject({
			l: metric.properties.Metric.Id,
			v: ver.Version.Id,
			a: ver.Levels[ver.SelectedLevelIndex].Id,
			u: metric.properties.SelectedUrbanity,
			g: metric.properties.EffectivePartition,
			w: metric.properties.Metric.Signature,
			p: compare
		}, this.getFrameParams(frame));
	},
	getBoundarySummaryParams(boundary, frame, rev, suffix) {
		return this.mergeObject({
			b: boundary.Id,
			w: rev,
			h: suffix
		}, this.getFrameParams(frame));
	},
	getFrameParams(frame) {
		var ret = {
			e: this.getEnvelopeParam(frame.Envelope),
			z: frame.Zoom,
		};
		if(frame.ClippingRegionIds) {
			ret.r = (frame.ClippingRegionIds ? frame.ClippingRegionIds.join(',') : null);
		}
		if(this.hasCircle(frame.ClippingCircle)) {
			ret.c = this.getCircleParam(frame.ClippingCircle);
		}
		if (ret.r || ret.c) {
			ret.e = null;
		}
		return ret;
	},
	hasCircle(circle) {
		if(circle === null
			|| circle.Center === null
			|| circle.Radius === null
			|| circle.Center.Lat === 0
			|| circle.Center.Lon === 0
			|| circle.Radius.Lat === 0
			|| circle.Radius.Lon === 0) {
			return false;
		}
		return true;
	},
	getCircleParam(circle) {
		return circle.Center.Lat + ',' + circle.Center.Lon
			+ ';' + circle.Radius.Lat + ',' + circle.Radius.Lon;
	},
	getEnvelopeParam(envelope) {
		return envelope.Min.Lat + ',' + envelope.Min.Lon
			+ ';' + envelope.Max.Lat + ',' + envelope.Max.Lon;
	},
	scaleEnvelope(envelope, scale) {
		scale = 1 - ((1 - scale) / 2);

		var center = {
			Lat: (envelope.Max.Lat + envelope.Min.Lat) / 2,
			Lon: (envelope.Max.Lon + envelope.Min.Lon) / 2,
		};
		return {
			Min: {
				Lat: center.Lat - (center.Lat - envelope.Min.Lat) * scale,
				Lon: center.Lon - (center.Lon - envelope.Min.Lon) * scale,
			},
			Max: {
				Lat: center.Lat + (envelope.Max.Lat - center.Lat) * scale,
				Lon: center.Lon + (envelope.Max.Lon - center.Lon) * scale,
			}
		};
	},
	mergeObject(obj1, obj2) {
		var ret = {};
		for (let attr in obj1) { ret[attr] = obj1[attr]; }
		for (let attr in obj2) { ret[attr] = obj2[attr]; }
		return ret;
	},
	getScaleFactor(zoom) {
		return Math.pow(2, (zoom / 3));
	},
	getPosition(event) {
		var location = null;
		if (event.layerPoint) {
			// es leaflet
			return {
				Coordinate: {
					Lat: event.latlng.lat,
					Lon: event.latlng.lng
				},
				Point: {
					X: event.originalEvent.clientX,
					Y: event.originalEvent.clientY,
				}
			};
		} else {
			for (var property in event) {
				if (event.hasOwnProperty(property)) {
					// do stuff
					if (event[property].clientX !== undefined) {
						location = event[property];
						break;
					}
				}
			}
			return {
				Coordinate: {
					Lat: event.latLng.lat(),
					Lon: event.latLng.lng()
				},
				Point: {
					X: location.clientX,
					Y: location.clientY,
				}
			};
		}
	},
};

