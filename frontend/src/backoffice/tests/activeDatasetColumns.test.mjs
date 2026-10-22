import { describe, it, expect } from './_harness.mjs';
import { makeActive, makeColumn, captionsOf, idsOf } from './activeDatasetFixtures.mjs';

const NUMBER = 5;
const STRING = 1;

function thrownMessage(action) {
	try {
		action();
	} catch (e) {
		return e.message;
	}
	return null;
}

// Dataset con tres columnas: numérica con etiquetas, numérica sin etiquetas y de texto.
function makeLoadedDataset(propertyOverrides) {
	const dataset = makeActive(propertyOverrides);
	dataset.Columns = [
		makeColumn(1, 'edad', NUMBER, { Caption: 'Edad', Label: 'Edad (años)', Decimals: 2, Alignment: 1 }),
		makeColumn(2, 'peso', NUMBER, { Caption: 'Peso' }),
		makeColumn(3, 'region', STRING, { Caption: 'Región' }),
	];
	dataset.Labels = { 1: [{ Value: 1, Caption: 'Uno' }, { Value: 2, Caption: 'Dos' }], 2: [] };
	return dataset;
}

function makeVariable(overrides) {
	return Object.assign({
		Data: 'N', DataColumn: null, DataColumnIsCategorical: false, IsGap: false, GapData: null, GapDataColumn: null,
		FilterValue: null, Symbology: { CutMode: 'J', CutColumn: null },
	}, overrides);
}

describe('ActiveDataset: columnas especiales y de dos partes');

it('GetRichColumns ofrece solo Conteo en una capa (L) y las siete columnas ricas en el resto', () => {
	expect(captionsOf(makeActive({ Type: 'L' }).GetRichColumns())).toEqual(['Conteo']);
	const rich = makeActive({ Type: 'R' }).GetRichColumns();
	expect(rich.map(function (column) { return column.Code; })).toEqual(['N', 'P', 'H', 'A', 'C', 'M', 'K']);
	expect(idsOf(rich)).toEqual([-10, -1, -2, -3, -4, -5, -6]);
});

it('GetNullColumn y GetSeparator devuelven la columna vacía y un separador con su identificador', () => {
	const dataset = makeActive();
	expect(dataset.GetNullColumn()).toEqual([{ Id: 0, Caption: '[Ninguna]', Code: null }]);
	expect(dataset.GetSeparator('Título')).toEqual([{ Id: -100, Caption: 'Título', Code: 'O', Separator: true }]);
	expect(dataset.GetSeparator('Título', -1000)[0].Id).toBe(-1000);
});

it('toTwoColumnVariable separa la columna real de las especiales y de la ausencia de columna', () => {
	const dataset = makeLoadedDataset();
	expect(dataset.toTwoColumnVariable({ Id: null })).toEqual({ Info: null, Column: null });
	expect(dataset.toTwoColumnVariable({ Id: -100 })).toEqual({ Info: null, Column: null });
	expect(dataset.toTwoColumnVariable({ Id: 0 })).toEqual({ Info: null, Column: null });
	expect(dataset.toTwoColumnVariable(dataset.Columns[0])).toEqual({ Info: 'O', Column: dataset.Columns[0] });
	expect(dataset.toTwoColumnVariable({ Id: -1 })).toEqual({ Info: 'P', Column: null });
});

it('toTwoColumnVariable falla con una columna especial desconocida', () => {
	expect(thrownMessage(function () { makeActive().toTwoColumnVariable({ Id: -99 }); })).toBe('Columna no reconocida.');
});

it('fromTwoColumnVariable resuelve la ausencia, la columna real y las especiales por código', () => {
	const dataset = makeLoadedDataset();
	expect(dataset.fromTwoColumnVariable(null, null).Caption).toBe('[Ninguna]');
	expect(dataset.fromTwoColumnVariable('O', dataset.Columns[0]) === dataset.Columns[0]).toBeTruthy();
	expect(dataset.fromTwoColumnVariable('P', null).Caption).toBe('Población total');
});

