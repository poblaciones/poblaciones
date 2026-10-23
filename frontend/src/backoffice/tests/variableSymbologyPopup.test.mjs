import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises } from './fixtures.mjs';
import VariableSymbologyPopup from '@/backoffice/views/Metric/VariableSymbologyPopup.vue';
import { makeGridDataset } from './activeGridFixtures.mjs';
import { makeVariable, makeValue } from './scaleGeneratorFixtures.mjs';

function setup(variableOverrides, symbologyOverrides) {
	const browser = setupBackoffice('P');
	const context = browser.window.Context;
	const dataset = makeGridDataset();
	dataset.properties.Type = 'R';
	const generator = dataset.ScaleGenerator;
	generator.calls = [];
	generator.CopySymbology = function (...args) { generator.calls.push(['CopySymbology'].concat(args)); return { copiada: true }; };
	generator.ApplySymbology = function (...args) { generator.calls.push(['ApplySymbology'].concat(args)); };
	generator.ApplyColors = function (...args) { generator.calls.push(['ApplyColors'].concat(args)); };
	generator.RegenVariableCategories = function (...args) { generator.calls.push(['RegenVariableCategories'].concat(args)); return Promise.resolve(); };
	context.CurrentDataset = dataset;
	context.CurrentWork = { canEdit: true, CanEdit() { return this.canEdit; } };
	const clipboard = { copied: [], pasteResult: { text: null } };
	browser.window.Db.ServerClipboardCopy = function (text) { clipboard.copied.push(text); };
	browser.window.Db.ServerClipboardPaste = function () { return Promise.resolve(clipboard.pasteResult); };
	const refs = {
		invoker: { saved: [], doSave(...args) { this.saved.push(args); return Promise.resolve(); } },
		iconPickerDialog: { shown: [], show(icon) { this.shown.push(icon); } },
		valuePopup: { shown: [], show(...args) { this.shown.push(args); } },
		picker: { shown: 0, show() { this.shown++; } },
	};
	const vm = mountLite(VariableSymbologyPopup, { mocks: { $refs: refs } });
	vm.Level = { Id: 20, MetricVersion: { Metric: { Caption: 'Indicador' } } };
	vm.Variable = makeVariable(symbologyOverrides, variableOverrides);
	vm.regenerated = 0;
	return { vm: vm, dataset: dataset, generator: generator, refs: refs, clipboard: clipboard, browser: browser, context: context };
}

function spyRegen(vm) {
	const calls = [];
	vm.RegenCategories = function () { calls.push(1); };
	return calls;
}

describe('VariableSymbologyPopup: propiedades calculadas');

it('hasArea es falso en capas de líneas y en segmentos', () => {
	const { vm, dataset } = setup();
	expect(vm.hasArea).toBeTruthy();
	dataset.properties.AreSegments = true;
	expect(vm.hasArea).toBeFalsy();
	dataset.properties.AreSegments = false;
	dataset.properties.Type = 'L';
	expect(vm.hasArea).toBeFalsy();
});

it('canEdit refleja el permiso del trabajo y title toma el del indicador, vacío sin nivel', () => {
	const { vm, context } = setup();
	expect(vm.canEdit).toBe(true);
	context.CurrentWork.canEdit = false;
	expect(vm.canEdit).toBe(false);
	context.CurrentWork = null;
	expect(vm.canEdit).toBe(false);
	expect(vm.title).toBe('Indicador');
	vm.Level = null;
	expect(vm.title).toBe('');
});

it('CutMode y CategoriesLabel dependen del modo de corte de la simbología', () => {
	const { vm } = setup({}, { CutMode: 'J' });
	expect(vm.CutMode).toBe('J');
	expect(vm.CategoriesLabel).toBe('cortes');
	vm.Variable.Symbology.CutMode = 'V';
	expect(vm.CategoriesLabel).toBe('categorías');
});

it('IsAutoRounding acepta true, 1 y "1", y toma modo automático si la propiedad no viene', () => {
	const { vm } = setup();
	for (const value of [true, 1, '1', undefined, null]) {
		vm.Variable.AutoRounding = value;
		expect(vm.IsAutoRounding).toBeTruthy();
	}
	for (const value of [false, 0, '0']) {
		vm.Variable.AutoRounding = value;
		expect(vm.IsAutoRounding).toBeFalsy();
	}
});

