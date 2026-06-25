/**
 * pivotValue.js — cálculo y formato del valor de una celda de la pivot según
 * el SummaryMetric del indicador y la especificación de la variable
 * (NormalizationScale, Decimals), reutilizando el helper del visor.
 *
 * La pivot agrega cada celda como { Value, Total } (ver Pivot.ResolveCell).
 * No dispone de área (Km2) ni del conteo por etiqueta, así que los modos que
 * dependen de superficie (K, H, A, D) se calculan con lo disponible: para esos,
 * el valor a mostrar es el normalizado por Total cuando la variable lo define.
 *
 * Equivalente, para la tabla, de lo que Summary hace en el visor.
 */

import h from '@/map/js/helper';

// Construye el tuple { value, normalization } a partir de la celda.
// Mantiene el criterio de Summary.getValueTuple para los modos que dependen
// solo de Value/Total; los modos de superficie (K, H, A, D) usan cell.Area
// (en m²) sumado por la pivot a partir de AreaM2 del endpoint. El modo FIL
// (% horizontal entre categorías del mismo indicador-versión) usa cell.RowGroupTotal.
export function valueTuple(summaryMetric, variable, cell) {
	var value = Number(cell.Value);
	var total = Number(cell.Total);
	var area  = (cell.Area != null) ? Number(cell.Area) : null;
	var scale = (variable && variable.NormalizationScale) ? variable.NormalizationScale : 1;
	switch (summaryMetric) {
		case 'N': // conteo
			return { value: value };
		case 'T': // total
			return { value: total };
		case 'I': // índice / proporción normalizada
			return { value: value, normalization: total / scale };
		case 'P': // % de columna: value sobre el total vertical de la columna
			return { value: value, normalization: (cell.ColumnTotal ? cell.ColumnTotal / 100 : undefined) };
		case 'FIL': // % de fila: value sobre la suma de categorías del grupo en la fila
			return { value: value, normalization: (cell.RowGroupTotal ? cell.RowGroupTotal / 100 : undefined) };
		case 'K': // superficie en Km²
			return { value: area != null ? area / 1e6 : null };
		case 'H': // superficie en hectáreas
			return { value: area != null ? area / 1e4 : null };
		case 'A': // % del área de la columna que ocupa la fila
			return { value: area, normalization: (cell.ColumnArea ? cell.ColumnArea / 100 : undefined) };
		case 'D': // densidad: Value / Km²
			return { value: value, normalization: (area != null && area > 0) ? area / 1e6 : undefined };
		default:
			return { value: value, normalization: total / scale };
	}
}

// Valor numérico calculado de la celda (ya normalizado).
// Los modos K/H/A no usan Value: para esos, el guard mira cell.Area.
export function cellValue(metric, variable, cell) {
	if (!cell || cell.Empty) return '-';
	var sm = metric.properties.SummaryMetric;
	var areaOnly = (sm === 'K' || sm === 'H' || sm === 'A');
	if (areaOnly) {
		if (cell.Area === null || cell.Area === undefined) return '-';
	} else {
		if (cell.Value === null || cell.Value === undefined) return '-';
	}
	return h.calculateValue(valueTuple(sm, variable, cell));
}

// Valor formateado según el modo y los decimales de la variable
// (mismo criterio que Summary.getValueFormatted).
export function formatValue(metric, variable, rawValue) {
	if (rawValue === '-' || rawValue === null || rawValue === undefined) return '-';
	var decimals = variable ? variable.Decimals : 0;
	switch (metric.properties.SummaryMetric) {
		case 'N':
			return h.formatNum(rawValue, decimals);
		case 'I':
		case 'P':
		case 'A':
		case 'FIL':
			return h.formatPercentNumber(rawValue);
		case 'K':
		case 'H':
		case 'D':
			return h.formatKm(rawValue);
		default:
			return h.formatNum(rawValue, decimals);
	}
}

// Atajo: calcula y formatea la celda en un paso.
export function displayCell(metric, variable, cell) {
	return formatValue(metric, variable, cellValue(metric, variable, cell));
}

// Encabezado de la columna según el modo y la variable
// (mismo criterio que Summary.getValueHeader).
export function valueHeader(metric, variable) {
	return valueHeaderForKey(metric.properties.SummaryMetric, variable);
}

// Símbolo de un modo de resumen dado su Key, sin depender del estado actual del
// metric. Útil para listar todos los modos disponibles (combo de tipo).
export function valueHeaderForKey(key, variable) {
	switch (key) {
		case 'K': return 'Km<sup>2</sup>';
		case 'H': return 'Ha';
		case 'A': return '% Km<sup>2</sup>';
		case 'P': return 'COL %';
		case 'FIL': return 'FIL %';
		case 'I':
			switch (variable ? variable.NormalizationScale : null) {
				case 100: return '%';
				case 1: return '/1';
				case 1000: return '/k';
				case 10000: return '/10k';
				case 100000: return '/100k';
				case 1000000: return '/1M';
			}
			return 'N/A';
		case 'D': return 'N/Km<sup>2</sup>';
		case 'N': return 'N';
		case 'T': return 'T';
		default: return '?';
	}
}

export default { cellValue, formatValue, displayCell, valueHeader, valueHeaderForKey };
