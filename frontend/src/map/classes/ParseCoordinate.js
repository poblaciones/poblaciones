const Coordinates = require ('@/map/js/coordinate-parser/coordinates');

module.exports = function (str, d) {
	var result = {};

	try {
		position = new Coordinates(str);
		result.success = true;
		latitude = position.getLatitude(); // 40.123 ✓
		longitude = position.getLongitude(); // -74.123 ✓

		result.result = {
			y: latitude,
			x: longitude
		};
		lat = Math.round(latitude * 10000) / 10000;
		lng = Math.round(longitude * 10000) / 10000;
		result.display = `Latitud/Longitud: ${lat}, ${lng}.`;
	}
	catch (error) {
		result.success = false;
	}
	return result;
};
