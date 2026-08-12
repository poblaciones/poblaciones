import { CompositeLayer } from '@deck.gl/core';
import { GeoJsonLayer, TextLayer } from '@deck.gl/layers';


const LABEL_PROP_KEYS = [
	'getLabel', 'getLabelSize', 'getLabelColor', 'getLabelPriority', 'getLabelZoomRange',
	'labelSizeUnits', 'labelBackground', 'labelBackgroundPadding', 'labelFontFamily',
	'labelFontWeight', 'labelBillboard', 'labelMaxCount', 'labelMinPixelDistance',
	'labelCharacterSet'
];

// Las props de etiqueta admiten función (por feature) o valor constante.
function resolveAccessor(accessor, feature, index) {
	return typeof accessor === 'function' ? accessor(feature, { index }) : accessor;
}

// --- Posición de la etiqueta según el tipo de geometría ---

// Centroide de área de un anillo; promedio de vértices si el área es nula.
function ringCentroid(ring) {
	let twiceArea = 0, x = 0, y = 0;
	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		const x0 = ring[j][0], y0 = ring[j][1];
		const x1 = ring[i][0], y1 = ring[i][1];
		const f = x0 * y1 - x1 * y0;
		twiceArea += f;
		x += (x0 + x1) * f;
		y += (y0 + y1) * f;
	}
	if (twiceArea === 0) {
		let sx = 0, sy = 0;
		for (const c of ring) { sx += c[0]; sy += c[1]; }
		return [sx / ring.length, sy / ring.length];
	}
	const f = twiceArea * 3;
	return [x / f, y / f];
}

function ringAbsArea(ring) {
	let twiceArea = 0;
	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		twiceArea += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
	}
	return Math.abs(twiceArea) / 2;
}

// La componente x se corrige por la latitud media del segmento: sin eso el
// punto medio se sesga hacia el este fuera del ecuador.
function segmentLengths(coords) {
	const segments = [];
	let total = 0;
	for (let i = 1; i < coords.length; i++) {
		const x0 = coords[i - 1][0], y0 = coords[i - 1][1];
		const x1 = coords[i][0], y1 = coords[i][1];
		const dx = (x1 - x0) * Math.cos((y0 + y1) * Math.PI / 360);
		const dy = y1 - y0;
		const length = Math.sqrt(dx * dx + dy * dy);
		segments.push(length);
		total += length;
	}
	return { segments, total };
}

// Punto medio de la polilínea medido sobre su recorrido, no el vértice central.
function lineMidpoint(coords) {
	const { segments, total } = segmentLengths(coords);
	let remaining = total / 2;
	for (let i = 0; i < segments.length; i++) {
		if (remaining <= segments[i]) {
			const t = segments[i] === 0 ? 0 : remaining / segments[i];
			const a = coords[i], b = coords[i + 1];
			return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
		}
		remaining -= segments[i];
	}
	return coords[coords.length - 1];
}

function largestBy(items, measure) {
	let best = null, bestValue = -1;
	for (const item of items) {
		const value = measure(item);
		if (value > bestValue) { bestValue = value; best = item; }
	}
	return best;
}

function getLabelPosition(geometry) {
	switch (geometry.type) {
		case 'Polygon':
			return ringCentroid(geometry.coordinates[0]);
		case 'MultiPolygon':
			// Se etiqueta el polígono de mayor superficie, no el primero.
			return ringCentroid(largestBy(geometry.coordinates, p => ringAbsArea(p[0]))[0]);
		case 'LineString':
			return lineMidpoint(geometry.coordinates);
		case 'MultiLineString':
			// Se etiqueta el tramo más largo.
			return lineMidpoint(largestBy(geometry.coordinates, c => segmentLengths(c).total));
		case 'Point':
			return geometry.coordinates;
		default:
			return null;
	}
}

const DEFAULT_PROPS = {
	getLabel: { type: 'accessor', value: d => d.properties.Description },
	getLabelSize: { type: 'accessor', value: 12 },
	getLabelColor: { type: 'accessor', value: [20, 20, 20, 255] },
	getLabelPriority: { type: 'accessor', value: 1 },
	getLabelZoomRange: [0, 24],
	labelSizeUnits: 'pixels',
	labelBackground: [255, 255, 255, 220],
	labelBackgroundPadding: [4, 2],
	// El atlas de fuentes se arma con ctx.font sobre un canvas fuera del DOM:
	// debe ser una familia CSS real, nunca var(--x).
	labelFontFamily: 'sans-serif',
	labelFontWeight: '500',
	// El conjunto por defecto del TextLayer es ASCII 32-127: sin esto la ñ y
	// las vocales acentuadas no se dibujan.
	labelCharacterSet: 'auto',
	labelBillboard: true,
	// Tope de etiquetas dibujadas, aplicado sobre las que están a la vista.
	labelMaxCount: 100,
	// Separación mínima entre etiquetas, en píxeles de pantalla.
	labelMinPixelDistance: 70
};

class LabeledGeoJsonLayer extends CompositeLayer {
	static layerName = 'LabeledGeoJsonLayer';
	static defaultProps = DEFAULT_PROPS;

	// Layer.shouldUpdateState devuelve propsOrDataChanged, que excluye los
	// cambios de viewport. Sin esto la selección queda congelada.
	shouldUpdateState({ changeFlags }) {
		return changeFlags.somethingChanged;
	}