it('ofrece diez pasos de redondeo, once patrones y las paletas del generador', () => {
	const { vm, generator } = setup();
	expect(vm.roundValues).toHaveLength(10);
	expect(vm.roundValues[5]).toEqual({ Id: '0', Caption: 'Ninguno' });
	expect(vm.patterns).toHaveLength(11);
	expect(vm.patterns[0]).toEqual({ value: 'Pleno', key: 0 });
	expect(vm.palettes === generator.Palettes).toBeTruthy();
});

it('columnsForCutColumn devuelve las columnas elegibles del dataset y formatColumn las formatea', () => {
	const { vm, dataset } = setup();
	expect(vm.columnsForCutColumn.map(function (column) { return column.Id; })).toEqual([3, 4]);
	expect(vm.formatColumn(dataset.Columns[0])).toBe('lat');
});

describe('VariableSymbologyPopup: modo automático y colores');

it('setAutoRounding guarda la propiedad y regenera solo al activarlo', () => {
	const { vm } = setup();
	const regen = spyRegen(vm);
	vm.setAutoRounding(false);
	expect(vm.Variable.AutoRounding).toBe(false);
	expect(regen).toHaveLength(0);
	vm.setAutoRounding(true);
	expect(vm.Variable.AutoRounding).toBe(true);
	expect(regen).toHaveLength(1);
});

it('swapColors intercambia el color inicial y el final', () => {
	const { vm } = setup({}, { ColorFrom: 'aaaaaa', ColorTo: 'bbbbbb' });
	vm.swapColors();
	expect(vm.Variable.Symbology.ColorFrom).toBe('bbbbbb');
	expect(vm.Variable.Symbology.ColorTo).toBe('aaaaaa');
});

it('colorSelected guarda los colores de las categorías, sin contar la de nulos, y cambia a paleta personalizada si se pide', () => {
	const { vm } = setup({ Values: [makeValue('Sin', null, 0), makeValue('A', 1, 1), makeValue('B', 2, 2)] });
	vm.Variable.Values[0].FillColor = '#nulo';
	vm.Variable.Values[1].FillColor = '#uno';
	vm.Variable.Values[2].FillColor = '#dos';
	vm.colorSelected(false);
	expect(vm.customColors).toEqual(['#uno', '#dos']);
	expect(vm.Variable.Symbology.Rainbow).toBe(0);
	vm.colorSelected(true);
	expect(vm.Variable.Symbology.Rainbow).toBe(100);
	expect(vm.Variable.Symbology.PaletteType).toBe('P');
});

it('reverseCustom invierte los colores de una paleta personalizada sin tocar la categoría de nulos', () => {
	const { vm } = setup({ Values: [makeValue('Sin', null, 0), makeValue('A', 1, 1), makeValue('B', 2, 2), makeValue('C', 3, 3)] },
		{ PaletteType: 'P', Rainbow: 100 });
	['#nulo', '#a', '#b', '#c'].forEach(function (fill, index) { vm.Variable.Values[index].FillColor = fill; });
	vm.reverseCustom();
	expect(vm.Variable.Values.map(function (value) { return value.FillColor; })).toEqual(['#nulo', '#c', '#b', '#a']);
	expect(vm.customColors).toEqual(['#c', '#b', '#a']);
});

it('reverseCustom no hace nada si la paleta no es personalizada', () => {
	const { vm } = setup({ Values: [makeValue('A', 1, 1), makeValue('B', 2, 2)] }, { PaletteType: 'G', Rainbow: 0 });
	vm.Variable.Values[0].FillColor = '#a';
	vm.Variable.Values[1].FillColor = '#b';
	vm.reverseCustom();
	expect(vm.Variable.Values[0].FillColor).toBe('#a');
});

describe('VariableSymbologyPopup: regeneración de categorías');

it('RegenCategories guarda los colores personalizados y regenera las categorías del nivel', async () => {
	const { vm, generator } = setup();
	vm.customColors = ['#a', '#b'];
	await vm.RegenCategories();
	expect(vm.Variable.Symbology.CustomColors).toBe('["#a","#b"]');
	expect(generator.calls[0][0]).toBe('RegenVariableCategories');
	expect(generator.calls[0][1] === vm.Level).toBeTruthy();
	expect(generator.calls[0][2] === vm.Variable).toBeTruthy();
});

