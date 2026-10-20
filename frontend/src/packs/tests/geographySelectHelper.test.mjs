import { describe, it, expect } from './_harness.mjs';
import GeographySelectHelper from '@/packs/classes/GeographySelectHelper';

function geo(id, parentId, rootCaption) {
	return { Id: id, ParentId: parentId, RootCaption: rootCaption === undefined ? null : rootCaption };
}

function ids(list) {
	const ret = [];
	for (const item of list) {
		ret.push(item.Id);
	}
	return ret;
}

describe('GeographySelectHelper.ResolveRootCaptions: orden');

it('con una lista vacía devuelve una lista vacía', () => {
	expect(GeographySelectHelper.ResolveRootCaptions([])).toEqual([]);
});

it('recorre cada árbol en profundidad: la raíz y luego sus hijos recursivamente', () => {
	const list = [geo(3, 1), geo(1, null), geo(2, null), geo(4, 3), geo(5, 2)];
	expect(ids(GeographySelectHelper.ResolveRootCaptions(list))).toEqual([1, 3, 4, 2, 5]);
});

it('mantiene el orden de la lista original entre hermanos', () => {
	const list = [geo(1, null), geo(7, 1), geo(5, 1), geo(6, 1)];
	expect(ids(GeographySelectHelper.ResolveRootCaptions(list))).toEqual([1, 7, 5, 6]);
});

it('descarta los nodos cuyo padre no existe en la lista', () => {
	const list = [geo(1, null), geo(2, 99)];
	expect(ids(GeographySelectHelper.ResolveRootCaptions(list))).toEqual([1]);
});

describe('GeographySelectHelper.ResolveRootCaptions: RootCaption');

it('los descendientes heredan el RootCaption de la raíz de su árbol', () => {
	const list = [geo(1, null, 'Censo 2010'), geo(2, 1), geo(3, 2)];
	GeographySelectHelper.ResolveRootCaptions(list);
	expect(list[1].RootCaption).toBe('Censo 2010');
	expect(list[2].RootCaption).toBe('Censo 2010');
});

it('cada árbol hereda el RootCaption de su propia raíz', () => {
	const list = [geo(1, null, 'A'), geo(2, null, 'B'), geo(3, 1), geo(4, 2)];
	GeographySelectHelper.ResolveRootCaptions(list);
	expect(list[2].RootCaption).toBe('A');
	expect(list[3].RootCaption).toBe('B');
});

describe('GeographySelectHelper.ResolveRootCaptions: raíces promovidas');

it('un nodo con padre y RootCaption propio se trata como raíz y va al final', () => {
	const list = [geo(1, null, 'Censo 2010'), geo(2, 1, 'Otro grupo'), geo(3, 2), geo(4, 1)];
	const ret = GeographySelectHelper.ResolveRootCaptions(list);
	expect(ids(ret)).toEqual([1, 4, 2, 3]);
	expect(list[2].RootCaption).toBe('Otro grupo');
	expect(list[3].RootCaption).toBe('Censo 2010');
});

it('comportamiento actual: la promoción modifica la lista recibida (ParentId pasa a 0)', () => {
	const list = [geo(1, null, 'A'), geo(2, 1, 'B')];
	GeographySelectHelper.ResolveRootCaptions(list);
	expect(list[1].ParentId).toBe(0);
});

it('las raíces promovidas conservan el orden de la lista', () => {
	const list = [geo(5, 9, 'X'), geo(1, null, 'A'), geo(6, 9, 'Y'), geo(9, null, 'Z')];
	expect(ids(GeographySelectHelper.ResolveRootCaptions(list))).toEqual([1, 9, 5, 6]);
});
