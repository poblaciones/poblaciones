import { describe, it, expect } from './_harness.mjs';
import { mountLite } from './fixtures.mjs';
import PatternButtons from '@/map/components/controls/patternButtons.vue';

// Componente compartido entre metricCustomize.vue y boundaryCustomize.vue.

const patterns = [
	{ Key: 0, Caption: 'Pleno' },
	{ Key: 1, Caption: 'Contorno' },
	{ Key: 7, Caption: 'Diagonal' },
	{ Key: 11, Caption: 'Puntos' },
];

function mount(customPattern, defaultPattern) {
	return mountLite(PatternButtons, { props: { patterns: patterns, customPattern: customPattern, defaultPattern: defaultPattern } });
}

describe('patternButtons: rango de dos filas (0-3 y 4-20 por índice de array)');

it('con 4 patrones, todos caen en la primera fila y la segunda queda vacía', () => {
	const buttons = mount('', 1);
	expect(buttons.range(patterns, 0, 3)).toHaveLength(4);
	expect(buttons.range(patterns, 4, 20)).toHaveLength(0);
});

describe('patternButtons: activo (customPattern manda; si está vacío, usa defaultPattern)');

it('con customPattern vacío, el activo es defaultPattern', () => {
	const buttons = mount('', 1);
	expect(buttons.isActive(1)).toBe(' active');
	expect(buttons.isActive(0)).toBe('');
});

it('con customPattern definido, manda sobre defaultPattern', () => {
	const buttons = mount(0, 1);
	expect(buttons.isActive(0)).toBe(' active');
	expect(buttons.isActive(1)).toBe('');
});