it('fromTwoColumnVariable falla con un código desconocido', () => {
	expect(thrownMessage(function () { makeActive().fromTwoColumnVariable('Z', null); })).toBe('La columna no pudo ser reconocida.');
});

it('formatTwoColumnVariable y su tooltip usan la etiqueta de la columna real', () => {
	const dataset = makeLoadedDataset();
	expect(dataset.formatTwoColumnVariable('O', dataset.Columns[0])).toBe('edad - Edad (años)');
	expect(dataset.formatTwoColumnVariable('O', dataset.Columns[0], true)).toBe('edad');
	expect(dataset.formatTwoColumnVariable(null, null)).toBe('[Ninguna]');
	expect(dataset.formatTwoColumnVariableTooltip('O', dataset.Columns[0])).toBe('Edad (años)');
	expect(dataset.formatTwoColumnVariableTooltip('P', null)).toBe('');
});

it('formatNormalizationScale devuelve el título de la escala y falla con una desconocida', () => {
	const dataset = makeActive();
	expect(dataset.formatNormalizationScale(100)).toBe('Porcentaje');
	expect(dataset.formatNormalizationScale(1000)).toBe('n cada mil');
	expect(thrownMessage(function () { dataset.formatNormalizationScale(7); })).toBe('La escala de normalización no pudo ser reconocida.');
});

it('GetNormalizationScales enumera las seis escalas con porcentaje primero', () => {
	expect(idsOf(makeActive().GetNormalizationScales())).toEqual([100, 1, 1000, 10000, 100000, 1000000]);
});

describe('ActiveDataset: búsqueda de columnas');

it('GetColumnById compara los identificadores como texto y falla si no existe', () => {
	const dataset = makeLoadedDataset();
	expect(dataset.GetColumnById('2').Variable).toBe('peso');
	expect(dataset.GetColumnById(3).Variable).toBe('region');
	expect(thrownMessage(function () { dataset.GetColumnById(99); })).toBe('Columna no encontrada.');
});

it('GetColumnFromVariable devuelve la columna y, si no existe, falla o devuelve null según se pida', () => {
	const dataset = makeLoadedDataset();
	expect(dataset.GetColumnFromVariable('peso').Id).toBe(2);
	expect(thrownMessage(function () { dataset.GetColumnFromVariable('nada'); })).toBe('Columna no encontrada.');
	expect(dataset.GetColumnFromVariable('nada', false)).toBeNull();
});

it('GetLabelFromVariable devuelve el título, [ND] si no existe y cadena vacía sin columnas cargadas', () => {
	const dataset = makeLoadedDataset();
	expect(dataset.GetLabelFromVariable('region')).toBe('Región');
	expect(dataset.GetLabelFromVariable('nada')).toBe('[ND]');
	expect(makeActive().GetLabelFromVariable('region')).toBe('');
});

it('GetNewUniqueVariableName agrega el menor sufijo numérico libre', () => {
	const dataset = makeLoadedDataset();
	dataset.Columns.push(makeColumn(4, 'edad_1', NUMBER));
	expect(dataset.GetNewUniqueVariableName('talla')).toBe('talla');
	expect(dataset.GetNewUniqueVariableName('peso')).toBe('peso_1');
	expect(dataset.GetNewUniqueVariableName('edad')).toBe('edad_2');
});

describe('ActiveDataset: listas de columnas por tipo');

it('separa las columnas numéricas, de texto y numéricas con etiquetas', () => {
	const dataset = makeLoadedDataset();
	expect(idsOf(dataset.GetNumericColumns())).toEqual([1, 2]);
	expect(idsOf(dataset.GetTextColumns())).toEqual([3]);
	expect(idsOf(dataset.GetNumericWithLabelColumns())).toEqual([1]);
});

