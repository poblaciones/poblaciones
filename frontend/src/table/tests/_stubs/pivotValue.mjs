/* Stub mínimo de pivotValue (cellValue) para tests. */
export function cellValue() { return null; }
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