it('paletteOffset y paletteNumberToKey se resuelven por el generador de escalas', () => {
	const { vm } = setup();
	expect(vm.paletteOffset(2)).toBe(-64);
	expect(vm.paletteNumberToKey(30)).toBe('Blues');
});

it('renderPalette dibuja un bloque de color por cada tono de la mayor escala de la paleta', () => {
	const { vm } = setup();
	const html = vm.renderPalette('Blues', false);
	expect(html.startsWith("<div style='display: flex;' class='paletteItem palettePos'>")).toBeTruthy();
	expect(html.split("<div style='height: 25px;").length - 1).toBe(5);
	expect(html.includes('width: 48px')).toBeTruthy();
	expect(vm.renderPalette('Blues', true).includes('palettePos')).toBeFalsy();
});

describe('VariableSymbologyPopup: edición de valores');

it('editValue de la categoría de nulos abre el editor de su título', () => {
	const { vm } = setup({ Values: [makeValue('Sin datos', null, 0), makeValue('A', 1, 1)] });
	vm.editValue(vm.Variable.Values[0]);
	expect(vm.nullValueLabel).toBe('Sin datos');
	expect(vm.activateNullValueLabel).toBeTruthy();
});

it('editValue de un valor abre su popup indicando el anterior y si es el último', () => {
	const { vm, refs } = setup({ Values: [makeValue('Sin', null, 0), makeValue('A', 1, 1), makeValue('B', 2, 2)] });
	vm.customColors = ['#x'];
	vm.editValue(vm.Variable.Values[1]);
	vm.editValue(vm.Variable.Values[2]);
	expect(refs.valuePopup.shown[0][2] === vm.Variable.Values[1]).toBeTruthy();
	expect(refs.valuePopup.shown[0][3]).toBeNull();
	expect(refs.valuePopup.shown[0][4]).toBe(false);
	expect(refs.valuePopup.shown[1][3] === vm.Variable.Values[1]).toBeTruthy();
	expect(refs.valuePopup.shown[1][4]).toBe(true);
});

it('updateNullValueLabel cambia el título de la categoría de nulos', () => {
	const { vm } = setup({ Values: [makeValue('Sin', null, 0)] });
	vm.nullValueLabel = 'Ausente';
	vm.updateNullValueLabel();
	expect(vm.Variable.Values[0].Caption).toBe('Ausente');
});

it('el selector de símbolo y color copia el ítem actual al ítem de la lista', () => {
	const { vm, refs } = setup();
	const item = { Symbol: 'a', Value: 1, FillColor: '#fff', Visible: false };
	vm.showPicker(item, 40);
	expect(vm.offsetY).toBe(40);
	expect(vm.currentItem).toEqual({ Value: 1, Symbol: 'a', Visible: false, FillColor: '#fff' });
	expect(refs.picker.shown).toBe(1);
	vm.currentItem.Symbol = 'b';
	vm.currentItem.FillColor = '#000';
	vm.currentItem.Value = 5;
	vm.currentItem.Visible = true;
	vm.pickerValueUpdated();
	expect(item).toEqual({ Symbol: 'b', Value: 5, FillColor: '#000', Visible: true });
});

it('pickIconClicked abre el selector de íconos, iconSelected lo asigna y removeIcon lo quita', () => {
	const { vm, refs } = setup();
	const item = { Symbol: 'viejo' };
	vm.listItem = { Symbol: null };
	vm.pickIconClicked(item);
	expect(refs.iconPickerDialog.shown).toEqual(['viejo']);
	vm.iconSelected('nuevo');
	expect(item.Symbol).toBe('nuevo');
	expect(vm.listItem.Symbol).toBe('nuevo');
	vm.removeIcon(item);
	expect(item.Symbol).toBeNull();
});

describe('VariableSymbologyPopup: copiar y pegar simbología');

it('copySymbology envía al portapapeles del servidor la simbología serializada', () => {
	const { vm, clipboard, generator } = setup();
	vm.singleColor = '#abc';
	vm.customColors = ['#1'];
	vm.copySymbology();
	expect(generator.calls[0].slice(0, 1)).toEqual(['CopySymbology']);
	expect(generator.calls[0][2]).toBe('#abc');
	expect(clipboard.copied).toEqual(['{"copiada":true}']);
});