it('las columnas para secuencia son las numéricas y las de corte son las numéricas con etiquetas más las de texto', () => {
	const dataset = makeLoadedDataset();
	expect(idsOf(dataset.GetColumnsForSequenceColumn())).toEqual([1, 2]);
	expect(idsOf(dataset.GetColumnsForCutColumn())).toEqual([1, 3]);
});

it('sin columnas cargadas todas las listas están vacías', () => {
	const dataset = makeActive();
	expect(dataset.GetNumericColumns()).toEqual([]);
	expect(dataset.GetTextColumns()).toEqual([]);
	expect(dataset.GetNumericWithLabelColumns()).toEqual([]);
	expect(dataset.GetColumnsForCutColumn()).toEqual([]);
	expect(dataset.GetColumnsForJqxGrid(false)).toEqual([]);
	expect(dataset.GetDataFieldsForJqxGrid(false)).toEqual([]);
});

it('ColumnHasLabels es verdadero solo si la columna tiene al menos una etiqueta', () => {
	const dataset = makeLoadedDataset();
	expect(dataset.ColumnHasLabels({ Id: 1 })).toBeTruthy();
	expect(dataset.ColumnHasLabels({ Id: 2 })).toBeFalsy();
	expect(dataset.ColumnHasLabels({ Id: 9 })).toBeFalsy();
	expect(makeActive().ColumnHasLabels({ Id: 1 })).toBeFalsy();
});

it('GetNumericTextAndRichColumns agrega separadores, la columna vacía si se pide y omite las del dataset si no hay', () => {
	const dataset = makeLoadedDataset();
	expect(captionsOf(dataset.GetNumericTextAndRichColumns(false)).slice(0, 5)).toEqual(['Variables del dataset', 'Edad', 'Peso', 'Región', 'Otras variables']);
	expect(captionsOf(dataset.GetNumericTextAndRichColumns(true))[0]).toBe('[Ninguna]');
	const unloaded = makeActive({ Type: 'L' });
	expect(captionsOf(unloaded.GetNumericTextAndRichColumns(false))).toEqual(['Otras variables', 'Conteo']);
});

it('GetNumericAndTextColumns separa numéricas y de texto con separadores de distinto identificador', () => {
	const result = makeLoadedDataset().GetNumericAndTextColumns(true);
	expect(captionsOf(result)).toEqual(['[Ninguna]', 'Variables numéricas', 'Edad', 'Peso', 'Otras variables', 'Región']);
	expect(result[1].Id).toBe(-100);
	expect(result[4].Id).toBe(-1000);
});

it('GetNumericAndRichColumns lista las numéricas seguidas de las columnas ricas', () => {
	const result = makeLoadedDataset({ Type: 'L' }).GetNumericAndRichColumns(false);
	expect(captionsOf(result)).toEqual(['Variables del dataset', 'Edad', 'Peso', 'Otras variables', 'Conteo']);
});

describe('ActiveDataset: opciones fijas');

it('ofrece las alineaciones, medidas y formatos válidos para una columna', () => {
	const dataset = makeActive();
	expect(captionsOf(dataset.ValidAlignments())).toEqual(['Izquierda', 'Derecha', 'Centrado']);
	expect(idsOf(dataset.ValidMeasures())).toEqual([1, 2, 3]);
	expect(idsOf(dataset.ValidMeasuresString())).toEqual([1, 2]);
	expect(idsOf(dataset.ValidFormats())).toEqual([1, 5]);
});

describe('ActiveDataset: ResolveVariableCaption');

it('una variable de conteo se titula Conteo', () => {
	expect(makeLoadedDataset().ResolveVariableCaption(makeVariable())).toBe('Conteo');
});

it('una variable sobre una columna usa su etiqueta y una categórica se titula Conteo', () => {
	const dataset = makeLoadedDataset();
	const onColumn = makeVariable({ Data: 'O', DataColumn: dataset.Columns[0] });
	expect(dataset.ResolveVariableCaption(onColumn)).toBe('Edad (años)');
	onColumn.DataColumnIsCategorical = true;
	expect(dataset.ResolveVariableCaption(onColumn)).toBe('Conteo');
});

