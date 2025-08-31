import TileOverlay from '@/map/classes/TileOverlay';
import L from 'leaflet';

export default LeafletNullOverlay;

function LeafletNullOverlay() {
	this.disposed = false;
}

LeafletNullOverlay.prototype = new L.GridLayer();

LeafletNullOverlay.prototype.createTile = function (coords) {
	var div = document.createElement('div');
	div.style.width = '256px';
	div.style.height = '256px';
	div.style.fontSize = '10';

	return div;
};

LeafletNullOverlay.prototype.releaseTile = function (tile) {

};

LeafletNullOverlay.prototype.dispose = function () {
	this.disposed = true;
};
