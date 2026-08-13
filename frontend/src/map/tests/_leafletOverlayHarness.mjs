// LeafletApi.js importa leaflet, deck.gl, core-js y CSS: no es cargable bajo
// el loader de tests sin stubear media docena de paquetes pesados. Como lo
// que se quiere ejercitar es solo la contabilidad de índices de overlays
// (doInsertOverlay / RemoveOverlay), se extrae el código fuente REAL de esos
// dos métodos del archivo y se lo evalúa sobre un objeto mínimo. Así el test
// corre contra el código que efectivamente se despacha, no contra una
// réplica que podría divergir.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import arr from './_stubs/arr.mjs';

const apiPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../leaflet/LeafletApi.js');

function extractMethod(source, name) {
	const start = source.indexOf('LeafletApi.prototype.' + name + ' = function');
	if (start === -1) {
		throw new Error('No se encontró el método ' + name + ' en LeafletApi.js');
	}
	const open = source.indexOf('{', start);
	let depth = 0;
	for (let i = open; i < source.length; i++) {
		if (source[i] === '{') depth++;
		else if (source[i] === '}') {
			depth--;
			if (depth === 0) {
				const signatureStart = source.indexOf('function', start);
				return source.substring(signatureStart, i + 1);
			}
		}
	}
	throw new Error('No se pudo delimitar el cuerpo de ' + name);
}

// Devuelve el código fuente de un método de LeafletApi. Se usa para verificar
// InsertSelectedMetricOverlay, que no es evaluable en aislamiento (crea
// LeafletTileOverlay, LeafletNullOverlay y llama a GetMetricData).
export function methodSource(name) {
	return extractMethod(fs.readFileSync(apiPath, 'utf8'), name);
}

// Devuelve un objeto con overlayMapTypesLayers y los dos métodos reales.
// overlayMapTypesGroup se simula: solo registra alta/baja de capas.
export function makeOverlayApi() {
	const source = fs.readFileSync(apiPath, 'utf8');
	const api = {
		overlayMapTypesLayers: [],
		overlayMapTypesGroup: {
			layers: [],
			addLayer(layer) { this.layers.push(layer); },
			removeLayer(layer) {
				const i = this.layers.indexOf(layer);
				if (i !== -1) this.layers.splice(i, 1);
			},
		},
	};
	api.doInsertOverlay = new Function('arr', 'return (' + extractMethod(source, 'doInsertOverlay') + ')')(arr);
	api.RemoveOverlay = new Function('arr', 'return (' + extractMethod(source, 'RemoveOverlay') + ')')(arr);
	return api;
}

// Overlay simulado: lleva el nombre de la capa a la que pertenece, para poder
// verificar cuál se removió realmente del mapa.
export function makeOverlay(name) {
	return {
		name,
		index: -1,
		disposed: false,
		dispose() { this.disposed = true; },
		setZIndex(z) { this.zIndex = z; },
	};
}
