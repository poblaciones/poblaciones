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
// solo de Value/Total; para el resto normaliza por Total/NormalizationScale.
function valueTuple(summaryMetric, variable, cell) {
	var value = Number(cell.Value);
	var total = Number(cell.Total);
	var scale = (variable && variable.NormalizationScale) ? variable.NormalizationScale : 1;
	switch (summaryMetric) {
		case 'N': // conteo
			return { value: value };
		case 'I': // índice / proporción normalizada
			return { value: value, normalization: total / scale };
		case 'P': // % de columna: value sobre el total vertical de la columna
			return { value: value, normalization: (cell.ColumnTotal ? cell.ColumnTotal / 100 : undefined) };
		// K (área), H (hectáreas), A (distribución de área) y D (densidad)
		// dependen de la suma de Km2 por celda, que la pivot aún no recibe.
		// Quedan deshabilitados en el ciclo de modos (ver MetricHeader) hasta
		// que ResolveCell agregue el área. Por defecto se normaliza por Total.
		default:
			return { value: value, normalization: total / scale };
	}
}

// Valor numérico calculado de la celda (ya normalizado).
export function cellValue(metric, variable, cell) {
	if (!cell || cell.Empty || cell.Value === null || cell.Value === undefined) return '-';
	return h.calculateValue(valueTuple(metric.properties.SummaryMetric, variable, cell));
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
	switch (metric.properties.SummaryMetric) {
		case 'K': return 'Km<sup>2</sup>';
		case 'H': return 'Ha';
		case 'A': return '% Km<sup>2</sup>';
		case 'P': return 'COL %';
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
		default: return '?';
	}
}

export default { cellValue, formatValue, displayCell, valueHeader };
