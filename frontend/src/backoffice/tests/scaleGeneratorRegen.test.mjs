import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, flushPromises, captureConsoleAsync } from './fixtures.mjs';
import axios from '@/common/tests/_stubs/axios.cjs';
import ScaleGenerator from '@/backoffice/classes/ScaleGenerator';
import { makeValue, makeVariable, makeDataset, captions } from './scaleGeneratorFixtures.mjs';

const STRING_URL = 'https://api.example.org/services/backoffice/GetColumnStringDistributions';
const NUMERIC_URL = 'https://api.example.org/services/backoffice/GetColumnDistributions';
const JENKS_DATA = { HasNulls: false, Groups: { 3: { jenks: [10, 20] } }, MinValue: 0, MaxValue: 100 };

function setup() {
	axios.reset();
	return setupBackoffice();
}

function makeGenerator(dataset) {
	return new ScaleGenerator(dataset || makeDataset());
}

function makeLevel(variables) {
	return { Id: 1, Variables: variables };
}

describe('ScaleGenerator: GetColumnDistributions');

it('en modo por variable consulta las distribuciones de texto con la columna de corte y el filtro', async () => {
	setup();
	axios.respond('get', { data: [{ Caption: 'A', Value: 'a' }] });
	const variable = makeVariable({ CutMode: 'V', CutColumn: { Id: 5 } }, { FilterValue: 'x' });
	const data = await makeGenerator().GetColumnDistributions(variable);
	expect(axios.calls[0].url).toBe(STRING_URL);
	expect(axios.calls[0].config.params).toEqual({ k: 42, c: 5, f: 'x' });
	expect(data).toEqual([{ Caption: 'A', Value: 'a' }]);
});

it('en modo por variable sin columna de corte consulta la columna 0', async () => {
	setup();
	axios.respond('get', { data: [] });
	await makeGenerator().GetColumnDistributions(makeVariable({ CutMode: 'V', CutColumn: null }));
	expect(axios.calls[0].config.params.c).toBe(0);
});

it('en los demás modos consulta las distribuciones numéricas con datos, normalización y brecha', async () => {
	setup();
	axios.respond('get', { data: JENKS_DATA });
	const variable = makeVariable({}, {
		Data: 'O', DataColumn: { Id: 3 }, Normalization: 'P', NormalizationColumn: { Id: 4 }, NormalizationScale: 100,
		GapData: 'O', GapDataColumn: { Id: 6 }, GapNormalization: 'P', GapNormalizationColumn: null, FilterValue: null,
	});
	await makeGenerator().GetColumnDistributions(variable);
	expect(axios.calls[0].url).toBe(NUMERIC_URL);
	expect(axios.calls[0].config.params).toEqual({
		k: 42, c: 'O', ci: 3, o: 'P', oi: 4, gc: 'O', gci: 6, go: 'P', goi: 0, s: 100, f: null,
	});
});

describe('ScaleGenerator: RegenVariableCategories');

it('sin datos en caché los pide, los guarda y crea las categorías', async () => {
	setup();
	axios.respond('get', { data: JENKS_DATA });
	const generator = makeGenerator();
	const variable = makeVariable({ CutMode: 'J' });
	await generator.RegenVariableCategories(makeLevel([variable]), variable);
	expect(axios.calls).toHaveLength(1);
	expect(generator.HasData(variable)).toBeTruthy();
	expect(captions(variable)).toEqual(['Menor que 10', '10 a 20', '20 y más']);
	expect(generator.RegenPending[generator.createKey(variable)]).toBeNull();
});

it('con datos en caché crea las categorías sin pedir nada al servidor', async () => {
	setup();
	const generator = makeGenerator();
	const variable = makeVariable({ CutMode: 'J' });
	generator.InfoCache[generator.createKey(variable)] = JENKS_DATA;
	await generator.RegenVariableCategories(makeLevel([variable]), variable);
	expect(axios.calls).toHaveLength(0);
	expect(captions(variable)).toHaveLength(3);
});

it('si ya hay una consulta pendiente para la clave deja la variable más nueva para que la atienda', async () => {
	setup();
	axios.respond('get', { data: JENKS_DATA });
	const generator = makeGenerator();
	const first = makeVariable({ CutMode: 'J' });
	const second = makeVariable({ CutMode: 'J' });
	const level = makeLevel([first, second]);
	const firstRegen = generator.RegenVariableCategories(level, first);
	await generator.RegenVariableCategories(level, second);
	await firstRegen;
	expect(axios.calls).toHaveLength(1);
	expect(captions(second)).toHaveLength(3);
	expect(captions(first)).toHaveLength(0);
});

