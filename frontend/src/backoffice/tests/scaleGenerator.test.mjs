import { describe, it, expect } from './_harness.mjs';
import ScaleGenerator from '@/backoffice/classes/ScaleGenerator';
import { MAX_VALUE, makeValue, makeVariable, makeDataset, captions, valuesOf } from './scaleGeneratorFixtures.mjs';

function makeGenerator(dataset) {
	return new ScaleGenerator(dataset || makeDataset());
}

function thrownMessage(action) {
	try {
		action();
	} catch (e) {
		return e.message;
	}
	return null;
}

describe('ScaleGenerator: paletas');

it('arma 15 paletas básicas y numera las de colorbrewer desde 30, en orden secuencial, divergente y cualitativo', () => {
	const generator = makeGenerator();
	expect(generator.Palettes.basicPalettes).toHaveLength(15);
	expect(generator.Palettes.basicPalettes[14]).toEqual({ Id: 14, Caption: '' });
	expect(generator.Palettes.sequential).toEqual([{ Id: 30, Caption: 'Blues' }]);
	expect(generator.Palettes.diverging).toEqual([{ Id: 31, Caption: 'RdBu' }]);
	expect(generator.Palettes.qualitative).toEqual([{ Id: 32, Caption: 'Set1' }]);
});

it('paletteNumberToKey resuelve el nombre de la paleta y falla con un id desconocido', () => {
	const generator = makeGenerator();
	expect(generator.paletteNumberToKey(30)).toBe('Blues');
	expect(generator.paletteNumberToKey(31)).toBe('RdBu');
	expect(generator.paletteNumberToKey(32)).toBe('Set1');
	expect(thrownMessage(function () { generator.paletteNumberToKey(99); })).toBe('Paleta desconocida');
});

it('cada gradiente arcoíris suma 178 píxeles, que es el ancho que asume el cálculo de color', () => {
	const generator = makeGenerator();
	for (let rainbow = 0; rainbow <= 14; rainbow++) {
		let total = 0;
		for (const stop of generator.GetRainbow(rainbow)) {
			total += stop.pixels;
		}
		expect(total).toBe(178);
	}
});

it('GetRainbow falla con un número de paleta inexistente', () => {
	expect(thrownMessage(function () { makeGenerator().GetRainbow(15); })).toBe('Palette not found.');
});

describe('ScaleGenerator: clave de caché (createKey)');

it('en modo por variable usa la columna de corte y el filtro', () => {
	const generator = makeGenerator();
	expect(generator.createKey(makeVariable({ CutMode: 'V', CutColumn: { Id: 5 } }))).toBe('d5');
	expect(generator.createKey(makeVariable({ CutMode: 'V', CutColumn: null }))).toBe('d');
	expect(generator.createKey(makeVariable({ CutMode: 'V', CutColumn: { Id: 5 } }, { FilterValue: 'x' }))).toBe('d5fx');
});

it('en los demás modos usa datos, columna, normalización y escala', () => {
	const generator = makeGenerator();
	expect(generator.createKey(makeVariable({}, { Data: null }))).toBe('dn');
	expect(generator.createKey(makeVariable({}))).toBe('dNn');
	expect(generator.createKey(makeVariable({}, { DataColumn: { Id: 3 } }))).toBe('dN3n');
	const normalized = makeVariable({}, {
		DataColumn: { Id: 3 }, Normalization: 'P', NormalizationColumn: { Id: 4 }, NormalizationScale: 100,
	});
	expect(generator.createKey(normalized)).toBe('dN3nP4p100');
	const withoutColumn = makeVariable({}, { Normalization: 'P', NormalizationScale: 100 });
	expect(generator.createKey(withoutColumn)).toBe('dNnPp100');
});

it('HasData refleja si la clave ya tiene distribución cacheada y Clear la descarta', () => {
	const generator = makeGenerator();
	const variable = makeVariable({});
	expect(generator.HasData(variable)).toBeFalsy();
	generator.InfoCache[generator.createKey(variable)] = {};
	expect(generator.HasData(variable)).toBeTruthy();
	generator.Clear();
	expect(generator.HasData(variable)).toBeFalsy();
});

