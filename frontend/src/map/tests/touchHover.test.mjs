import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from './_harness.mjs';

// En pantallas táctiles el :hover queda aplicado al elemento donde se apoyó el dedo, y al desplazar una lista
// parece que el ítem fue elegido. Los :hover de las listas deben ir dentro de @media (hover: hover).

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const moduleRoot = path.resolve(testsDir, '..');
const commonRoot = path.resolve(moduleRoot, '..', 'common');

const SELECTORES_DE_LISTA = ['.mp-list-item', '.mp-list-row', '.mp-list-row--strong', '.variableRow', '.category-card', '.source-header', '.search-more'];

function mencionaSelector(regla, selector) {
	return new RegExp(selector.replace('.', '\\.') + '(?![\\w-])').test(regla);
}

function leerEstilos(archivo) {
	const texto = fs.readFileSync(archivo, 'utf8');
	const bloqueStyle = texto.match(/<style[^>]*>([\s\S]*?)<\/style>/);
	if (bloqueStyle) {
		return bloqueStyle[1];
	}
	return texto;
}

// Devuelve los encabezados de las reglas con :hover sobre ítems de lista que no están dentro de @media (hover: hover).
// Las reglas dentro de prefers-reduced-motion solo quitan efectos, no los agregan.
function hoverDeListaSinMedia(css) {
	const sinComentarios = css.replace(/\/\*[\s\S]*?\*\//g, '');
	const pila = [];
	const infractores = [];
	let encabezado = '';
	for (const caracter of sinComentarios) {
		if (caracter === '{') {
			pila.push(encabezado.trim());
			encabezado = '';
		} else if (caracter === '}') {
			const regla = pila.pop();
			if (regla.indexOf(':hover') !== -1 && regla.charAt(0) !== '@') {
				const esDeLista = SELECTORES_DE_LISTA.some(function (selector) { return mencionaSelector(regla, selector); });
				const dentroDeHover = pila.some(function (contexto) { return contexto.indexOf('@media (hover: hover)') === 0; });
				const dentroDeMovimientoReducido = pila.some(function (contexto) { return contexto.indexOf('prefers-reduced-motion') !== -1; });
				if (esDeLista && !dentroDeHover && !dentroDeMovimientoReducido) {
					infractores.push(regla);
				}
			}
			encabezado = '';
		} else if (caracter === ';') {
			encabezado = '';
		} else {
			encabezado += caracter;
		}
	}
	return infractores;
}

describe('hover de listas: solo con punteros que lo soportan');

it('los ítems de lista de common/styles/list-items.css', () => {
	expect(hoverDeListaSinMedia(leerEstilos(path.join(commonRoot, 'styles', 'list-items.css')))).toEqual([]);
});

it('las filas de variables de map/styles/lists.css', () => {
	expect(hoverDeListaSinMedia(leerEstilos(path.join(moduleRoot, 'styles', 'lists.css')))).toEqual([]);
});

it('las tarjetas, separadores y "ver más" del selector de indicadores', () => {
	const archivo = path.join(moduleRoot, 'components', 'widgets', 'sideToolbar', 'indicatorSelector.vue');
	expect(hoverDeListaSinMedia(leerEstilos(archivo))).toEqual([]);
});

it('el detector reconoce un :hover de lista sin media query', () => {
	expect(hoverDeListaSinMedia('.mp-list-item:hover { color: red; }')).toEqual(['.mp-list-item:hover']);
	expect(hoverDeListaSinMedia('@media (hover: hover) { .mp-list-item:hover { color: red; } }')).toEqual([]);
	expect(hoverDeListaSinMedia('.breadcrumb-item:hover { color: red; }')).toEqual([]);
	expect(hoverDeListaSinMedia('.source-header-addall:hover { color: red; }')).toEqual([]);
});
