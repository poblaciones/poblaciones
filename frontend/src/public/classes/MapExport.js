import dom from '@/common/js/dom';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default MapExport;

function MapExport(currentWork) {
	this.imageFormat = '';
	this.currentWork = currentWork;
	this.orientationLandscape = false;
	this.minRatio = 1;
};

MapExport.prototype.ExportImage = function (format) {
	var loc = this;
	this.imageFormat = format;
	this.minRatio = .66;
	loc.prepareMapAndExport(loc.generateImage, 2, []);
};

MapExport.prototype.ExportPdf = function (landscape) {
	var loc = this;
	this.orientationLandscape = landscape;
	this.minRatio = (landscape ? .66 : 1);

	loc.prepareMapAndExport(loc.generatePdf, 2);
};

MapExport.prototype.generatePngInternal = function (canvas, scale) {
	var div = document.createElement('div');
	var img = document.createElement('img');
	img.src = canvas.toDataURL('image/png');
	img.style.width = (100 / scale) + '%';
	img.style.height = (100 / scale) + '%';
	img.style.float = 'right';
	div.appendChild(img);
	div.style.position = "absolute";
	div.style.right = '0';
	div.style.zIndex = 10;
	//var container = document.body;
	var container = document.getElementById('holder');
	container.appendChild(div);
	return div;
};

MapExport.prototype.generateImage = function (canvas) {
	var a = document.createElement('a');
	a.href = canvas.toDataURL('image/' + this.imageFormat);
	var ext = this.imageFormat.replace('jpeg', 'jpg');
	a.download = 'mapa.' + ext;
	document.body.appendChild(a);
	a.click();
	a.parentNode.removeChild(a);
};

MapExport.prototype.generatePdf = function (canvas) {
			var img = canvas.toDataURL('image/jpeg');
			var orientation;
			var imgHeightMax;
			var imgWidthMax;
			const pageA4Width = 210;
			const pageA4Height = 297;
			var pageMargin = 20;

			if (!this.orientationLandscape) {
				orientation = 'portrait';
				imgHeightMax = pageA4Height;
				imgWidthMax = pageA4Width;
			} else {
				orientation = 'landscape';
				imgHeightMax = pageA4Width;
				imgWidthMax = pageA4Height;
			}
			imgHeightMax -= pageMargin * 2;
			imgWidthMax -= pageMargin * 2;

			var doc = new jsPDF({ orientation: orientation });
			var imgPositionX = pageMargin;
			var imgPositionY = pageMargin;

			var imgHeight = imgHeightMax;
			var imgWidth =  parseInt(imgHeight * (canvas.width / canvas.height), 10);

			if (imgWidth > imgWidthMax) {
				imgWidth = imgWidthMax;
				imgHeight =  parseInt(imgWidth * (canvas.height / canvas.width), 10);
			}
			doc.addImage(img,'JPEG', imgPositionX, imgPositionY, imgWidth, imgHeight, 'map', 'NONE');
			doc.save("mapa.pdf");
};

MapExport.prototype.hideInteractiveElements = function (addClasses, attributesByClass) {

	window.SegMap.MapsApi.gMap.set('disableDefaultUI', true);

	dom.addClassesByList(addClasses);
	dom.setStyleAttributesByList(attributesByClass);

	dom.setDisplayByClassNotActive("exp-serie-item", "none");
};

MapExport.prototype.restoreInteractiveElements = function (addClasses, attributesByClass) {

	dom.removeClassesByList(addClasses);
	dom.unsetStyleAttributesByList(attributesByClass);

	dom.setDisplayByClass("exp-serie-item", "block");

	window.SegMap.MapsApi.gMap.set('disableDefaultUI', false);
};

MapExport.prototype.ignoreFilter = function (ele) {
	return (ele.id === 'waitMessage' || ele.nodeName === 'IFRAME');
};

