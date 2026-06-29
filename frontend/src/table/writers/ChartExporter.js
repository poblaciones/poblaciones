/**
 * ChartExporter — exporta a archivo los gráficos SVG de un contenedor del DOM.
 *
 * Un mismo indicador puede mostrar varios gráficos (un panel por año), así que el
 * exportador los recolecta todos y los combina en un único SVG, apilados
 * verticalmente con un título opcional. Desde ese SVG combinado produce:
 *   - SVG: el vectorial directo (para insertar en Word/Docs sin pixelar).
 *   - PNG: rasterizado a 2x vía canvas (para usos que no aceptan vectorial).
 *
 * Se construye con el elemento contenedor (el cuerpo del bloque del indicador) y
 * un título. La recolección y serialización del DOM se hacen al exportar.
 */

var SVG_NS = 'http://www.w3.org/2000/svg';
var GAP = 16;            // separación vertical entre gráficos combinados
var TITLE_H = 24;        // alto reservado para el título
var PNG_SCALE = 2;       // factor de rasterizado (nitidez en PNG)

function ChartExporter(containerEl, title) {
	this.container = containerEl;
	this.title = title || '';
}

// SVGs presentes en el contenedor, en orden de aparición.
ChartExporter.prototype._collectSvgs = function () {
	if (!this.container || !this.container.querySelectorAll) return [];
	return Array.prototype.slice.call(this.container.querySelectorAll('svg'));
};

ChartExporter.prototype.hasCharts = function () {
	return this._collectSvgs().length > 0;
};

// Dimensión intrínseca de un SVG: usa el viewBox si está, con respaldo en el
// tamaño renderizado (getBoundingClientRect).
ChartExporter.prototype._sizeOf = function (svg) {
	var vb = svg.viewBox && svg.viewBox.baseVal;
	if (vb && vb.width && vb.height) return { w: vb.width, h: vb.height };
	var r = svg.getBoundingClientRect();
	return { w: Math.max(1, Math.round(r.width)), h: Math.max(1, Math.round(r.height)) };
};

// Combina los SVG del contenedor en uno solo, apilado verticalmente y centrado,
// con el título arriba. Devuelve { svg, width, height } (svg ya serializado).
ChartExporter.prototype._composeSvg = function () {
	var svgs = this._collectSvgs();
	var loc = this;
	var sizes = svgs.map(function (s) { return loc._sizeOf(s); });

	var width = 0;
	for (var i = 0; i < sizes.length; i++) if (sizes[i].w > width) width = sizes[i].w;
	var hasTitle = !!this.title;
	var height = (hasTitle ? TITLE_H : 0);
	for (var j = 0; j < sizes.length; j++) height += sizes[j].h + (j > 0 ? GAP : 0);
	width = Math.max(1, Math.ceil(width));
	height = Math.max(1, Math.ceil(height));

	var root = document.createElementNS(SVG_NS, 'svg');
	root.setAttribute('xmlns', SVG_NS);
	root.setAttribute('width', String(width));
	root.setAttribute('height', String(height));
	root.setAttribute('viewBox', '0 0 ' + width + ' ' + height);

	// Fondo blanco: sin él, el PNG queda con transparencia y el SVG sin lienzo.
	var bg = document.createElementNS(SVG_NS, 'rect');
	bg.setAttribute('x', '0'); bg.setAttribute('y', '0');
	bg.setAttribute('width', String(width)); bg.setAttribute('height', String(height));
	bg.setAttribute('fill', '#ffffff');
	root.appendChild(bg);

	var y = 0;
	if (hasTitle) {
		var t = document.createElementNS(SVG_NS, 'text');
		t.setAttribute('x', String(width / 2));
		t.setAttribute('y', '16');
		t.setAttribute('text-anchor', 'middle');
		t.setAttribute('font-family', 'sans-serif');
		t.setAttribute('font-size', '13');
		t.setAttribute('font-weight', '600');
		t.setAttribute('fill', '#37474f');
		t.textContent = this.title;
		root.appendChild(t);
		y = TITLE_H;
	}

	for (var k = 0; k < svgs.length; k++) {
		if (k > 0) y += GAP;
		var clone = svgs[k].cloneNode(true);
		// Se envuelve cada SVG clonado en un <g> trasladado, centrado en el ancho.
		var g = document.createElementNS(SVG_NS, 'g');
		var dx = Math.round((width - sizes[k].w) / 2);
		g.setAttribute('transform', 'translate(' + dx + ',' + y + ')');
		// El clon mantiene su viewBox; se fija su tamaño explícito para el layout.
		clone.setAttribute('width', String(sizes[k].w));
		clone.setAttribute('height', String(sizes[k].h));
		clone.removeAttribute('style');
		g.appendChild(clone);
		root.appendChild(g);
		y += sizes[k].h;
	}

	this._inlineComputedStyles(root, svgs);

	var serialized = new XMLSerializer().serializeToString(root);
	// Encabezado XML para que el archivo SVG sea autónomo.
	serialized = '<?xml version="1.0" encoding="UTF-8"?>\n' + serialized;
	return { svg: serialized, width: width, height: height };
};

