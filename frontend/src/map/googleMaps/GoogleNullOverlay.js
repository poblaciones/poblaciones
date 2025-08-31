
export default GoogleNullOverlay;

function GoogleNullOverlay() {
	this.tileSize = new window.google.maps.Size(256, 256);
	this.disposed = false;
}

GoogleNullOverlay.prototype.getTile = function (coord, zoom, ownerDocument) {
	var div = ownerDocument.createElement('div');
	div.style.width = '256px';
	div.style.height = '256px';
	div.style.fontSize = '10';

	return div;
};

GoogleNullOverlay.prototype.releaseTile = function (tile) {
};

GoogleNullOverlay.prototype.dispose = function () {
	this.disposed = true;
};
