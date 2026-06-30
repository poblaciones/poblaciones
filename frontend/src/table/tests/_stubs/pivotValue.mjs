/* Stub mínimo de pivotValue (cellValue) para tests. */
export function cellValue(metric, variable, cell) {
	if (!cell || cell.Empty) return '-';
	var sm = metric && metric.properties ? metric.properties.SummaryMetric : null;
	// Refleja el cálculo de brecha para poder testear su propagación (subtotales,
	// agregados). Sin gap, devuelve el value crudo o el total según el modo.
	if (variable && variable.IsGap && sm === 'I') {
		if (cell.Value == null || cell.ValueGap == null) return '-';
		var scale = variable.NormalizationScale || 1;
		var v1 = cell.Value / (cell.Total / scale);
		var v2 = cell.ValueGap / (cell.TotalGap / scale);
		var d = (scale === 100) ? (v2 - v1) : ((v2 / v1 - 1) * 100);
		return isFinite(d) ? d : '-';
	}
	if (sm === 'T') return cell.Total;
	// Incidencia (I): value sobre el Total propio de la celda, por la escala. Es lo
	// que permite testear que el Camino 1 use el total propio de la categoría (su
	// incidencia real) y no el del universo.
	if (sm === 'I') {
		if (cell.Total == null || Number(cell.Total) === 0) return cell.Value;
		var scaleI = (variable && variable.NormalizationScale) || 100;
		return cell.Value / (Number(cell.Total) / scaleI);
	}
	// Modos normalizados por denominador derivado, para poder testear que el Camino 1
	// los provea (col%, fil%, col-área). Reflejan value/denominador * 100.
	if (sm === 'P') return cell.ColumnTotal ? (cell.Value / cell.ColumnTotal * 100) : cell.Value;
	if (sm === 'FIL') return cell.RowGroupTotal ? (cell.Value / cell.RowGroupTotal * 100) : cell.Value;
	if (sm === 'A') return cell.ColumnArea ? (cell.Area / cell.ColumnArea * 100) : cell.Area;
	if (sm === 'K') return cell.Area != null ? cell.Area / 1e6 : null;
	return cell.Value;
}
export function valueTuple(summaryMetric, variable, cell) {
	if (summaryMetric === 'T') return { value: cell.Total };
	return { value: cell.Value };
}
export function valueHeader() { return ''; }
export function valueHeaderForKey() { return ''; }
export function displayCell(metric, variable, cell) {
	if (cell == null) return '';
	return cell.Display != null ? cell.Display : (cell.Value != null ? String(cell.Value) : '');
}
export function formatValue() { return ''; }