describe('ScaleGenerator: CalculateColor');

it('una categoría nula (n null) es gris fijo', () => {
	expect(makeGenerator().CalculateColor(makeVariable({}), null, null, null)).toBe('b7b7b7');
});

it('en gradiente interpola entre los colores extremos según la posición', () => {
	const generator = makeGenerator();
	const variable = makeVariable({ PaletteType: 'G', ColorFrom: '000000', ColorTo: 'ffffff' });
	expect(generator.CalculateColor(variable, 0, 3)).toBe('000000');
	expect(generator.CalculateColor(variable, 1, 3)).toBe('808080');
	expect(generator.CalculateColor(variable, 2, 3)).toBe('ffffff');
});

it('con una sola categoría el gradiente usa el color inicial', () => {
	const variable = makeVariable({ PaletteType: 'G', ColorFrom: '102030', ColorTo: 'ffffff' });
	expect(makeGenerator().CalculateColor(variable, 0, 1)).toBe('102030');
});

it('con paleta personalizada (Rainbow 100) toma el color por posición o gris claro si falta', () => {
	const generator = makeGenerator();
	const variable = makeVariable({ PaletteType: 'P', Rainbow: 100 });
	expect(generator.CalculateColor(variable, 1, 3, ['AAAAAA', 'BBBBBB'])).toBe('BBBBBB');
	expect(generator.CalculateColor(variable, 2, 3, ['AAAAAA', 'BBBBBB'])).toBe('C8C8C8');
});

it('con arcoíris estándar (Rainbow menor a 30) devuelve el primer color en 0 y el último en 1', () => {
	const generator = makeGenerator();
	const variable = makeVariable({ PaletteType: 'P', Rainbow: 2 });
	expect(generator.CalculateColor(variable, 0, 5)).toBe('006100');
	expect(generator.CalculateColor(variable, 4, 5)).toBe('FF2000');
});

it('el arcoíris estándar invertido recorre los colores al revés', () => {
	const variable = makeVariable({ PaletteType: 'P', Rainbow: 2, RainbowReverse: true });
	expect(makeGenerator().CalculateColor(variable, 0, 5)).toBe('FF2000');
});

it('un arcoíris estándar inexistente falla', () => {
	const variable = makeVariable({ PaletteType: 'P', Rainbow: 20 });
	expect(thrownMessage(function () { makeGenerator().CalculateColor(variable, 0, 5); })).toBe('Palette not found.');
});

it('con paleta colorbrewer (Rainbow desde 30) toma el color por posición sin el numeral', () => {
	const generator = makeGenerator();
	const blues = makeVariable({ PaletteType: 'P', Rainbow: 30 });
	expect(generator.CalculateColor(blues, 0, 3)).toBe('deebf7');
	expect(generator.CalculateColor(blues, 2, 3)).toBe('3182bd');
	expect(generator.CalculateColor(makeVariable({ PaletteType: 'P', Rainbow: 31 }), 1, 3)).toBe('f7f7f7');
	expect(generator.CalculateColor(makeVariable({ PaletteType: 'P', Rainbow: 32 }), 2, 3)).toBe('4daf4a');
});

it('colorbrewer con una o dos categorías usa la escala de tres colores', () => {
	const generator = makeGenerator();
	const blues = makeVariable({ PaletteType: 'P', Rainbow: 30 });
	expect(generator.CalculateColor(blues, 0, 1)).toBe('9ecae1');
	expect(generator.CalculateColor(blues, 0, 2)).toBe('deebf7');
	expect(generator.CalculateColor(blues, 1, 2)).toBe('3182bd');
});

it('colorbrewer con más categorías que las de la paleta usa la mayor y reinicia el recorrido', () => {
	const blues = makeVariable({ PaletteType: 'P', Rainbow: 30 });
	expect(makeGenerator().CalculateColor(blues, 6, 7)).toBe('bdd7e7');
});

