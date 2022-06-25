import TileOverlay from '@/public/classes/TileOverlay';

export default GoogleTileOverlay;

function GoogleTileOverlay(activeSelectedMetric) {
	this.tileOverlay = new TileOverlay(activeSelectedMetric);
	this.tileSize = new google.maps.Size(this.tileOverlay.tileSize, this.tileOverlay.tileSize);
}

GoogleTileOverlay.prototype.getTile = function (coord, zoom, ownerDocument) {
	return this.tileOverlay.getTile(coord, zoom, ownerDocument);
};

GoogleTileOverlay.prototype.releaseTile = function (tile) {
	return this.tileOverlay.releaseTile(tile);
};

GoogleTileOverlay.prototype.dispose = function () {
	return this.tileOverlay.dispose();
};
