import { describe, it, expect } from './_harness.mjs';
import ScaleStates from '@/backoffice/classes/ScaleStates';

// Doble del ScaleGenerator con la misma convención que el real: la categoría
// nula es la que tiene Value === null.
const generatorStub = {
	HasNullCategory(variable) {
		for (const value of variable.Values) {
			if (value.Value === null) {
				return true;
			}
		}
		return false;
	},
	GetValuesNoNullElement(variable) {
		const ret = [];
		for (const value of variable.Values) {
			if (value.Value !== null) {
				ret.push(value);
			}
		}
		return ret;
	},
};

function makeValue(value, caption, visible, symbol, fillColor) {
	return { Value: value, Caption: caption, Visible: visible, Symbol: symbol, FillColor: fillColor };
}

function makeVariableWithNull() {
	return {
		Values: [
			makeValue(null, 'Sin datos', false, 'sN', '#000000'),
			makeValue(1, 'Uno', true, 's1', '#111111'),
			makeValue(2, 'Dos', false, 's2', '#222222'),
		],
	};
}

function makeStates() {
	return new ScaleStates(generatorStub);
}

describe('ScaleStates: Save');

it('guarda la categoría nula, las visibilidades y los símbolos', () => {
	const saved = makeStates().Save(makeVariableWithNull());
	expect(saved.NullValue).toEqual({ Caption: 'Sin datos', FillColor: '#000000', Symbol: 'sN', Visible: false });
	expect(saved.Visibilities).toEqual({ Null: false, Values: [true, false] });
	expect(saved.Symbols).toEqual({ Null: 'sN', Values: ['s1', 's2'] });
});

it('sin categoría nula, NullValue es null y el valor nulo de los atributos queda en true', () => {
	const variable = { Values: [makeValue(1, 'Uno', true, 's1', '#111111')] };
	const saved = makeStates().Save(variable);
	expect(saved.NullValue).toBeNull();
	expect(saved.Visibilities).toEqual({ Null: true, Values: [true] });
});

it('una variable sin Values guarda atributos vacíos', () => {
	const states = makeStates();
	expect(states.saveVisibilities({})).toEqual({ Null: true, Values: [] });
	expect(states.saveSymbols({})).toEqual({ Null: true, Values: [] });
});

describe('ScaleStates: Apply');

it('restaura visibilidades y símbolos en las categorías no nulas, por posición', () => {
	const states = makeStates();
	const variable = makeVariableWithNull();
	states.Apply(variable, {
		NullValue: null,
		Visibilities: { Null: true, Values: [false, true] },
		Symbols: { Null: 'x', Values: ['a', 'b'] },
	});
	expect(variable.Values[1].Visible).toBe(false);
	expect(variable.Values[2].Visible).toBe(true);
	expect(variable.Values[1].Symbol).toBe('a');
	expect(variable.Values[2].Symbol).toBe('b');
});

it('con más categorías que valores guardados, deja intactas las sobrantes', () => {
	const states = makeStates();
	const variable = makeVariableWithNull();
	states.applyAttribute(variable, { Values: ['solo'] }, 'Symbol');
	expect(variable.Values[1].Symbol).toBe('solo');
	expect(variable.Values[2].Symbol).toBe('s2');
});

it('con menos categorías que valores guardados, ignora los excedentes', () => {
	const states = makeStates();
	const variable = { Values: [makeValue(1, 'Uno', true, 's1', '#111111')] };
	states.applyAttribute(variable, { Values: ['a', 'b', 'c'] }, 'Symbol');
	expect(variable.Values[0].Symbol).toBe('a');
});

it('no hace nada si faltan los valores previos o la variable no tiene Values', () => {
	const states = makeStates();
	const variable = makeVariableWithNull();
	states.applyAttribute(variable, null, 'Symbol');
	expect(variable.Values[1].Symbol).toBe('s1');
	const withoutValues = {};
	states.applyAttribute(withoutValues, { Values: ['a'] }, 'Symbol');
	expect(withoutValues.Values).toBe(undefined);
});

describe('ScaleStates: applyNullInfo');

it('restaura título, visibilidad, color y símbolo de la categoría nula', () => {
	const variable = makeVariableWithNull();
	makeStates().applyNullInfo(variable, { Caption: 'Ausente', Visible: true, FillColor: '#abcdef', Symbol: 'z' });
	expect(variable.Values[0]).toEqual(makeValue(null, 'Ausente', true, 'z', '#abcdef'));
});

it('con onlyColors conserva título y visibilidad', () => {
	const variable = makeVariableWithNull();
	makeStates().applyNullInfo(variable, { Caption: 'Ausente', Visible: true, FillColor: '#abcdef', Symbol: 'z' }, true);
	expect(variable.Values[0].Caption).toBe('Sin datos');
	expect(variable.Values[0].Visible).toBe(false);
	expect(variable.Values[0].FillColor).toBe('#abcdef');
	expect(variable.Values[0].Symbol).toBe('z');
});

it('no modifica nada si no hay categoría nula o no hay datos para aplicar', () => {
	const states = makeStates();
	const withoutNull = { Values: [makeValue(1, 'Uno', true, 's1', '#111111')] };
	states.applyNullInfo(withoutNull, { Caption: 'x', Visible: false, FillColor: '#fff', Symbol: 'q' });
	expect(withoutNull.Values[0].Caption).toBe('Uno');
	const variable = makeVariableWithNull();
	states.applyNullInfo(variable, null);
	expect(variable.Values[0].Caption).toBe('Sin datos');
});

describe('ScaleStates: ciclo guardar y restaurar');

it('Save seguido de Apply sobre una variable regenerada devuelve el estado original', () => {
	const states = makeStates();
	const original = makeVariableWithNull();
	const saved = states.Save(original);
	const regenerated = {
		Values: [
			makeValue(null, 'Nulo nuevo', true, 'n', '#ffffff'),
			makeValue(1, 'Uno', true, 'g1', '#aaaaaa'),
			makeValue(2, 'Dos', true, 'g2', '#bbbbbb'),
		],
	};
	states.Apply(regenerated, saved);
	expect(regenerated.Values[0].Caption).toBe('Sin datos');
	expect(regenerated.Values[1].Visible).toBe(true);
	expect(regenerated.Values[2].Visible).toBe(false);
	expect(regenerated.Values[2].Symbol).toBe('s2');
});