it('colorbrewer invertido recorre los colores al revés', () => {
	const blues = makeVariable({ PaletteType: 'P', Rainbow: 30, RainbowReverse: true });
	expect(makeGenerator().CalculateColor(blues, 0, 3)).toBe('3182bd');
});

it('un tipo de paleta desconocido falla', () => {
	const variable = makeVariable({ PaletteType: 'X' });
	expect(thrownMessage(function () { makeGenerator().CalculateColor(variable, 0, 3); })).toBe('Tipo de paleta no reconocido');
});

describe('ScaleGenerator: CalculateGradienteColor');

it('mezcla canal por canal con redondeo hacia arriba y relleno de ceros', () => {
	const generator = makeGenerator();
	expect(generator.CalculateGradienteColor('ff0000', '0000ff', 0.5)).toBe('800080');
	expect(generator.CalculateGradienteColor('0a0a0a', 'ffffff', 0)).toBe('0a0a0a');
});

describe('ScaleGenerator: categorías nulas y únicas');

it('HasNullCategory y GetValuesNoNullElement distinguen la categoría con Value null', () => {
	const generator = makeGenerator();
	const variable = makeVariable({}, { Values: [makeValue('Sin', null, 0), makeValue('A', 1, 1)] });
	expect(generator.HasNullCategory(variable)).toBeTruthy();
	expect(generator.GetValuesNoNullElement(variable)).toHaveLength(1);
	expect(generator.HasNullCategory(makeVariable({}))).toBeFalsy();
});

it('EnsureNullCategory agrega al inicio la categoría "Sin valores" en gris y no la duplica', () => {
	const generator = makeGenerator();
	const variable = makeVariable({}, { Values: [makeValue('A', 1, 1)] });
	generator.EnsureNullCategory(variable);
	generator.EnsureNullCategory(variable);
	expect(variable.Values).toHaveLength(2);
	expect(variable.Values[0]).toEqual({
		Id: null, Caption: 'Sin valores', Visible: true, Value: null, FillColor: 'b7b7b7', Symbol: null, LineColor: null, Order: 0,
	});
});

it('CreateSingleCategory agrega la categoría Total visible con valor 10', () => {
	const variable = makeVariable({});
	makeGenerator().CreateSingleCategory(variable);
	expect(variable.Values).toHaveLength(1);
	expect(variable.Values[0].Caption).toBe('Total');
	expect(variable.Values[0].Value).toBe(10);
	expect(variable.Values[0].Visible).toBeTruthy();
	expect(variable.Values[0].FillColor).toBeTruthy();
});

it('DistributionHasNulls detecta un valor nulo y tolera la ausencia de datos', () => {
	const generator = makeGenerator();
	expect(generator.DistributionHasNulls(undefined)).toBeFalsy();
	expect(generator.DistributionHasNulls(null)).toBeFalsy();
	expect(generator.DistributionHasNulls([{ Value: 1 }])).toBeFalsy();
	expect(generator.DistributionHasNulls([{ Value: 1 }, { Value: null }])).toBeTruthy();
});

describe('ScaleGenerator: CreateByVariableCategories');

it('crea una categoría por etiqueta y ubica primera la de nulos, aun si venía en el medio', () => {
	const variable = makeVariable({ CutMode: 'V' });
	makeGenerator().CreateByVariableCategories(variable, [
		{ Caption: 'A', Value: 1 },
		{ Caption: 'Nulos', Value: null },
		{ Caption: 'B', Value: 2 },
		{ Caption: 'Otro nulo', Value: undefined },
	]);
	expect(captions(variable)).toEqual(['Nulos', 'A', 'B']);
	expect(variable.Values.map(function (value) { return value.Order; })).toEqual([0, 1, 2]);
	expect(variable.Values[0].FillColor).toBe('b7b7b7');
});

it('una etiqueta nula sin título se nombra "Sin valores"', () => {
	const variable = makeVariable({ CutMode: 'V' });
	makeGenerator().CreateByVariableCategories(variable, [{ Caption: null, Value: null }]);
	expect(captions(variable)).toEqual(['Sin valores']);
});