it('pasteSymbology sin datos en el portapapeles avisa y no aplica nada', async () => {
	const { vm, clipboard, generator, browser } = setup();
	clipboard.pasteResult = { text: null };
	vm.pasteSymbology();
	await flushPromises();
	expect(browser.alerts).toEqual(["No hay valores disponibles. Para pegar una simbología debe realizar 'copiar simbología' en otro indicador."]);
	expect(generator.calls).toHaveLength(0);
});

it('pasteSymbology aplica la simbología pegada sobre una copia, conserva la variable original y regenera', async () => {
	const { vm, clipboard, generator } = setup();
	clipboard.pasteResult = { text: '{"Symbology":{"CutMode":"M"}}' };
	vm.originalVariable = { marca: 'original' };
	const regen = spyRegen(vm);
	vm.pasteSymbology();
	await flushPromises();
	expect(generator.calls[0][0]).toBe('ApplySymbology');
	expect(generator.calls[0][3]).toEqual({ Symbology: { CutMode: 'M' } });
	expect(vm.originalVariable).toEqual({ marca: 'original' });
	expect(regen).toHaveLength(1);
});

it('pasteColors sin datos avisa, y con datos aplica los colores y toma los personalizados de la variable', async () => {
	const { vm, clipboard, generator, browser } = setup();
	const regen = spyRegen(vm);
	clipboard.pasteResult = { text: null };
	vm.pasteColors();
	await flushPromises();
	expect(browser.alerts).toEqual(['No hay valores disponibles. Para pegar el coloreo debe copiar la simbología de otro indicador.']);
	clipboard.pasteResult = { text: '{"x":1}' };
	vm.Variable.Symbology.CustomColors = '["#a","#b"]';
	vm.pasteColors();
	await flushPromises();
	expect(generator.calls[0][0]).toBe('ApplyColors');
	expect(vm.customColors).toEqual(['#a', '#b']);
	vm.Variable.Symbology.CustomColors = '';
	vm.pasteColors();
	await flushPromises();
	expect(vm.customColors).toEqual([]);
	expect(regen).toHaveLength(2);
});

describe('VariableSymbologyPopup: apertura');

it('receiveVariable trabaja sobre una copia y lee los colores personalizados', () => {
	const { vm } = setup();
	const variable = makeVariable({ CutMode: 'J', CustomColors: '["#a"]' }, { Data: 'O' });
	vm.receiveVariable(variable);
	expect(vm.originalVariable === variable).toBeTruthy();
	expect(vm.Variable === variable).toBeFalsy();
	expect(vm.customColors).toEqual(['#a']);
	expect(vm.Variable.Symbology.CutMode).toBe('J');
});

it('receiveVariable pasa a categoría única las variables de conteo con corte por rangos y toma su color', () => {
	const { vm } = setup();
	for (const mode of ['J', 'T', 'M']) {
		vm.receiveVariable(makeVariable({ CutMode: mode, CustomColors: '' }, { Data: 'N' }));
		expect(vm.Variable.Symbology.CutMode).toBe('S');
	}
	const withValues = makeVariable({ CutMode: 'J', CustomColors: '' }, { Data: 'N', Values: [makeValue('Total', 1, 1)] });
	withValues.Values[0].FillColor = '#ffaa00';
	vm.receiveVariable(withValues);
	expect(vm.singleColor).toBe('#ffaa00');
});

it('checkDefaults completa los colores y el modo de corte que no vienen definidos', () => {
	const { vm } = setup({}, { ColorFrom: null, ColorTo: null, CutMode: null });
	vm.checkDefaults();
	expect(vm.Variable.Symbology.ColorFrom).toBe('0ce800');
	expect(vm.Variable.Symbology.ColorTo).toBe('fb0000');
	expect(vm.Variable.Symbology.CutMode).toBe('S');
});