it('si la consulta falla muestra el error, marca la clave como no pendiente y resuelve con el error', async () => {
	const browser = setup();
	axios.respond('get', new Error('boom'));
	const generator = makeGenerator();
	const variable = makeVariable({ CutMode: 'J' });
	let outcome = null;
	await captureConsoleAsync(async function () {
		outcome = await generator.RegenVariableCategories(makeLevel([variable]), variable);
	});
	expect(outcome.message).toBe('boom');
	expect(browser.alerts).toHaveLength(1);
	expect(generator.RegenPending[generator.createKey(variable)]).toBe(false);
	expect(generator.HasData(variable)).toBeFalsy();
});

describe('ScaleGenerator: regenerar y grabar');

it('RegenAndSaveVariable regenera las categorías y luego graba la variable', async () => {
	setup();
	const dataset = makeDataset();
	const generator = makeGenerator(dataset);
	const variable = makeVariable({ CutMode: 'S' });
	generator.InfoCache[generator.createKey(variable)] = {};
	const level = makeLevel([variable]);
	await generator.RegenAndSaveVariable(level, variable);
	expect(captions(variable)).toEqual(['Total']);
	expect(dataset.updated).toHaveLength(1);
	expect(dataset.updated[0].variable === variable).toBeTruthy();
	expect(dataset.updated[0].level === level).toBeTruthy();
});

it('RegenAndSaveAllLevelVariables procesa las variables de a una y en orden', async () => {
	setup();
	const dataset = makeDataset();
	const generator = makeGenerator(dataset);
	const first = makeVariable({ CutMode: 'S' }, { Id: 1 });
	const second = makeVariable({ CutMode: 'S' }, { Id: 2, Data: 'O' });
	generator.InfoCache[generator.createKey(first)] = {};
	generator.InfoCache[generator.createKey(second)] = {};
	await generator.RegenAndSaveAllLevelVariables(makeLevel([first, second]));
	expect(dataset.updated.map(function (entry) { return entry.variable.Id; })).toEqual([1, 2]);
});

it('RegenAndSaveAllVariables recorre todos los niveles del dataset', async () => {
	setup();
	const dataset = makeDataset();
	const generator = makeGenerator(dataset);
	const first = makeVariable({ CutMode: 'S' }, { Id: 1 });
	const second = makeVariable({ CutMode: 'S' }, { Id: 2, Data: 'O' });
	generator.InfoCache[generator.createKey(first)] = {};
	generator.InfoCache[generator.createKey(second)] = {};
	dataset.MetricVersionLevels = [makeLevel([first]), makeLevel([second])];
	generator.RegenAndSaveAllVariables();
	await flushPromises();
	expect(dataset.updated).toHaveLength(2);
});

describe('ScaleGenerator: variables afectadas por columnas eliminadas');

it('una columna de datos eliminada deja la variable sin datos y en categoría única', () => {
	const dataset = makeDataset();
	const affected = makeVariable({ CutMode: 'J' }, { Data: 'O', DataColumn: { Id: 8 }, Values: [makeValue('x', 1, 1)] });
	const other = makeVariable({ CutMode: 'J' }, { Data: 'O', DataColumn: { Id: 9 } });
	dataset.MetricVersionLevels = [makeLevel([affected, other])];
	makeGenerator(dataset).RegenAndSaveVariablesAffectedByDeletedDataColumnIds([8]);
	expect(affected.DataColumn).toBeNull();
	expect(affected.Data).toBe('N');
	expect(affected.Symbology.CutMode).toBe('S');
	expect(captions(affected)).toEqual(['Total']);
	expect(other.DataColumn.Id).toBe(9);
	expect(dataset.updated).toHaveLength(1);
});

it('una columna de datos eliminada no afecta a variables que no son de tipo O', () => {
	const dataset = makeDataset();
	const variable = makeVariable({ CutMode: 'J' }, { Data: 'N', DataColumn: { Id: 8 } });
	dataset.MetricVersionLevels = [makeLevel([variable])];
	makeGenerator(dataset).RegenAndSaveVariablesAffectedByDeletedDataColumnIds([8]);
	expect(dataset.updated).toHaveLength(0);
});

