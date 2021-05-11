import m from '@/public/js/Mercator';

var multi = require('multigeojson');

export default SvgMake;

function SvgMake() {}


SvgMake.prototype.SvgMake = function () {
	this.textStyle = '';
	this.textInTile = [];
};

SvgMake.prototype.ConvertGeometry = function (geom) {
	var t = geom.type;
	switch (t) {
		case "Polygon":
			return this.polygon(geom);
		case "MultiPolygon":
			return this.multiPolygon(geom);
		case "MultiPoint":
			return this.multiPoint(geom);
		case "LineString":
			return this.lineString(geom);
		case "MultiLineString":
			return this.multiLineString(geom);
		case "Point":
			return this.point(geom);
		default:
			return null;
  }
};

SvgMake.prototype.getCoordString = function (coords) {
// NO REDUCIDO
	const TILE_PRJ_SIZE = 8192;

	var coordStr = coords.map(function (coord) {
		return coord[0] + ',' + (TILE_PRJ_SIZE - coord[1]);
	});
	return coordStr.join(' ');
};

SvgMake.prototype.getCoordStringEx = function (coords) {
	var scale = m.TILE_PRJ_SIZE / 256;
	var coordStr = coords.map(function (coord) {
		return (coord[0] / scale) + ',' + (256 - (coord[1] / scale));
	});
	return coordStr.join(' ');
};

SvgMake.prototype.addAttributes = function (ele, attributes) {
	var part = ele.split('/>')[0];
	for (var key in attributes) {
		if (attributes[key]) {
			part += ' ' + key + '="' + attributes[key] + '"';
		}
	}
	return part + ' />';
};

SvgMake.prototype.point = function (geom, opt) {
	var r = opt && opt.r ? opt.r : 1;
	var pointAsCircle = opt && opt.hasOwnProperty('pointAsCircle')
		? opt.pointAsCircle : false;
	var coords = this.getCoordString([geom.coordinates], origin);
	if (pointAsCircle) {
		return [coords];
	} else {
		return [
			'M' + coords
			+ ' m' + -r + ',0' + ' a' + r + ',' + r + ' 0 1,1 ' + 2 * r + ',' + 0
			+ ' a' + r + ',' + r + ' 0 1,1 ' + -2 * r + ',' + 0
		];
	}
};

SvgMake.prototype.multiPoint = function (geom) {
	var paths = multi.explode(geom).map(function (single) {
		return this.point(single);
	});
	return paths.join(' ');
};

SvgMake.prototype.lineString = function(geom) {
var coords = this.getCoordString(geom.coordinates);
var path = 'M'+ coords;
return path;
};

SvgMake.prototype.multiLineString = function(geom) {
var paths = multi.explode(geom).map(function(single) {
  return this.lineString(single);
});
return paths.join(' ');
};

SvgMake.prototype.polygon = function(geom) {
var mainStr,holes;
mainStr = this.getCoordString(geom.coordinates[0]);
if (geom.coordinates.length > 1) {
  holes = geom.coordinates.slice(1, geom.coordinates.length);
}
var path = 'M'+ mainStr;
if(holes) {
  for(var i=0;i<holes.length; i++) {
    path += ' M' + this.getCoordString(holes[i]);
  }
}
path += 'Z';
return path;
};

SvgMake.prototype.multiPolygon = function (geom) {
	var loc = this;
	var paths = multi.explode(geom).map(function (single) {
		return loc.polygon(single);
	});
	return paths.join(' ').replace(/Z/g, '') + 'Z';
};