// Los estilos de los charts viven en CSS scoped (clases). Al sacar el SVG del
// documento, esas reglas no lo acompañan: se vuelcan las propiedades de pintura
// computadas a atributos de presentación inline, para que el archivo sea fiel.
// Se empareja cada SVG de origen con su clon y se recorren en paralelo; si algún
// par no coincide en estructura, ese SVG se omite del inlining (queda sin estilos
// inline antes que con estilos cruzados).
ChartExporter.prototype._inlineComputedStyles = function (root, srcSvgs) {
	if (!window.getComputedStyle) return;
	var cloneSvgs = root.querySelectorAll('g > svg');
	if (cloneSvgs.length !== srcSvgs.length) return;
	var props = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-dasharray',
		'opacity', 'font-family', 'font-size', 'font-weight', 'text-anchor'];
	for (var s = 0; s < srcSvgs.length; s++) {
		var srcNodes = srcSvgs[s].querySelectorAll('*');
		var dstNodes = cloneSvgs[s].querySelectorAll('*');
		if (srcNodes.length !== dstNodes.length) continue;
		for (var i = 0; i < srcNodes.length; i++) {
			var cs = window.getComputedStyle(srcNodes[i]);
			for (var p = 0; p < props.length; p++) {
				var v = cs.getPropertyValue(props[p]);
				if (v && v !== 'none' && v !== 'normal') dstNodes[i].setAttribute(props[p], v);
			}
		}
	}
};

ChartExporter.prototype._filename = function (ext) {
	var base = (this.title || 'grafico').replace(/[^\w\-]+/g, '_').replace(/^_+|_+$/g, '');
	return (base || 'grafico') + '.' + ext;
};

ChartExporter.prototype._triggerDownload = function (blob, filename) {
	var url = URL.createObjectURL(blob);
	var link = document.createElement('a');
	link.setAttribute('href', url);
	link.setAttribute('download', filename);
	link.style.visibility = 'hidden';
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
};

// Exporta el SVG combinado tal cual (vectorial).
ChartExporter.prototype.downloadSvg = function () {
	if (!this.hasCharts()) return;
	var composed = this._composeSvg();
	var blob = new Blob([composed.svg], { type: 'image/svg+xml;charset=utf-8' });
	this._triggerDownload(blob, this._filename('svg'));
};

// Rasteriza el SVG combinado a PNG (2x) y lo descarga. Asíncrono: la imagen se
// carga antes de pintar el canvas.
ChartExporter.prototype.downloadPng = function () {
	if (!this.hasCharts()) return Promise.resolve();
	var loc = this;
	var composed = this._composeSvg();
	var svgBlob = new Blob([composed.svg], { type: 'image/svg+xml;charset=utf-8' });
	var url = URL.createObjectURL(svgBlob);

	return new Promise(function (resolve, reject) {
		var img = new Image();
		img.onload = function () {
			var canvas = document.createElement('canvas');
			canvas.width = composed.width * PNG_SCALE;
			canvas.height = composed.height * PNG_SCALE;
			var ctx = canvas.getContext('2d');
			ctx.setTransform(PNG_SCALE, 0, 0, PNG_SCALE, 0, 0);
			ctx.drawImage(img, 0, 0);
			URL.revokeObjectURL(url);
			canvas.toBlob(function (blob) {
				if (blob) loc._triggerDownload(blob, loc._filename('png'));
				resolve();
			}, 'image/png');
		};
		img.onerror = function (e) { URL.revokeObjectURL(url); reject(e); };
		img.src = url;
	});
};

export default ChartExporter;