it('una columna de corte eliminada pasa la variable a categoría única', () => {
	const dataset = makeDataset();
	const affected = makeVariable({ CutMode: 'V', CutColumn: { Id: 5 } }, { Values: [makeValue('x', 'x', 1)] });
	const other = makeVariable({ CutMode: 'V', CutColumn: { Id: 6 } });
	dataset.MetricVersionLevels = [makeLevel([affected, other])];
	makeGenerator(dataset).RegenAndSaveVariablesAffectedByDeletedCutColumnsIds([5]);
	expect(affected.Symbology.CutMode).toBe('S');
	expect(affected.Symbology.CutColumn).toBeNull();
	expect(captions(affected)).toEqual(['Total']);
	expect(other.Symbology.CutMode).toBe('V');
	expect(dataset.updated).toHaveLength(1);
});

it('una columna de secuencia eliminada se quita de las variables que la usan, aceptando ids como texto', () => {
	const dataset = makeDataset();
	const affected = makeVariable({ SequenceColumn: { Id: 3 }, IsSequence: 'N' });
	const other = makeVariable({ SequenceColumn: null });
	dataset.MetricVersionLevels = [makeLevel([affected, other])];
	makeGenerator(dataset).RegenAndSaveVariablesAffectedByDeletedSequenceIds(['3']);
	expect(affected.Symbology.SequenceColumn).toBeNull();
	expect(affected.Symbology.IsSequence).toBe('S');
	expect(dataset.updated).toHaveLength(1);
});

describe('ScaleGenerator: cambio de etiquetas de una columna');

it('reemplaza la columna en normalización y datos y graba la variable una vez', () => {
	const dataset = makeDataset();
	const changed = { Id: 4, Label: 'nueva' };
	const variable = makeVariable({ CutMode: 'J' }, { NormalizationColumn: { Id: 4 }, DataColumn: { Id: 4 } });
	dataset.MetricVersionLevels = [makeLevel([variable])];
	makeGenerator(dataset).RegenAndSaveVariablesAffectedByLabelChange(changed);
	expect(variable.NormalizationColumn === changed).toBeTruthy();
	expect(variable.DataColumn === changed).toBeTruthy();
	expect(dataset.updated).toHaveLength(1);
});

it('no graba las variables que no usan la columna', () => {
	const dataset = makeDataset();
	const variable = makeVariable({ CutMode: 'J' }, { DataColumn: { Id: 1 } });
	dataset.MetricVersionLevels = [makeLevel([variable])];
	makeGenerator(dataset).RegenAndSaveVariablesAffectedByLabelChange({ Id: 4 });
	expect(dataset.updated).toHaveLength(0);
});

it('si la columna es de corte regenera las categorías además de grabar', async () => {
	setup();
	const dataset = makeDataset();
	const changed = { Id: 5, Format: 1 };
	const variable = makeVariable({ CutMode: 'V', CutColumn: { Id: 5, Format: 1 } });
	dataset.MetricVersionLevels = [makeLevel([variable])];
	const generator = makeGenerator(dataset);
	generator.InfoCache[generator.createKey(variable)] = [{ Caption: 'Norte', Value: 'N' }];
	generator.RegenAndSaveVariablesAffectedByLabelChange(changed);
	await flushPromises();
	expect(variable.Symbology.CutColumn === changed).toBeTruthy();
	expect(captions(variable)).toEqual(['Norte']);
	expect(dataset.updated).toHaveLength(1);
});

describe('ScaleGenerator: copiar y pegar simbología');

it('CopySymbology copia la simbología sin identificador y guarda estados de nulos, visibilidad y símbolos', () => {
	const generator = makeGenerator();
	const variable = makeVariable({ CutMode: 'J', CutColumn: null }, {
		Values: [makeValue('Sin', null, 0), makeValue('A', 10, 1)],
	});
	variable.Values[1].Visible = false;
	const data = generator.CopySymbology(variable, '#ff0000', ['#111111']);
	expect(data.Symbology.Id).toBeNull();
	expect(variable.Symbology.Id).toBe(7);
	expect(data.Symbology.CutColumn).toBeNull();
	expect(data.Symbology.CustomColors).toBe('["#111111"]');
	expect(data.NullValue.Caption).toBe('Sin');
	expect(data.Visibilities).toEqual({ Null: true, Values: [false] });
	expect(data.Values).toBe(undefined);
});

