import L from 'leaflet';
import axiosClient from '@/common/js/axiosClient';

var GeographyOverlay = L.GridLayer.extend({

	initialize: function (geographyId, options) {
		this.geographyId = geographyId;
		L.GridLayer.prototype.initialize.call(this, L.extend({ tileSize: 256 }, options));

		this.on('tileunload', function (e) {
			if (e.tile._geoJsonLayer && this._map) {
				this._map.removeLayer(e.tile._geoJsonLayer);
				e.tile._geoJsonLayer = null;
			}
		});
	},

	createTile: function (coords) {
		var tile = document.createElement('div');
		var size = this.getTileSize();
		tile.style.width  = size.x + 'px';
		tile.style.height = size.y + 'px';

		var tileUrl = window.host + '/services/frontend/geographies/GetGeography';
		var args = {
			x: coords.x,
			y: coords.y,
			z: coords.z,
			a: this.geographyId,
			w: window.Context.Configuration.Signatures.Geography,
			h: window.Context.Configuration.Signatures.Suffix
		};

		var gridLayer = this;
		var geoJsonLayer = L.geoJSON(null, {
			style: {
				fillOpacity: 0,
				color: '#984ee6',
				weight: 1
			},
			interactive: false
		});

		tile._geoJsonLayer = geoJsonLayer;

		axiosClient.getPromise(tileUrl, args, 'obtener la cartografía').then(function (response) {
			if (gridLayer._map) {
				geoJsonLayer.addData(response.Data);
				geoJsonLayer.addTo(gridLayer._map);
			}
		});

		return tile;
	}
});

export default GeographyOverlay;