it('sin etiquetas no modifica los valores existentes', () => {
	const variable = makeVariable({ CutMode: 'V' }, { Values: [makeValue('A', 1, 1)] });
	makeGenerator().CreateByVariableCategories(variable, null);
	expect(captions(variable)).toEqual(['A']);
});

describe('ScaleGenerator: categorías manuales');

it('completa hasta la cantidad pedida con valores crecientes y deja el último como máximo', () => {
	const variable = makeVariable({ CutMode: 'M', Categories: '4' }, { Values: [makeValue('a', 10, 1), makeValue('b', 20, 2)] });
	makeGenerator().CreateManualCategories(variable);
	expect(valuesOf(variable)).toEqual([10, 20, 30, MAX_VALUE]);
	expect(captions(variable)).toEqual(['Menor que 10', '10 a 20', '20 a 30', '30 y más']);
});

it('si hay más categorías que las pedidas recorta las sobrantes', () => {
	const values = [makeValue('a', 10, 1), makeValue('b', 20, 2), makeValue('c', 30, 3), makeValue('d', 40, 4), makeValue('e', 50, 5)];
	const variable = makeVariable({ CutMode: 'M', Categories: '3' }, { Values: values });
	makeGenerator().CreateManualCategories(variable);
	expect(variable.Values).toHaveLength(3);
	expect(variable.Values[2].Value).toBe(MAX_VALUE);
});

it('con categoría nula no la cuenta entre las pedidas ni la modifica', () => {
	const values = [makeValue('Sin', null, 0), makeValue('a', 10, 1), makeValue('b', 20, 2)];
	const variable = makeVariable({ CutMode: 'M', Categories: '3' }, { Values: values });
	makeGenerator().CreateManualCategories(variable);
	expect(variable.Values).toHaveLength(4);
	expect(variable.Values[0].Value).toBeNull();
	expect(variable.Values[0].Caption).toBe('Sin');
});

describe('ScaleGenerator: ResolveRangeCaption');

it('arma los títulos de primer, intermedio y último rango', () => {
	const generator = makeGenerator();
	const variable = makeVariable({});
	expect(generator.ResolveRangeCaption(variable, true, false, 5, null)).toBe('Menor que 5');
	expect(generator.ResolveRangeCaption(variable, false, false, 10, 5)).toBe('5 a 10');
	expect(generator.ResolveRangeCaption(variable, false, true, MAX_VALUE, 10)).toBe('10 y más');
});

it('usa coma decimal', () => {
	expect(makeGenerator().ResolveRangeCaption(makeVariable({}), false, false, 3.5, 2.5)).toBe('2,5 a 3,5');
});

it('para una brecha agrega pp. si la escala es 100 y % en otro caso', () => {
	const generator = makeGenerator();
	const gapPoints = makeVariable({}, { IsGap: true, NormalizationScale: 100 });
	const gapRatio = makeVariable({}, { IsGap: true, NormalizationScale: 1 });
	expect(generator.ResolveRangeCaption(gapPoints, true, false, 5, null)).toBe('Menor que 5 pp.');
	expect(generator.ResolveRangeCaption(gapRatio, true, false, 5, null)).toBe('Menor que 5 %');
});

it('fuera de una brecha agrega el sufijo de normalización que resuelve el helper', () => {
	const variable = makeVariable({}, { NormalizationCaptionStub: ' por mil' });
	expect(makeGenerator().ResolveRangeCaption(variable, true, false, 5, null)).toBe('Menor que 5 por mil');
});

describe('ScaleGenerator: redondeo');

it('FloorNumber redondea hacia abajo al múltiplo del criterio sin ruido binario', () => {
	const generator = makeGenerator();
	expect(generator.FloorNumber(2.55, 0.1)).toBe(2.5);
	expect(generator.FloorNumber(7, 5)).toBe(5);
	expect(generator.FloorNumber(1071, 1000)).toBe(1000);
});