it('CopySymbology en modo manual copia los cortes y en modo S usa el color único', () => {
	const generator = makeGenerator();
	const manual = makeVariable({ CutMode: 'M' }, { Values: [makeValue('a', 10, 1), makeValue('b', 20, 2)] });
	expect(generator.CopySymbology(manual, null, []).Values).toEqual([10, 20]);
	const single = makeVariable({ CutMode: 'S' });
	expect(generator.CopySymbology(single, '#ff0000', ['#111111']).Symbology.CustomColors).toBe('["#ff0000"]');
});

it('CopySymbology en modo por variable guarda el nombre de la columna de corte', () => {
	const variable = makeVariable({ CutMode: 'V', CutColumn: { Id: 5, Variable: 'region' } });
	expect(makeGenerator().CopySymbology(variable, null, []).Symbology.CutColumn).toBe('region');
});

it('ApplySymbology en modo manual crea las categorías con etiquetas numeradas y deja el pegado pendiente', () => {
	const variable = makeVariable({});
	const newData = {
		Symbology: makeVariable({ CutMode: 'M' }).Symbology, Values: [10, 20],
		NullValue: null, Visibilities: { Null: true, Values: [true, true] }, Symbols: { Null: null, Values: [null, null] },
	};
	makeGenerator().ApplySymbology(makeLevel([variable]), variable, newData);
	expect(variable.Symbology === newData.Symbology).toBeTruthy();
	expect(captions(variable)).toEqual(['Etiqueta 1', 'Etiqueta 2']);
	expect(variable.Values[0].FillColor).toBe('C0C0C0');
	expect(variable.Symbology.PendingPaste.Visibilities).toEqual({ Null: true, Values: [true, true] });
});

it('ApplySymbology en modo S crea la categoría Total con el primer color personalizado', () => {
	const variable = makeVariable({});
	const newData = { Symbology: makeVariable({ CutMode: 'S', CustomColors: '["#abcdef"]' }).Symbology, NullValue: null };
	makeGenerator().ApplySymbology(makeLevel([variable]), variable, newData);
	expect(captions(variable)).toEqual(['Total']);
	expect(variable.Values[0].FillColor).toBe('#abcdef');
	expect(variable.Values[0].Value).toBe(0);
});

it('ApplySymbology en modo por variable resuelve la columna de corte por su nombre', () => {
	const variable = makeVariable({});
	const newData = { Symbology: makeVariable({ CutMode: 'V', CutColumn: 'region' }).Symbology, NullValue: null };
	makeGenerator().ApplySymbology(makeLevel([variable]), variable, newData);
	expect(variable.Symbology.CutColumn).toEqual({ Id: 99, Variable: 'region' });
});

it('ApplySymbology descarta los símbolos salvo en datasets de tipo L', () => {
	const symbols = { Null: null, Values: ['a'] };
	const regular = makeVariable({});
	makeGenerator(makeDataset({ properties: { Id: 1, Type: 'R' } })).ApplySymbology(makeLevel([regular]), regular,
		{ Symbology: makeVariable({ CutMode: 'J' }).Symbology, NullValue: null, Symbols: symbols });
	expect(regular.Symbology.PendingPaste.Symbols).toBeNull();
	const layer = makeVariable({});
	makeGenerator(makeDataset({ properties: { Id: 1, Type: 'L' } })).ApplySymbology(makeLevel([layer]), layer,
		{ Symbology: makeVariable({ CutMode: 'J' }).Symbology, NullValue: null, Symbols: symbols });
	expect(layer.Symbology.PendingPaste.Symbols === symbols).toBeTruthy();
});

it('ApplyColors copia los atributos de color y solo el color y símbolo de la categoría nula', () => {
	const variable = makeVariable({ ColorFrom: '111111' }, { Values: [makeValue('Sin', null, 0)] });
	const newSymbology = makeVariable({
		ColorFrom: 'aaaaaa', ColorTo: 'bbbbbb', Rainbow: 31, CustomColors: '["x"]', RainbowReverse: true, PaletteType: 'P',
	}).Symbology;
	const nullValue = { Caption: 'Otro', Visible: false, FillColor: '#123456', Symbol: 's' };
	makeGenerator().ApplyColors(makeLevel([variable]), variable, { Symbology: newSymbology, NullValue: nullValue });
	expect(variable.Symbology.ColorFrom).toBe('aaaaaa');
	expect(variable.Symbology.Rainbow).toBe(31);
	expect(variable.Symbology.PaletteType).toBe('P');
	expect(variable.Values[0].Caption).toBe('Sin');
	expect(variable.Values[0].FillColor).toBe('#123456');
	expect(variable.Values[0].Symbol).toBe('s');
});
