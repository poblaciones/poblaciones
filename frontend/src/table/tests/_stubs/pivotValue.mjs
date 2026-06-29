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