it('una variable sobre una columna especial usa el título de esa columna', () => {
	expect(makeLoadedDataset().ResolveVariableCaption(makeVariable({ Data: 'P' }))).toBe('Población total');
});

it('con criterio de corte por variable agrega "por" y la columna de corte', () => {
	const dataset = makeLoadedDataset();
	const variable = makeVariable({ Symbology: { CutMode: 'V', CutColumn: dataset.Columns[2] } });
	expect(dataset.ResolveVariableCaption(variable)).toBe('Conteo por region');
});

it('con criterio de corte por variable y sin texto previo usa "Por"', () => {
	const dataset = makeLoadedDataset();
	const blank = makeColumn(9, '', NUMBER, { Caption: '' });
	const variable = makeVariable({ Data: 'O', DataColumn: blank, Symbology: { CutMode: 'V', CutColumn: dataset.Columns[2] } });
	expect(dataset.ResolveVariableCaption(variable)).toBe('Por region');
});

it('una brecha describe ambos términos, usando Conteo cuando el dato es de conteo', () => {
	const dataset = makeLoadedDataset();
	const countVersusColumn = makeVariable({ IsGap: true, Data: 'N', GapData: 'O', GapDataColumn: dataset.Columns[0] });
	expect(dataset.ResolveVariableCaption(countVersusColumn)).toBe("Brecha de 'Conteo' con respecto a 'Edad (años)'");
	const columnVersusCount = makeVariable({ IsGap: true, Data: 'O', DataColumn: dataset.Columns[0], GapData: 'N' });
	expect(dataset.ResolveVariableCaption(columnVersusCount)).toBe("Brecha de 'Edad (años)' con respecto a 'Conteo'");
});

it('con un filtro agrega su descripción entre paréntesis', () => {
	const dataset = makeLoadedDataset();
	const variable = makeVariable({ FilterValue: 'edad\t>\t5' });
	expect(dataset.ResolveVariableCaption(variable)).toBe('Conteo (Edad > 5)');
});

describe('ActiveDataset: filtros');

it('makeFilter une variable, operador y valor con tabulaciones, omitiendo el valor en los operadores unarios', () => {
	const dataset = makeActive();
	expect(dataset.makeFilter({ Variable: 'edad' }, '>', 5)).toBe('edad\t>\t5');
	expect(dataset.makeFilter({ Variable: 'edad' }, 'IS NULL', 5)).toBe('edad\tIS NULL\t');
	expect(dataset.makeFilter({ Variable: 'edad' }, 'IS NOT NULL', 5)).toBe('edad\tIS NOT NULL\t');
});

it('parseFilter traduce los operadores a texto legible y marca los unarios', () => {
	const dataset = makeLoadedDataset();
	const parse = function (text) { return dataset.parseFilter({ FilterValue: text }); };
	expect(parse('edad\t<>\t5').FormattedOperator).toBe(' ≠ ');
	expect(parse('edad\tLIKE\t5').FormattedOperator).toBe(' contiene ');
	expect(parse('edad\tNOT LIKE\t5').FormattedOperator).toBe(' no contiene ');
	expect(parse('edad\t>=\t5').FormattedOperator).toBe(' >= ');
	const isNull = parse('edad\tIS NULL\t');
	expect(isNull.FormattedOperator).toBe(' = nulo o vacío');
	expect(isNull.IsUnary).toBeTruthy();
	const isNotNull = parse('edad\tIS NOT NULL\t');
	expect(isNotNull.FormattedOperator).toBe(' <> nulo o vacío');
	expect(isNotNull.IsUnary).toBeTruthy();
	expect(parse('edad\t=\t5').IsUnary).toBeFalsy();
});

