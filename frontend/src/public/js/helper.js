var TWEEN = require('@tweenjs/tween.js');

module.exports = {
	trimNumber(n) {
		return parseFloat(n.toFixed(6));
	},
	formatPercent(num, tot) {
		if (num === '') {
			return '-';
		}
		if (tot === 0) {
			return '-';
		} else {
			return Number(Number(num) / Number(tot) * 100).toFixed(1).toLocaleString('es');
		}
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

		if (b1 < y2 || y1 > b2 || r1 < x2 || x1 > r2) return false;
		return true;
	},
	formatPercentNumber(num) {
		if (num === '') {
			return '-';
		}
		return Number(num).toFixed(1).toLocaleString('es');
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
			return typeof value === 'number' &&
				isFinite(value) &&
				Math.floor(value) === value;
		};
		if (num === '') {
			return '-';
		}
		var ret = Number(num);
		if (isInteger(ret) === false)	{
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
		if (num === '') {
			return '-';
		} else {
			var n = Number(num);
			n = +n.toFixed(decimals);
			return n.toLocaleString('es');
		}
	},
	animateNum(vm, element, newValue, oldValue, format) {
		var fix = 0;
		if(format === 'km') {
			format = this.formatKm;
			fix = 1;
		} else if (format && format.substr(0, 1) === '%') {
			format = this.formatPercent;
			fix = 2;
		} else {
			format = this.formatNum;
		}
		if (newValue === '' || newValue === '-' || newValue === 'n/d' || oldValue === '' || oldValue === 'n/d' || oldValue === '-') {
			vm[element] = this.quickFormat(format, fix, newValue);
			return;
		}
		var loc = this;
		function animate () {
			if (TWEEN.update()) {
				requestAnimationFrame(animate);
			}
		};
		new TWEEN.Tween({ tweeningNumber: oldValue })
			.easing(TWEEN.Easing.Quadratic.Out)
			.to({ tweeningNumber: newValue }, 500)
			.onUpdate(function (object) {
				var number = loc.quickFormat(format, fix, object.tweeningNumber);
				vm[element] = number;
			})
			.start();

		animate();
	},
	quickFormat(format, fix, number) {
		if (number === '' || number === '-' || number === 'n/d') {
			return number;
		}
		number = Number(number).toFixed(fix);
		return format(number, 100);
	},
	l(a, b, c, d, e, f, g, h) {
		if(a === undefined) { a = ''; }
		if(b === undefined) { b = ''; }
		if(c === undefined) { c = ''; }
		if(d === undefined) { d = ''; }
		if(e === undefined) { e = ''; }
		if(f === undefined) { f = ''; }
		if(g === undefined) { g = ''; }
		if(h === undefined) { h = ''; }
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
	getSafeValue(arr, key, def) {
		if (key in arr) {
			return arr[key];
		} else {
			return def;
		}
	},
	getGeojsonCenter(feature) {
		var bounds = new window.google.maps.LatLngBounds();
		var polygons = feature.geometry.coordinates;
		if (feature.geometry.type === 'Point') {
			this.getPolygonCoords([[polygons]], bounds);
		} else if (feature.geometry.type === 'Polygon') {
			this.getPolygonCoords(polygons, bounds);
		} else {
			if (feature.geometry.type === 'MultiPolygon') {
				for (var p = 0; p < polygons.length; p++) {
					this.getPolygonCoords(polygons[p], bounds);
				}
			}
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
	getCreateClippingParams(frame, clipping, revision) {
		var levelId = null;
		if (clipping.Region.Levels && clipping.Region.SelectedLevelIndex < clipping.Region.Levels.length) {
			levelId = clipping.Region.Levels[clipping.Region.SelectedLevelIndex].Id;
		}
		return this.mergeObject({
			a: levelId, w: revision
		}, this.getFrameParams(frame));
	},
	getCreateClippingParamsByName(frame, name, revision) {
		return this.mergeObject({
			n: name, w: revision
		}, this.getFrameParams(frame));
	},
	getLabelsParams(frame, x, y, boundsRectRequired, revision) {
		var ret = {
			x: x,
			y: y,
			z: frame.Zoom,
			w: revision
		};
		if (boundsRectRequired) {
			ret.b = boundsRectRequired;
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
	getTileParams(metric, frame, x, y, boundsRectRequired) {
		const ver = metric.Versions[metric.SelectedVersionIndex];
		var ret = this.mergeObject({
			l: metric.Metric.Id,
			v: ver.Version.Id,
			a: ver.Levels[ver.SelectedLevelIndex].Id,
			u: metric.SelectedUrbanity,
			x: x,
			y: y,
			w: metric.Metric.Revision
		}, this.getFrameParams(frame));
		ret.e = null;
		if (boundsRectRequired) {
			ret.b = boundsRectRequired;
		};
		return ret;
	},
	getSummaryParams(metric, frame, revision) {
		const ver = metric.Versions[metric.SelectedVersionIndex];
		return this.mergeObject({
			l: metric.Metric.Id,
			v: ver.Version.Id,
			a: ver.Levels[ver.SelectedLevelIndex].Id,
			u: metric.SelectedUrbanity,
			w: metric.Metric.Revision
		}, this.getFrameParams(frame));
	},
	getFrameParams(frame) {
		var ret = {
			e: this.getEnvelopeParam(frame.Envelope),
			f: frame.ClippingFeatureId,
			z: frame.Zoom,
		};
		if(frame.ClippingRegionId) {
			ret.r = frame.ClippingRegionId;
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
		if(circle === null ||
			circle.Center === null ||
			circle.Radius === null ||
			circle.Center.Lat === 0 ||
			circle.Center.Lon === 0 ||
			circle.Radius.Lat === 0 ||
			circle.Radius.Lon === 0) {
			return false;
		}
		return true;
	},
	getCircleParam(circle) {
		return circle.Center.Lat + ',' + circle.Center.Lon +
			';' + circle.Radius.Lat + ',' + circle.Radius.Lon;
	},
	getEnvelopeParam(envelope) {
		return envelope.Min.Lat + ',' + envelope.Min.Lon +
			';' + envelope.Max.Lat + ',' + envelope.Max.Lon;
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
	},
};

