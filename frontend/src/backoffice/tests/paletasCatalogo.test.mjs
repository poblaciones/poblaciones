import { describe, it, expect } from './_harness.mjs';
import catalog from '@/backoffice/views/Paletas/paletasCatalogo';

const VALID_FRAMES = ['form', 'column', 'panel', 'popup'];

describe('paletasCatalogo: estructura');

it('cada sección tiene identificador único, título, resumen y lista de ejemplos', () => {
	const ids = [];
	for (const section of catalog) {
		expect(typeof section.id).toBe('string');
		expect(ids.indexOf(section.id)).toBe(-1);
		ids.push(section.id);
		expect(typeof section.title).toBe('string');
		expect(typeof section.summary).toBe('string');
		expect(Array.isArray(section.examples)).toBeTruthy();
	}
});

it('cada ejemplo tiene título y código, y su marco es uno de los admitidos', () => {
	for (const section of catalog) {
		for (const example of section.examples) {
			expect(typeof example.title).toBe('string');
			expect(example.code.length > 0).toBeTruthy();
			if (example.frame !== undefined) {
				expect(VALID_FRAMES.indexOf(example.frame) === -1).toBeFalsy();
			}
		}
	}
});

it('las claves visibles de un ejemplo existen en su estado inicial', () => {
	for (const section of catalog) {
		for (const example of section.examples) {
			if (example.visible !== undefined) {
				expect(example.state !== undefined).toBeTruthy();
				for (const key of example.visible) {
					expect(key in example.state).toBeTruthy();
				}
			}
		}
	}
});

it('los grupos de tokens de la sección de paleta tienen tipo y nombres', () => {
	const palette = catalog.find(function (section) { return section.id === 'paleta'; });
	expect(palette.tokenGroups.length > 0).toBeTruthy();
	for (const group of palette.tokenGroups) {
		expect(group.kind === 'color' || group.kind === 'radius').toBeTruthy();
		expect(group.names.length > 0).toBeTruthy();
	}
});