it('parseFilter resuelve la columna y quita las comillas del valor', () => {
	const dataset = makeLoadedDataset();
	const quoted = dataset.parseFilter({ FilterValue: "region\t=\t'Norte'" });
	expect(quoted.Column.Id).toBe(3);
	expect(quoted.Value).toBe("'Norte'");
	expect(quoted.FormattedValue).toBe('Norte');
	expect(dataset.parseFilter({ FilterValue: 'region\t=\t"Sur"' }).FormattedValue).toBe('Sur');
	expect(dataset.parseFilter({ FilterValue: "region\t=\t'" }).FormattedValue).toBe("'");
	expect(dataset.parseFilter({ FilterValue: 'region\t=\t5' }).FormattedValue).toBe('5');
});

it('parseFilter con una variable inexistente deja la columna en null', () => {
	expect(makeLoadedDataset().parseFilter({ FilterValue: 'nada\t=\t5' }).Column).toBeNull();
});

it('formatFilter arma el texto con el título de la columna y omite el valor en los unarios', () => {
	const dataset = makeLoadedDataset();
	expect(dataset.formatFilter({ FilterValue: "region\t=\t'Norte'" })).toBe('Región = Norte');
	expect(dataset.formatFilter({ FilterValue: 'region\tIS NULL\t' })).toBe('Región = nulo o vacío');
});

describe('ActiveDataset: grilla');

it('GetColumnsForJqxGrid arma una columna por variable con formato, alineación, ancho y filtro por etiquetas', () => {
	const grid = makeLoadedDataset().GetColumnsForJqxGrid(false);
	expect(grid).toHaveLength(3);
	expect(grid[0].text).toBe('edad');
	expect(grid[0].datafield).toBe('edad');
	expect(grid[0].cellsformat).toBe('d2');
	expect(grid[0].cellsalign).toBe('right');
	expect(grid[0].align).toBe('center');
	expect(grid[0].filtertype).toBe('list');
	expect(grid[0].filteritems).toEqual([{ label: '1. Uno', value: 1 }, { label: '2. Dos', value: 2 }]);
	expect(grid[2].cellsformat).toBe(undefined);
	expect(grid[2].filtertype).toBe(undefined);
});

it('el ancho de la columna es 10 veces su ancho de datos, con mínimo 100 y 200 para anchos grandes', () => {
	const dataset = makeLoadedDataset();
	dataset.Columns[0].ColumnWidth = 5;
	dataset.Columns[1].ColumnWidth = 15;
	dataset.Columns[2].ColumnWidth = 40;
	const grid = dataset.GetColumnsForJqxGrid(false);
	expect(grid.map(function (column) { return column.width; })).toEqual(['100px', '150px', '200px']);
});

it('con errores visibles antepone la columna fija Problema', () => {
	const grid = makeLoadedDataset().GetColumnsForJqxGrid(true);
	expect(grid).toHaveLength(4);
	expect(grid[0].text).toBe('Problema');
	expect(grid[0].datafield).toBe('internal__Err');
	expect(grid[0].width).toBe(320);
	expect(grid[0].pinned).toBeTruthy();
});

it('con validación hace editables las columnas y les asigna la función', () => {
	const validate = function () {};
	const grid = makeLoadedDataset().GetColumnsForJqxGrid(false, validate);
	expect(grid[0].editable).toBeTruthy();
	expect(grid[0].validation === validate).toBeTruthy();
	expect(makeLoadedDataset().GetColumnsForJqxGrid(false)[0].editable).toBe(undefined);
});

it('spssAlignmentToGridAligment traduce 0, 1 y 2 y centra el resto', () => {
	const dataset = makeActive();
	expect(dataset.spssAlignmentToGridAligment(0)).toBe('left');
	expect(dataset.spssAlignmentToGridAligment(1)).toBe('right');
	expect(dataset.spssAlignmentToGridAligment(2)).toBe('center');
	expect(dataset.spssAlignmentToGridAligment(7)).toBe('center');
});