it('FloorNumber y RoundNumber devuelven el número sin cambios si el criterio es 0 o inválido', () => {
	const generator = makeGenerator();
	expect(generator.FloorNumber(7, 0)).toBe(7);
	expect(generator.RoundNumber(7, '0')).toBe(7);
	expect(isNaN(generator.FloorNumber('abc', 5))).toBeTruthy();
	expect(generator.RoundNumber(7, 'abc')).toBe(7);
});

it('RoundNumber redondea al múltiplo más cercano del criterio', () => {
	const generator = makeGenerator();
	expect(generator.RoundNumber(1234.5678, 0.01)).toBe(1234.57);
	expect(generator.RoundNumber(1234, 100)).toBe(1200);
	expect(generator.RoundNumber(1250, 100)).toBe(1300);
});

it('RoundByVariable no redondea si Round es vacío o "0"', () => {
	const generator = makeGenerator();
	expect(generator.RoundByVariable(makeVariable({ Round: '0' }), 12.34)).toBe(12.34);
	expect(generator.RoundByVariable(makeVariable({ Round: undefined }), 12.34)).toBe(12.34);
	expect(generator.RoundByVariable(makeVariable({ Round: '10' }), 14)).toBe(10);
});

it('ApplyRounding redondea hacia abajo, deja el primer punto por debajo del mínimo y corre los repetidos', () => {
	const generator = makeGenerator();
	expect(generator.ApplyRounding([1071, 1500, 2444], 1000, 1000)).toEqual([1000, 2000, 3000]);
	expect(generator.ApplyRounding([5, 15], 10, 8)).toEqual([0, 10]);
});

it('ApplyRounding sube un punto que quedó por debajo del mínimo observado', () => {
	expect(makeGenerator().ApplyRounding([20, 24], 10, 25)).toEqual([20, 30]);
});

it('ApplyRounding sin criterio solo convierte a número, corriendo de a 10 los que no crecen', () => {
	const generator = makeGenerator();
	expect(generator.ApplyRounding(['1', '2.5'], 0, 0)).toEqual([1, 2.5]);
	expect(generator.ApplyRounding([5, 5], 0, 0)).toEqual([5, 15]);
});

it('ClosedIntervalWidths devuelve los anchos entre puntos consecutivos', () => {
	expect(makeGenerator().ClosedIntervalWidths([1, 4, 10])).toEqual([3, 6]);
	expect(makeGenerator().ClosedIntervalWidths([1])).toEqual([]);
});

it('ChooseRoundStep elige el mayor paso cuya distorsión de anchos no supera la tolerancia', () => {
	const generator = makeGenerator();
	expect(generator.ChooseRoundStep([1020, 2090, 3180], 900, 5000)).toBe(1000);
});

it('ChooseRoundStep baja a un paso menor cuando uno grande colapsaría intervalos', () => {
	expect(makeGenerator().ChooseRoundStep([1500, 1700, 2600], 1000, 5000)).toBe(100);
});

it('ChooseRoundStep devuelve 0 con menos de dos puntos o sin intervalos evaluables', () => {
	const generator = makeGenerator();
	expect(generator.ChooseRoundStep(null, 0, 10)).toBe(0);
	expect(generator.ChooseRoundStep([1], 0, 10)).toBe(0);
	expect(generator.ChooseRoundStep([5, 5], 0, 10)).toBe(0);
});

it('IsAutoRounding acepta true, 1 y "1", y toma modo automático si la propiedad no viene', () => {
	const generator = makeGenerator();
	for (const value of [true, 1, '1', undefined, null]) {
		expect(generator.IsAutoRounding(makeVariable({}, { AutoRounding: value }))).toBeTruthy();
	}
	for (const value of [false, 0, '0']) {
		expect(generator.IsAutoRounding(makeVariable({}, { AutoRounding: value }))).toBeFalsy();
	}
});