MapExport.prototype.prepareMapAndExport = function (exportFunction, scale) {
	var loc = this;
	window.Popups.WaitMessage.show('Completando información del mapa ...');

	var addClasses = [
		// saca borde al panel derecho
		{ class: 'card panel-body', extraclass: 'exp-panel' },
		// acomoda logo si lo hubiera
		{ class: 'logoDiv', extraclass: 'exp-logodiv-right' },
		// botones de series
		{ class: 'exp-serie-item', extraclass: 'exp-rounded' },
		// contraste a textos grises
		{ class: 'summaryRow', extraclass: 'exp-high-contrast' },
		{ class: 'statsHeader', extraclass: 'exp-high-contrast' },
		{ class: 'stats', extraclass: 'exp-high-contrast' },
		{ class: 'frozen', extraclass: 'active' },
		{ class: 'filterElement', extraclass: 'exp-high-contrast' },
		{ class: 'exp-serie-item', extraclass: 'exp-high-button' },
		// referencias de colores
		{ class: 'exp-category-bullets', extraclass: 'exp-circles' },
		{ class: 'exp-category-bullets-large', extraclass: 'exp-circles-large' }

	];
	var attributesByClass = [
		{ attribute: 'display', set: 'none', restore: 'unset', class: 'exp-hiddable-unset' },
		{ attribute: 'display', set: 'none', restore: 'inline-block', class: 'exp-hiddable-inline' },
		{ attribute: 'display', set: 'none', restore: 'block', class: 'exp-hiddable-block' },
		{ attribute: 'visibility', set: 'hidden', restore: 'visible', class: 'exp-hiddable-visiblity' },
		// permite más contenido en body
		{ attribute: 'overflow', set: 'visible', restore: 'hidden', class: '#dbody' },
		{ attribute: 'overflow', set: 'visible', restore: 'hidden', class: '#holder' }//,
	];

	this.hideInteractiveElements(addClasses, attributesByClass);

	var panRight = document.getElementById('panSummary');
	var panMain = document.getElementById('panMain');
	var panHolder = document.getElementById('holder');

	if (window.SegMap.Clipping.FrameHasClippingRegionId() || window.SegMap.Clipping.FrameHasClippingCircle()) {
		// solo redimensiona el mapa cuando hay una región de clipping o un círculo marcados
		var panRightHeight = panRight.offsetHeight;
		var minHeight = panMain.clientWidth * loc.minRatio;

		var newHeight;
		if (panRightHeight > panMain.clientHeight) {
			newHeight = panRightHeight + 1;
		} else if (panMain.clientHeight < minHeight) {
			newHeight = minHeight;
		} else {
			newHeight = panMain.clientHeight;
		}
	}	else {
		newHeight = panMain.clientHeight;
	}
	// pone el borde
	var keepPanHolder = panHolder.style.height;
	var keepPanMain = panMain.style.height;

	panHolder.style.height = (Math.max(newHeight, panRight.offsetHeight + 1) + 2) + "px";
	panMain.style.height = newHeight + "px";

	// se asegura de tener los datos
	window.SegMap.SetTimeout(50).then(function () {
		return window.SegMap.MapsApi.WaitForFullLoading().then(function () {
			return window.SegMap.WaitForFullLoading().then(function () {

				window.Popups.WaitMessage.show('Preparando visualización ...');
				// saca scrollbar de panel de resumen
				var hideSecond = [{ attribute: 'overflow-y', set: 'hidden', restore: 'auto', class: '#panRight' },
				// oculta el spliter
				{ attribute: 'display', set: 'none', restore: 'block', class: 'gutter gutter-horizontal' },
				// bordes
				{ attribute: 'border', set: '1px solid #ddd', restore: 'unset', class: '#holder' }];
				var workColor = loc.resolveWorkColor();
				if (workColor !== null) {
					hideSecond.push({
						attribute: 'border-top-color',
						set: workColor, restore: 'unset', class: '#holder'
					});
				}
				dom.setStyleAttributesByList(hideSecond);
				attributesByClass = attributesByClass.concat(hideSecond);

				html2canvas(panRight, { useCORS: true, scale: scale, ignoreElements: loc.ignoreFilter }).then(function (canvasPanRight) {
					var divPanel = loc.generatePngInternal(canvasPanRight, scale);

					return window.SegMap.SetTimeout(50).then(function () {

						return html2canvas(document.body, { useCORS: true, scale: scale, ignoreElements: loc.ignoreFilter }).then(function (canvasBody) {

							exportFunction.apply(loc, [canvasBody]);

							loc.restoreInteractiveElements(addClasses, attributesByClass);

							if (keepPanHolder) {
								panHolder.style.height = keepPanHolder;
								panMain.style.height = keepPanMain;
							} else {
								panMain.style.height = "100%";
								panHolder.style.height = "100%";
							}
							divPanel.parentNode.removeChild(divPanel);
						}).finally(function () { window.Popups.WaitMessage.close(); });
					});
				});
			});
		});
	}).catch(function (error) { window.Popups.WaitMessage.close(); throw error; });
};


MapExport.prototype.resolveWorkColor = function () {
	if (!this.currentWork) {
		return null;
	}
	if (this.currentWork.Institution && this.currentWork.Institution.Color) {
		return '#' + this.currentWork.Institution.Color;
	}
	return '#00A0D2';
};