it('show abre el diálogo con una copia de la variable, un color único nuevo y los valores por defecto', () => {
	const { vm } = setup();
	const variable = makeVariable({ CutMode: 'J', ColorFrom: null, CustomColors: '' }, { Data: 'O' });
	vm.show({ Id: 5 }, variable);
	expect(vm.Level).toEqual({ Id: 5 });
	expect(vm.showDialog).toBeTruthy();
	expect(vm.singleItem).toEqual({ Symbol: null });
	expect(typeof vm.singleColor).toBe('string');
	expect(vm.Variable.Symbology.ColorFrom).toBe('0ce800');
	vm.hide();
	expect(vm.showDialog).toBeFalsy();
});

describe('VariableSymbologyPopup: validaciones');

it('ValidateRepetedRanges devuelve el primer valor repetido con su título, o cadena vacía', () => {
	const { vm } = setup();
	vm.Variable.Values = [makeValue('A', 10, 1), makeValue('B', 20, 2), makeValue('C', 10, 3)];
	expect(vm.ValidateRepetedRanges()).toBe('10 - C');
	vm.Variable.Values = [makeValue('A', 10, 1), makeValue('B', 20, 2)];
	expect(vm.ValidateRepetedRanges()).toBe('');
});

it('ValidateIncreasing acepta los modos sin rangos y los rangos crecientes, e ignora la categoría de nulos', () => {
	const { vm, browser } = setup();
	vm.Variable.Symbology.CutMode = 'V';
	vm.Variable.Values = [makeValue('A', 20, 1), makeValue('B', 10, 2)];
	expect(vm.ValidateIncreasing()).toBe(true);
	vm.Variable.Symbology.CutMode = 'J';
	vm.Variable.Values = [makeValue('Sin', null, 0), makeValue('A', 10, 1), makeValue('B', 20, 2)];
	expect(vm.ValidateIncreasing()).toBe(true);
	expect(browser.alerts).toEqual([]);
});

it('ValidateIncreasing rechaza un rango menor que el anterior', () => {
	const { vm, browser } = setup();
	vm.Variable.Symbology.CutMode = 'M';
	vm.Variable.Values = [makeValue('A', 20, 1), makeValue('B', 10, 2)];
	expect(vm.ValidateIncreasing()).toBe(false);
	expect(browser.alerts).toEqual(['Los rangos deben encontrarse en orden creciente y no superponerse.']);
});

it('ValidateRanges avisa de rangos superpuestos o, en corte por variable, de etiquetas del mismo valor', () => {
	const { vm, browser } = setup();
	vm.Variable.Symbology.CutMode = 'J';
	vm.Variable.Values = [makeValue('A', 10, 1), makeValue('B', 10, 2)];
	expect(vm.ValidateRanges()).toBe(false);
	vm.Variable.Symbology.CutMode = 'V';
	expect(vm.ValidateRanges()).toBe(false);
	expect(browser.alerts).toEqual(['Dos rangos de valores se superponen (10 - B).', 'Dos etiquetas de valores refieren al mismo valor (10 - B).']);
	vm.Variable.Values = [makeValue('A', 10, 1), makeValue('B', 20, 2)];
	expect(vm.ValidateRanges()).toBe(true);
});

describe('VariableSymbologyPopup: guardado');

it('Save exige una variable para la fórmula y vuelve a la solapa de la fórmula', () => {
	const { vm, browser, refs } = setup({ Data: null });
	vm.Save();
	expect(browser.alerts).toEqual(['Debe indicar una variable para el valor para la fórmula.']);
	expect(vm.currentTab).toBe('tab-formula');
	expect(refs.invoker.saved).toHaveLength(0);
});

it('Save no guarda si los rangos no son válidos', () => {
	const { vm, refs } = setup({}, { CutMode: 'J' });
	vm.Variable.Values = [makeValue('A', 10, 1), makeValue('B', 10, 2)];
	vm.Save();
	expect(refs.invoker.saved).toHaveLength(0);
});

it('Save en categoría única crea la categoría Total con el color único elegido', async () => {
	const { vm, refs, dataset } = setup({ Values: [] }, { CutMode: 'S' });
	vm.originalVariable = {};
	vm.singleColor = '#123456';
	vm.Save();
	expect(vm.Variable.Values).toHaveLength(1);
	expect(vm.Variable.Values[0].Caption).toBe('Total');
	expect(vm.Variable.Values[0].FillColor).toBe('#123456');
	expect(refs.invoker.saved[0][0] === dataset).toBeTruthy();
	expect(refs.invoker.saved[0][1] === dataset.UpdateVariable).toBeTruthy();
	await flushPromises();
	expect(vm.showDialog).toBeFalsy();
});