	updateState({ props, oldProps, changeFlags, context }) {
		const labelsChanged = changeFlags.dataChanged ||
			props.getLabel !== oldProps.getLabel ||
			props.getLabelPriority !== oldProps.getLabelPriority ||
			props.getLabelZoomRange !== oldProps.getLabelZoomRange ||
			props.labelMaxCount !== oldProps.labelMaxCount ||
			props.labelMinPixelDistance !== oldProps.labelMinPixelDistance;

		const labelData = labelsChanged ? this.buildLabelData(props) : this.state.labelData;

		// La selección depende del encuadre completo, no sólo del zoom: al
		// desplazarse entran y salen etiquetas distintas.
		const viewport = context.viewport;
		const key = [viewport.zoom, viewport.longitude, viewport.latitude,
			viewport.width, viewport.height].join('|');

		if (labelsChanged || key !== this.state.viewportKey) {
			this.setState({
				labelData,
				viewportKey: key,
				visibleLabels: this.selectVisibleLabels(labelData, viewport)
			});
		}
	}

	buildLabelData(props) {
		const source = props.data;
		if (!source) return [];
		const features = Array.isArray(source) ? source : source.features;
		const labelData = [];

		for (let index = 0; index < features.length; index++) {
			const feature = features[index];
			if (!feature.geometry) continue;

			const position = getLabelPosition(feature.geometry);
			if (!position) continue;

			const text = resolveAccessor(props.getLabel, feature, index);
			if (text === null || text === undefined || String(text).trim() === '') continue;

			const range = resolveAccessor(props.getLabelZoomRange, feature, index);

			labelData.push(this.getSubLayerRow({
				position,
				text: String(text),
				priority: resolveAccessor(props.getLabelPriority, feature, index),
				itemColor: resolveAccessor(props.getFillColor, feature, index),
				minZoom: range[0],
				maxZoom: range[1]
			}, feature, index));
		}
		return labelData;
	}

	selectVisibleLabels(labelData, viewport) {
		const { labelMaxCount, labelMinPixelDistance } = this.props;
		const zoom = viewport.zoom;

		// El recorte por área visible va antes del tope: sin esto el tope
		// consume el cupo con etiquetas que están fuera de la pantalla.
		const bounds = viewport.getBounds();
		const marginX = (bounds[2] - bounds[0]) * 0.1;
		const marginY = (bounds[3] - bounds[1]) * 0.1;

		const candidates = labelData.filter(d =>
			zoom >= d.minZoom && zoom <= d.maxZoom &&
			d.position[0] >= bounds[0] - marginX && d.position[0] <= bounds[2] + marginX &&
			d.position[1] >= bounds[1] - marginY && d.position[1] <= bounds[3] + marginY);

		candidates.sort((a, b) => b.priority - a.priority);

		// Descarte por proximidad sobre una grilla en píxeles de pantalla.
		const occupied = new Set();
		const visible = [];
		const addedText = [];
		for (const label of candidates) {
			if (visible.length >= labelMaxCount) break;

			const pixel = viewport.project(label.position);
			const cx = Math.round(pixel[0] / labelMinPixelDistance);
			const cy = Math.round(pixel[1] / labelMinPixelDistance);
			if (occupied.has(cx + ':' + cy)) continue;

			// Se reservan también las celdas contiguas: sin eso dos etiquetas
			// en celdas vecinas pueden quedar pegadas.
			for (let dx = -1; dx <= 1; dx++) {
				for (let dy = -1; dy <= 1; dy++) {
					occupied.add((cx + dx) + ':' + (cy + dy));
				}
			}
			if (!addedText.includes(label.text)) {
				visible.push(label);
				addedText.push(label.text);
			}
		}
		return visible;
	}

	renderLayers() {
		// data es una prop asíncrona: su valor vive en un mapa interno de props,
		// no como propiedad propia, y el spread no la copia. Debe pasarse aparte.
		const geoJsonProps = { ...this.props, data: this.props.data };
		LABEL_PROP_KEYS.forEach(k => { delete geoJsonProps[k]; });

		const layers = [
			new GeoJsonLayer(geoJsonProps, this.getSubLayerProps({ id: 'geojson-' + this.props.id  }))
		];

		const visibleLabels = this.state.visibleLabels;

		if (!visibleLabels.length) return layers;

		layers.push(new TextLayer(this.getSubLayerProps({ id: 'labels-' + this.props.id }), {
			data: visibleLabels,
			// Las etiquetas no deben interceptar el picking de las geometrías.
			pickable: false,
			billboard: this.props.labelBillboard,
			sizeUnits: this.props.labelSizeUnits,
			fontFamily: this.props.labelFontFamily,
			fontWeight: this.props.labelFontWeight,
			characterSet: this.props.labelCharacterSet,
			background: true,
			getBackgroundColor: this.props.labelBackground,
			backgroundPadding: this.props.labelBackgroundPadding,
			getPosition: d => d.position,
			getText: d => d.text,
			getSize: this.getSubLayerAccessor(this.props.getLabelSize),
			getColor: this.getSubLayerAccessor(this.props.getLabelColor),
			// Explícito: getSubLayerProps propaga las extensiones del padre, y
			// PathStyleExtension sobre el TextLayer rompe sus shaders.
			extensions: []
		}));

		return layers;
	}
}

export default LabeledGeoJsonLayer;