it('UpdateAutoRounding fija Round con el paso elegido solo en modo automático', () => {
	const generator = makeGenerator();
	const data = { Groups: { 3: { jenks: [1020, 2090, 3180] } }, MinValue: 900, MaxValue: 5000 };
	const automatic = makeVariable({ Categories: '3' }, { AutoRounding: true });
	generator.UpdateAutoRounding(automatic, data, 'jenks');
	expect(automatic.Symbology.Round).toBe('1000');
	const manual = makeVariable({ Categories: '3', Round: '5' }, { AutoRounding: false });
	generator.UpdateAutoRounding(manual, data, 'jenks');
	expect(manual.Symbology.Round).toBe('5');
});

it('UpdateAutoRounding no hace nada si no hay grupo para esa cantidad de categorías', () => {
	const variable = makeVariable({ Categories: '9', Round: '5' }, { AutoRounding: true });
	makeGenerator().UpdateAutoRounding(variable, { Groups: { 3: { jenks: [1, 2] } } }, 'jenks');
	expect(variable.Symbology.Round).toBe('5');
});

describe('ScaleGenerator: CreateRangeCategories');

it('crea un rango por punto de corte más uno abierto final', () => {
	const variable = makeVariable({ Categories: '3', Round: '0' });
	makeGenerator().CreateRangeCategories(variable, { Groups: { 3: { jenks: [10, 20] } }, MinValue: 0, MaxValue: 100 }, 'jenks');
	expect(captions(variable)).toEqual(['Menor que 10', '10 a 20', '20 y más']);
	expect(valuesOf(variable)).toEqual([10, 20, MAX_VALUE]);
	expect(variable.Values.map(function (value) { return value.Order; })).toEqual([1, 2, 3]);
});

it('aplica el redondeo de la variable a los cortes', () => {
	const variable = makeVariable({ Categories: '3', Round: '10' });
	makeGenerator().CreateRangeCategories(variable, { Groups: { 3: { jenks: [14, 27] } }, MinValue: 0, MaxValue: 100 }, 'jenks');
	expect(valuesOf(variable)).toEqual([10, 20, MAX_VALUE]);
});

it('en modo automático fija el paso de redondeo antes de crear los rangos', () => {
	const variable = makeVariable({ Categories: '3', Round: '0' }, { AutoRounding: true });
	makeGenerator().CreateRangeCategories(variable, { Groups: { 3: { jenks: [1020, 2090, 3180] } }, MinValue: 900, MaxValue: 5000 }, 'jenks');
	expect(variable.Symbology.Round).toBe('1000');
	expect(valuesOf(variable)).toEqual([1000, 2000, 3000, MAX_VALUE]);
});

describe('ScaleGenerator: CreateVariableCategories');

const JENKS_DATA = { HasNulls: false, Groups: { 3: { jenks: [10, 20], ntiles: [15, 25] } }, MinValue: 0, MaxValue: 100 };

it('modo S crea una única categoría Total y no recalcula colores', () => {
	const variable = makeVariable({ CutMode: 'S', CustomColors: '[]' });
	makeGenerator().CreateVariableCategories({}, variable, null);
	expect(captions(variable)).toEqual(['Total']);
});

it('modo J crea los rangos de cortes naturales y les asigna color de gradiente', () => {
	const variable = makeVariable({ CutMode: 'J' });
	makeGenerator().CreateVariableCategories({}, variable, JENKS_DATA);
	expect(captions(variable)).toEqual(['Menor que 10', '10 a 20', '20 y más']);
	expect(variable.Values.map(function (value) { return value.FillColor; })).toEqual(['000000', '808080', 'ffffff']);
});

it('modo T usa los cuantiles', () => {
	const variable = makeVariable({ CutMode: 'T' });
	makeGenerator().CreateVariableCategories({}, variable, JENKS_DATA);
	expect(valuesOf(variable)).toEqual([15, 25, MAX_VALUE]);
});

it('si los datos tienen nulos agrega la categoría de nulos primera, en gris', () => {
	const variable = makeVariable({ CutMode: 'J' });
	makeGenerator().CreateVariableCategories({}, variable, Object.assign({}, JENKS_DATA, { HasNulls: true }));
	expect(captions(variable)).toEqual(['Sin valores', 'Menor que 10', '10 a 20', '20 y más']);
	expect(variable.Values[0].FillColor).toBe('b7b7b7');
});

