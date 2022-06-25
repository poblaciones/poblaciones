import TileOverlay from '@/public/classes/TileOverlay';
import L from 'leaflet';

export default LeafletTileOverlay;

function LeafletTileOverlay(activeSelectedMetric) {
	this.tileOverlay = new TileOverlay(activeSelectedMetric, true);
	this.index = -1;
	var loc = this;
	this.on("tileunload", function(tileEvent) {
		loc.releaseTile(tileEvent.tile);
	});

}

LeafletTileOverlay.prototype = new L.GridLayer();

LeafletTileOverlay.prototype.createTile = function (coords) {
	var ownerDocument = document;
	var zoom = coords.z;
	var ret = this.tileOverlay.getTile(coords, zoom, ownerDocument);
//	ret.style.border = "1px solid black";
//	ret.innerHTML = "<div style='position: absolute'><br><br><br><br><br><br><br><br><br><br><br><br><br><span style='font-size: 18px'>X:" + coords.x + " Y: " + coords.y + " Z: " + coords.z + "</span></div>";
	return ret;
};

LeafletTileOverlay.prototype.releaseTile = function (tile) {
	return this.tileOverlay.releaseTile(tile);
};

LeafletTileOverlay.prototype.dispose = function () {
	return this.tileOverlay.dispose();
};
