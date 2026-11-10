/*
 * fixtures-hierarchy.mjs — catálogo de delimitaciones con el formato de
 * GetFabBoundaries (agrupación por padre declarada en UseParent y ancestros de
 * cada item) y dobles de prueba para armar una pivot con árbol de filas sin el
 * contexto global.
 *
 *   Provincias (raíz):        Catamarca(10), Tucumán(11)
 *     Municipios (agrupada):    Belén(20) y Andalgalá(21) de Catamarca; Tafí Viejo(22) de Tucumán
 *     Departamentos (agrupada): Ambato(30) de Catamarca; Capital(31) de Tucumán
 *       Localidades (agrupada): San Isidro(50), de Ambato
 *   Aglomerados (raíz, y también hija de Provincias por ancestros):
 *                             Gran Catamarca(60), Gran Tucumán(61), Gran Buenos Aires(62, sin provincia)
 *     Barrios (agrupada):       Centro(70), agrupado por un aglomerado de otra versión
 *                               (id 900, que no está en el catálogo; coincide por nombre)
 *   Regiones (raíz):          NOA(40)
 */

import BoundaryHierarchy from '../classes/BoundaryHierarchy.js';
import ActivePivot from '@/table/classes/ActivePivot.js';

export function catalogNodes() {
	return [
		{ Id: null, Name: 'Límites políticos', Items: [
			{ Id: 1, Name: 'Provincias', VersionId: 101, UseParent: '0', Items: [
				{ Id: 10, Name: 'Catamarca', Code: '10', Ancestors: '' },
				{ Id: 11, Name: 'Tucumán', Code: '90', Ancestors: null }
			] },
			{ Id: 2, Name: 'Municipios', VersionId: 102, UseParent: '1', Items: [
				{ Id: 10, Name: 'Catamarca', Code: '10', Items: [
					{ Id: 20, Name: 'Belén', Code: '1001', Ancestors: '10' },
					{ Id: 21, Name: 'Andalgalá', Code: '1002', Ancestors: '10' }
				] },
				{ Id: 11, Name: 'Tucumán', Code: '90', Items: [
					{ Id: 22, Name: 'Tafí Viejo', Code: '9001', Ancestors: '11' }
				] }
			] },
			{ Id: 3, Name: 'Departamentos', VersionId: 103, UseParent: '1', Items: [
				{ Id: 10, Name: 'Catamarca', Code: '10', Items: [
					{ Id: 30, Name: 'Ambato', Code: '1010', Ancestors: '10' }
				] },
				{ Id: 11, Name: 'Tucumán', Code: '90', Items: [
					{ Id: 31, Name: 'Capital', Code: '9010', Ancestors: '11' }
				] }
			] },
			{ Id: 5, Name: 'Localidades', VersionId: 105, UseParent: '1', Items: [
				{ Id: 30, Name: 'Ambato', Code: '1010', Items: [
					{ Id: 50, Name: 'San Isidro', Code: '101001', Ancestors: '30,10' }
				] }
			] }
		] },
		{ Id: null, Name: 'Aglomerados', Items: [
			{ Id: 6, Name: 'Aglomerados', VersionId: 106, UseParent: '0', Items: [
				{ Id: 60, Name: 'Gran Catamarca', Code: 'A1', Ancestors: '10' },
				{ Id: 61, Name: 'Gran Tucumán', Code: 'A2', Ancestors: '11' },
				{ Id: 62, Name: 'Gran Buenos Aires', Code: 'A3', Ancestors: '' }
			] },
			{ Id: 7, Name: 'Barrios', VersionId: 107, UseParent: '1', Items: [
				{ Id: 900, Name: 'Gran Catamarca', Code: 'X9', Items: [
					{ Id: 70, Name: 'Centro', Code: 'B1', Ancestors: '900' }
				] }
			] }
		] },
		{ Id: null, Name: 'Regiones', Items: [
			{ Id: 4, Name: 'Regiones', VersionId: 104, UseParent: '0', Items: [
				{ Id: 40, Name: 'NOA', Code: 'R1', Ancestors: '' }
			] }
		] }
	];
}

export function makeHierarchy(defaultRootId) {
	return new BoundaryHierarchy(catalogNodes(), defaultRootId);
}

// RegionSet mínimo: cada elemento se relaciona con la geografía de igual id.
export function identityRegion(boundary) {
	return {
		boundary: boundary,
		GeographyRelations: {},
		GetGeographyIdsForItem: function (fid) { return [fid]; },
		EnsureContainsGeographyRelations: function () { return Promise.resolve(); }
	};
}

// Pivot con el árbol sobre el catálogo de prueba. Un RegionSet por delimitación,
// como en el RegionStore real.
export function makeTreePivot(defaultRootId) {
	var hierarchy = makeHierarchy(defaultRootId);
	var regions = {};
	return new ActivePivot({
		hierarchy: function () { return hierarchy; },
		regionFor: function (boundary) {
			if (!regions[boundary.Id]) {
				regions[boundary.Id] = identityRegion(boundary);
			}
			return regions[boundary.Id];
		}
	});
}

// Columna de conteo (N) con los valores por id de elemento, servidos por un
// índice de datos simulado (lo que pivot.Data arma desde el backend).
export function withCountColumn(pivot, valuesByFid, options) {
	options = options || {};
	var variable = options.variable || {};
	var tuple = {
		metricId: 1, key: 'k1', versionId: 10, levelId: 5, variableId: 7, labelId: null,
		isTotal: true, isEmpty: false, level: { GeographyId: 99 },
		metric: { properties: { SummaryMetric: options.summary || 'N' } }, variable: variable
	};
	var byGeo = new Map();
	Object.keys(valuesByFid).forEach(function (fid) {
		byGeo.set(Number(fid), [Object.assign({ VID: 7, LID: null }, valuesByFid[fid])]);
	});
	pivot.MetricTuples.rebuild = function () { pivot.MetricTuples.metricTuples = [tuple]; };
	pivot.MetricTuples.metricTuples = [tuple];
	pivot.Data.load = function () { return Promise.resolve(); };
	pivot.Data.indexFor = function () { var index = {}; index[7] = { byGeo: byGeo }; return index; };
	return tuple;
}

// Etiquetas de las filas armadas, para comparar la estructura de la grilla.
export function rowLabels(pivot) {
	var labels = [];
	for (var i = 0; i < pivot.Rows.length; i++) {
		labels.push(pivot.Rows[i][0].Label);
	}
	return labels;
}