it('Save sin cambios respecto de la variable original solo cierra el diálogo', () => {
	const { vm, refs } = setup({}, { CutMode: 'J' });
	vm.customColors = [];
	vm.Variable.Symbology.CustomColors = '[]';
	vm.originalVariable = JSON.parse(JSON.stringify(vm.Variable));
	vm.showDialog = true;
	vm.Save();
	expect(refs.invoker.saved).toHaveLength(0);
	expect(vm.showDialog).toBeFalsy();
});

it('Save con cambios guarda la variable con el nivel y cierra al terminar', async () => {
	const { vm, refs, dataset } = setup({}, { CutMode: 'J' });
	vm.originalVariable = JSON.parse(JSON.stringify(vm.Variable));
	vm.Variable.Symbology.Categories = '5';
	vm.showDialog = true;
	vm.Save();
	expect(refs.invoker.saved[0].slice(2)).toEqual([vm.Level, vm.Variable]);
	await flushPromises();
	expect(vm.showDialog).toBeFalsy();
	expect(dataset.spied).toEqual([]);
});

it('DisplayError arma el mensaje de error del proceso', () => {
	const { vm } = setup();
	vm.DisplayError('sin conexión');
	expect(vm.error).toBe('El proceso no ha podido ser completado. sin conexión');
});

describe('VariableSymbologyPopup: cambios en la variable');

function watcher(name) {
	return VariableSymbologyPopup.watch[name];
}

it('cambiar el modo de corte, la columna de corte o el sentido del arcoíris regenera las categorías', () => {
	const { vm } = setup();
	const regen = spyRegen(vm);
	watcher('Variable.Symbology.CutMode').call(vm);
	watcher('Variable.Symbology.CutColumn').call(vm);
	watcher('Variable.Symbology.RainbowReverse').call(vm);
	expect(regen).toHaveLength(3);
});

it('la cantidad de categorías se limita entre 2 y 10 antes de regenerar', () => {
	const { vm } = setup({}, { Categories: 15 });
	const regen = spyRegen(vm);
	watcher('Variable.Symbology.Categories').call(vm);
	expect(vm.Variable.Symbology.Categories).toBe(10);
	vm.Variable.Symbology.Categories = 1;
	watcher('Variable.Symbology.Categories').call(vm);
	expect(vm.Variable.Symbology.Categories).toBe(2);
	vm.Variable.Symbology.Categories = 5;
	watcher('Variable.Symbology.Categories').call(vm);
	expect(vm.Variable.Symbology.Categories).toBe(5);
	expect(regen).toHaveLength(3);
});

it('cambiar el redondeo regenera solo si no está en modo automático', () => {
	const { vm } = setup({ AutoRounding: true });
	const regen = spyRegen(vm);
	watcher('Variable.Symbology.Round').call(vm);
	expect(regen).toHaveLength(0);
	vm.Variable.AutoRounding = false;
	watcher('Variable.Symbology.Round').call(vm);
	expect(regen).toHaveLength(1);
});

it('los colores del gradiente regeneran solo con paleta de gradiente, y el arcoíris solo con paleta predefinida', () => {
	const { vm } = setup({}, { PaletteType: 'G' });
	const regen = spyRegen(vm);
	watcher('Variable.Symbology.ColorFrom').call(vm);
	watcher('Variable.Symbology.ColorTo').call(vm);
	watcher('Variable.Symbology.Rainbow').call(vm);
	expect(regen).toHaveLength(2);
	vm.Variable.Symbology.PaletteType = 'P';
	watcher('Variable.Symbology.ColorFrom').call(vm);
	watcher('Variable.Symbology.Rainbow').call(vm);
	expect(regen).toHaveLength(3);
});

it('cambiar el tipo de paleta regenera salvo en categoría única', () => {
	const { vm } = setup({}, { CutMode: 'J' });
	const regen = spyRegen(vm);
	watcher('Variable.Symbology.PaletteType').call(vm);
	vm.Variable.Symbology.CutMode = 'S';
	watcher('Variable.Symbology.PaletteType').call(vm);
	expect(regen).toHaveLength(1);
});