it('al regenerar conserva la visibilidad y el símbolo de las categorías existentes', () => {
	const generator = makeGenerator();
	const variable = makeVariable({ CutMode: 'J' });
	generator.CreateVariableCategories({}, variable, Object.assign({}, JENKS_DATA, { HasNulls: true }));
	variable.Values[0].Visible = false;
	variable.Values[1].Visible = false;
	variable.Values[2].Symbol = 'estrella';
	generator.CreateVariableCategories({}, variable, Object.assign({}, JENKS_DATA, { HasNulls: true }));
	expect(variable.Values[0].Visible).toBeFalsy();
	expect(variable.Values[1].Visible).toBeFalsy();
	expect(variable.Values[2].Visible).toBeTruthy();
	expect(variable.Values[2].Symbol).toBe('estrella');
});

it('un PendingPaste se aplica en lugar de lo previo y luego se descarta', () => {
	const generator = makeGenerator();
	const variable = makeVariable({ CutMode: 'J' });
	generator.CreateVariableCategories({}, variable, JENKS_DATA);
	variable.Symbology.PendingPaste = {
		NullValue: null,
		Visibilities: { Null: true, Values: [false, false, true] },
		Symbols: { Null: null, Values: ['a', 'b', 'c'] },
	};
	generator.CreateVariableCategories({}, variable, JENKS_DATA);
	expect(variable.Values.map(function (value) { return value.Visible; })).toEqual([false, false, true]);
	expect(variable.Values.map(function (value) { return value.Symbol; })).toEqual(['a', 'b', 'c']);
	expect(variable.Symbology.PendingPaste).toBeNull();
});

it('modo M mantiene los cortes manuales y recalcula los colores', () => {
	const variable = makeVariable({ CutMode: 'M', Categories: '3' }, { Values: [makeValue('a', 10, 1), makeValue('b', 20, 2), makeValue('c', 30, 3)] });
	makeGenerator().CreateVariableCategories({}, variable, null);
	expect(valuesOf(variable)).toEqual([10, 20, MAX_VALUE]);
	expect(variable.Values[2].FillColor).toBe('ffffff');
});

it('modo V con columna de texto crea una categoría por valor de la distribución', () => {
	const variable = makeVariable({ CutMode: 'V', CutColumn: { Id: 5, Format: 1 } });
	makeGenerator().CreateVariableCategories({}, variable, [{ Caption: 'Norte', Value: 'N' }, { Caption: 'Sur', Value: 'S' }]);
	expect(captions(variable)).toEqual(['Norte', 'Sur']);
});

it('modo V con columna numérica usa las etiquetas del dataset y antepone nulos si la distribución los tiene', () => {
	const dataset = makeDataset({ Labels: { 5: [{ Caption: 'Uno', Value: 1 }, { Caption: 'Dos', Value: 2 }] } });
	const variable = makeVariable({ CutMode: 'V', CutColumn: { Id: 5, Format: 5 } });
	makeGenerator(dataset).CreateVariableCategories({}, variable, [{ Value: 1 }, { Value: null }]);
	expect(captions(variable)).toEqual(['Sin valores', 'Uno', 'Dos']);
});

it('modo V con columna numérica sin etiquetas ni nulos queda sin categorías', () => {
	const variable = makeVariable({ CutMode: 'V', CutColumn: { Id: 5, Format: 5 } });
	makeGenerator(makeDataset({ Labels: null })).CreateVariableCategories({}, variable, [{ Value: 1 }]);
	expect(variable.Values).toHaveLength(0);
});

it('modo V sin columna de corte no genera categorías', () => {
	const variable = makeVariable({ CutMode: 'V', CutColumn: null });
	makeGenerator().CreateVariableCategories({}, variable, []);
	expect(variable.Values).toHaveLength(0);
});