it('getLabelList arma las opciones "valor. título"', () => {
	expect(makeActive().getLabelList([{ Value: 3, Caption: 'Tres' }])).toEqual([{ label: '3. Tres', value: 3 }]);
	expect(makeActive().getLabelList([])).toEqual([]);
});

it('el encabezado de la columna muestra el nombre con un tooltip que agrega el título si difiere', () => {
	const dataset = makeLoadedDataset();
	const rendered = [];
	const element = { html(content) { rendered.push(content); } };
	const withCaption = { text: 'edad' };
	dataset.setRenderer(withCaption);
	withCaption.rendered(element);
	expect(rendered[0]).toBe('<span style="cursor: default;" title="edad - Edad">edad</span>');
	dataset.Columns[0].Caption = 'edad';
	withCaption.rendered(element);
	expect(rendered[1]).toBe('<span style="cursor: default;" title="edad">edad</span>');
	dataset.Columns[0].Caption = '   ';
	withCaption.rendered(element);
	expect(rendered[2]).toBe('<span style="cursor: default;" title="edad">edad</span>');
});

it('el encabezado escapa el HTML del nombre de la variable', () => {
	const dataset = makeLoadedDataset();
	dataset.Columns.push(makeColumn(4, '<b>x', STRING, { Caption: '' }));
	const column = { text: '<b>x' };
	let html = null;
	dataset.setRenderer(column);
	column.rendered({ html(content) { html = content; } });
	expect(html.includes('<b>')).toBeFalsy();
	expect(html.includes('&lt;b&gt;x')).toBeTruthy();
});

it('cellsRenderer formatea los numéricos con sus decimales y coma, y escapa el texto', () => {
	const dataset = makeActive();
	const numeric = dataset.cellsRenderer(0, 'edad', 3.5, '', { cellsformat: 'd2', cellsalign: 'right' });
	expect(numeric).toBe('<div class="gridCell" style="overflow: hidden !important;text-align:right">3,50</div>');
	const text = dataset.cellsRenderer(0, 'region', '<i>Norte</i>', '', { cellsalign: 'left' });
	expect(text.includes('&lt;i&gt;Norte&lt;/i&gt;')).toBeTruthy();
	expect(text.includes('text-align:left')).toBeTruthy();
});

it('cellsRenderer deja vacía la celda numérica sin valor', () => {
	const html = makeActive().cellsRenderer(0, 'edad', '', '', { cellsformat: 'd2', cellsalign: 'right' });
	expect(html).toBe('<div class="gridCell" style="overflow: hidden !important;text-align:right"></div>');
});

it('GetDataFieldsForJqxGrid define un campo por columna con su tipo y cierra con el identificador interno', () => {
	const fields = makeLoadedDataset().GetDataFieldsForJqxGrid(false);
	expect(fields).toEqual([
		{ name: 'edad', map: '0', type: 'number' },
		{ name: 'peso', map: '1', type: 'number' },
		{ name: 'region', map: '2', type: 'string' },
		{ name: 'internal__Id', type: 'number', map: '3' },
	]);
});

it('con errores visibles el campo de error ocupa la primera posición', () => {
	const fields = makeLoadedDataset().GetDataFieldsForJqxGrid(true);
	expect(fields[0]).toEqual({ name: 'internal__Err', type: 'string', map: '0' });
	expect(fields[1].map).toBe('1');
	expect(fields[4]).toEqual({ name: 'internal__Id', type: 'number', map: '4' });
});

it('GetDataFieldByColumnId devuelve el campo de la columna y falla con una columna inexistente', () => {
	const dataset = makeLoadedDataset();
	expect(dataset.GetDataFieldByColumnId(false, 3)).toEqual({ name: 'region', map: '2', type: 'string' });
	expect(thrownMessage(function () { dataset.GetDataFieldByColumnId(false, 99); })).toBe('Columna no encontrada.');
});
