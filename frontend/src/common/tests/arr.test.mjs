import { describe, it, expect } from './_harness.mjs';
import arr from '@/common/framework/arr';

describe('arr: alta y baja de elementos');

it('Add agrega al final', () => {
	const list = [1, 2];
	arr.Add(list, 3);
	expect(list).toEqual([1, 2, 3]);
});

it('AddRange agrega todos los valores al final', () => {
	const list = [1];
	arr.AddRange(list, [2, 3]);
	expect(list).toEqual([1, 2, 3]);
});

it('InsertAt inserta en la posición indicada', () => {
	const list = [1, 3];
	arr.InsertAt(list, 1, 2);
	expect(list).toEqual([1, 2, 3]);
});

it('Crop deja solo los primeros itemsLeft elementos', () => {
	const list = [1, 2, 3, 4];
	arr.Crop(list, 2);
	expect(list).toEqual([1, 2]);
});

it('Clear vacía el arreglo y devuelve lo quitado', () => {
	const list = [1, 2];
	const removed = arr.Clear(list);
	expect(list).toHaveLength(0);
	expect(removed).toEqual([1, 2]);
});

it('Fill reemplaza el contenido por el de otro arreglo', () => {
	const list = [1, 2, 3];
	arr.Fill(list, [9, 8]);
	expect(list).toEqual([9, 8]);
});

it('ReplaceAll reemplaza el contenido, también cuando el nuevo es más largo o está vacío', () => {
	const list = [1, 2];
	arr.ReplaceAll(list, [7, 8, 9]);
	expect(list).toEqual([7, 8, 9]);
	arr.ReplaceAll(list, []);
	expect(list).toHaveLength(0);
});

it('Copy devuelve un arreglo distinto con los mismos elementos', () => {
	const list = [1, 2];
	const copy = arr.Copy(list);
	copy.push(3);
	expect(list).toEqual([1, 2]);
	expect(copy).toEqual([1, 2, 3]);
});

describe('arr: Remove, RemoveAt, RemoveById, RemoveByKey');

it('Remove quita el elemento y devuelve true; si no está devuelve false sin tocar el arreglo', () => {
	const list = ['a', 'b', 'c'];
	expect(arr.Remove(list, 'b')).toBeTruthy();
	expect(list).toEqual(['a', 'c']);
	expect(arr.Remove(list, 'z')).toBeFalsy();
	expect(list).toEqual(['a', 'c']);
});

it('RemoveAt con índice -1 no quita nada', () => {
	const list = ['a', 'b'];
	expect(arr.RemoveAt(list, -1)).toBeFalsy();
	expect(list).toHaveLength(2);
});

it('RemoveById quita por la propiedad Id', () => {
	const list = [{ Id: 1 }, { Id: 2 }];
	expect(arr.RemoveById(list, 2)).toBeTruthy();
	expect(list).toEqual([{ Id: 1 }]);
	expect(arr.RemoveById(list, 99)).toBeFalsy();
});

it('RemoveByKey borra la clave de un objeto asociativo', () => {
	const assoc = { a: 1, b: 2 };
	expect(arr.RemoveByKey(assoc, 'a')).toBeTruthy();
	expect(assoc).toEqual({ b: 2 });
	expect(arr.RemoveByKey(assoc, 'zz')).toBeFalsy();
});

it('Substract resta una vez cada elemento y no modifica el original', () => {
	const original = [1, 2, 2, 3];
	const result = arr.Substract(original, [2, 3, 9]);
	expect(result).toEqual([1, 2]);
	expect(original).toEqual([1, 2, 2, 3]);
});

describe('arr: búsqueda por Id y por propiedad');

it('IndexById encuentra por Id y devuelve -1 si no existe', () => {
	const list = [{ Id: 10 }, { Id: 20 }];
	expect(arr.IndexById(list, 20)).toBe(1);
	expect(arr.IndexById(list, 30)).toBe(-1);
});

it('IndexById compara con igualdad estricta: "20" no es 20', () => {
	expect(arr.IndexById([{ Id: 20 }], '20')).toBe(-1);
});

it('IndexById con property busca el Id dentro de esa propiedad', () => {
	const list = [{ Metric: { Id: 5 } }, { Metric: { Id: 6 } }];
	expect(arr.IndexById(list, 6, 'Metric')).toBe(1);
});

it('ContainsById refleja IndexById', () => {
	expect(arr.ContainsById([{ Id: 1 }], 1)).toBeTruthy();
	expect(arr.ContainsById([{ Id: 1 }], 2)).toBeFalsy();
});

it('GetById devuelve el elemento; sin default lanza error, con default lo devuelve', () => {
	const list = [{ Id: 1, n: 'uno' }];
	expect(arr.GetById(list, 1).n).toBe('uno');
	let message = null;
	try {
		arr.GetById(list, 2);
	} catch (e) {
		message = e.message;
	}
	expect(message).toBe('Item not found.');
	expect(arr.GetById(list, 2, null)).toBeNull();
});

it('IndexByProperty usa igualdad laxa: "7" coincide con 7', () => {
	expect(arr.IndexByProperty([{ k: 7 }], 'k', '7')).toBe(0);
	expect(arr.IndexByProperty([{ k: 7 }], 'k', 8)).toBe(-1);
});

it('GetByProperty devuelve el elemento o null', () => {
	const list = [{ k: 'a' }, { k: 'b' }];
	expect(arr.GetByProperty(list, 'k', 'b')).toBe(list[1]);
	expect(arr.GetByProperty(list, 'k', 'z')).toBeNull();
});

it('IndexByKey devuelve la posición de la clave entre las claves del objeto', () => {
	expect(arr.IndexByKey({ a: 1, b: 2 }, 'b')).toBe(1);
	expect(arr.IndexByKey({ a: 1 }, 'z')).toBe(-1);
});

describe('arr: reemplazos');

it('ReplaceAt reemplaza en la posición; con -1 devuelve false', () => {
	const list = ['a', 'b', 'c'];
	expect(arr.ReplaceAt(list, 1, 'X')).toBeTruthy();
	expect(list).toEqual(['a', 'X', 'c']);
	expect(arr.ReplaceAt(list, -1, 'Y')).toBeFalsy();
	expect(list).toEqual(['a', 'X', 'c']);
});

it('ReplaceById reemplaza el elemento con ese Id', () => {
	const list = [{ Id: 1, v: 'a' }, { Id: 2, v: 'b' }];
	expect(arr.ReplaceById(list, 2, { Id: 2, v: 'nuevo' })).toBeTruthy();
	expect(list[1].v).toBe('nuevo');
	expect(arr.ReplaceById(list, 9, { Id: 9 })).toBeFalsy();
});

it('ReplaceByIdOrAdd agrega si no existe y reemplaza si existe', () => {
	const list = [{ Id: 1, v: 'a' }];
	arr.ReplaceByIdOrAdd(list, { Id: 2, v: 'b' });
	expect(list).toHaveLength(2);
	arr.ReplaceByIdOrAdd(list, { Id: 1, v: 'cambiado' });
	expect(list).toHaveLength(2);
	expect(list[0].v).toBe('cambiado');
});

describe('arr: orden y movimiento (intercambian la propiedad Order)');

it('MoveUpAt sube el elemento e intercambia los Order', () => {
	const list = [{ n: 'a', Order: 1 }, { n: 'b', Order: 2 }, { n: 'c', Order: 3 }];
	expect(arr.MoveUpAt(list, 2)).toBeTruthy();
	expect(list.map(x => x.n)).toEqual(['a', 'c', 'b']);
	expect(list[1].Order).toBe(2);
	expect(list[2].Order).toBe(3);
});

it('MoveUpAt sobre el primero no hace nada', () => {
	const list = [{ n: 'a', Order: 1 }, { n: 'b', Order: 2 }];
	expect(arr.MoveUpAt(list, 0)).toBeFalsy();
	expect(list[0].n).toBe('a');
});

it('MoveDownAt baja el elemento e intercambia los Order', () => {
	const list = [{ n: 'a', Order: 1 }, { n: 'b', Order: 2 }, { n: 'c', Order: 3 }];
	expect(arr.MoveDownAt(list, 0)).toBeTruthy();
	expect(list.map(x => x.n)).toEqual(['b', 'a', 'c']);
	expect(list[0].Order).toBe(1);
	expect(list[1].Order).toBe(2);
});

it('MoveDownAt sobre el último o con índice -1 no hace nada', () => {
	const list = [{ n: 'a', Order: 1 }, { n: 'b', Order: 2 }];
	expect(arr.MoveDownAt(list, 1)).toBeFalsy();
	expect(arr.MoveDownAt(list, -1)).toBeFalsy();
});

it('MoveUp y MoveDown localizan el elemento por referencia', () => {
	const a = { n: 'a', Order: 1 };
	const b = { n: 'b', Order: 2 };
	const list = [a, b];
	expect(arr.MoveUp(list, b)).toBeTruthy();
	expect(list[0]).toBe(b);
	expect(arr.MoveDown(list, b)).toBeTruthy();
	expect(list[1]).toBe(b);
	expect(arr.MoveUp(list, { n: 'ajeno' })).toBeFalsy();
});

it('SortByValue ordena ascendente por el atributo y devuelve el mismo arreglo', () => {
	const list = [{ v: 3 }, { v: 1 }, { v: 2 }];
	const result = arr.SortByValue(list, 'v');
	expect(result).toBe(list);
	expect(list.map(x => x.v)).toEqual([1, 2, 3]);
});

it('SortCopy ordena una copia y deja intacto el original', () => {
	const original = [3, 1, 2];
	const sorted = arr.SortCopy(original, (a, b) => a - b);
	expect(sorted).toEqual([1, 2, 3]);
	expect(original).toEqual([3, 1, 2]);
});

it('InsertSortedByValue inserta antes del primero mayor, o al final si no hay', () => {
	const list = [{ v: 1 }, { v: 5 }];
	arr.InsertSortedByValue(list, { v: 3 }, 'v');
	arr.InsertSortedByValue(list, { v: 9 }, 'v');
	expect(list.map(x => x.v)).toEqual([1, 3, 5, 9]);
});

describe('arr: diccionarios y agrupaciones');

it('ToDictionaryByValue indexa por el atributo; ante repetidos queda el último', () => {
	const dic = arr.ToDictionaryByValue([{ k: 'a', v: 1 }, { k: 'b', v: 2 }, { k: 'a', v: 3 }], 'k');
	expect(dic.a.v).toBe(3);
	expect(dic.b.v).toBe(2);
});

it('ToDictionaryGroupedByValue agrupa los elementos por el atributo', () => {
	const dic = arr.ToDictionaryGroupedByValue([{ g: 'x', n: 1 }, { g: 'y', n: 2 }, { g: 'x', n: 3 }], 'g');
	expect(dic.x).toHaveLength(2);
	expect(dic.y).toHaveLength(1);
});

it('ToDictionaryValueGroupedByValue agrupa solo el valor de otro atributo', () => {
	const dic = arr.ToDictionaryValueGroupedByValue([{ g: 'x', n: 1 }, { g: 'x', n: 3 }], 'g', 'n');
	expect(dic).toEqual({ x: [1, 3] });
});

it('ToDictionaryPairGroupedByValue arma un diccionario de pares clave/valor por grupo', () => {
	const items = [{ g: 'x', k: 'a', v: 1 }, { g: 'x', k: 'b', v: 2 }, { g: 'y', k: 'a', v: 3 }];
	expect(arr.ToDictionaryPairGroupedByValue(items, 'g', 'k', 'v')).toEqual({ x: { a: 1, b: 2 }, y: { a: 3 } });
});

it('ToDictionaryGroupedByDictionary agrupa por cada clave del diccionario del elemento y omite los que no lo tienen', () => {
	const items = [{ n: 1, tags: { a: true, b: true } }, { n: 2, tags: { a: true } }, { n: 3 }];
	const dic = arr.ToDictionaryGroupedByDictionary(items, 'tags');
	expect(dic.a).toHaveLength(2);
	expect(dic.b).toHaveLength(1);
	expect(Object.keys(dic)).toHaveLength(2);
});

it('DictionaryIdToCollectionProperty copia el valor del diccionario por Id, o el default', () => {
	const collection = [{ Id: 1 }, { Id: 2 }];
	arr.DictionaryIdToCollectionProperty(collection, { 1: ['x'] }, 'Items');
	expect(collection[0].Items).toEqual(['x']);
	expect(collection[1].Items).toEqual([]);
});

it('DictionaryIdToDictionaryProperty usa {} como default', () => {
	const collection = [{ Id: 1 }];
	arr.DictionaryIdToDictionaryProperty(collection, {}, 'Map');
	expect(collection[0].Map).toEqual({});
});

describe('arr: asociativos (objetos usados como arreglo)');

it('AddRangeAssoc copia las claves; ClearAssoc las borra; FillAssoc reemplaza todo', () => {
	const assoc = { a: 1 };
	arr.AddRangeAssoc(assoc, { b: 2 });
	expect(assoc).toEqual({ a: 1, b: 2 });
	arr.FillAssoc(assoc, { z: 9 });
	expect(assoc).toEqual({ z: 9 });
	arr.ClearAssoc(assoc);
	expect(Object.keys(assoc)).toHaveLength(0);
});

describe('arr: consultas y utilidades');

it('GetUniqueValues devuelve los valores distintos del atributo, en orden de aparición', () => {
	expect(arr.GetUniqueValues([{ v: 'a' }, { v: 'b' }, { v: 'a' }], 'v')).toEqual(['a', 'b']);
});

it('FilterByValue filtra por igualdad estricta del atributo', () => {
	const list = [{ v: 1 }, { v: '1' }, { v: 1 }];
	expect(arr.FilterByValue(list, 'v', 1)).toHaveLength(2);
});

it('SearchByCaption filtra por Caption sin distinguir mayúsculas; sin término devuelve el mismo arreglo', () => {
	const list = [{ Caption: 'Población' }, { Caption: 'Vivienda' }, { Caption: null }];
	expect(arr.SearchByCaption(list, 'POBL')).toHaveLength(1);
	expect(arr.SearchByCaption(list, '')).toBe(list);
});

it('AnyToLower convierte a minúsculas y trata null/undefined como texto vacío', () => {
	expect(arr.AnyToLower('AbC')).toBe('abc');
	expect(arr.AnyToLower(12)).toBe('12');
	expect(arr.AnyToLower(null)).toBe('');
	expect(arr.AnyToLower(undefined)).toBe('');
});

it('ToIntArray parsea en base 10 y GetIds extrae el Id', () => {
	expect(arr.ToIntArray(['1', '22', '3.9'])).toEqual([1, 22, 3]);
	expect(arr.GetIds([{ Id: 4 }, { Id: 5 }])).toEqual([4, 5]);
});

it('AreEquals compara por contenido y longitud; null contra algo distinto de null es false', () => {
	const same = [1, 2];
	expect(arr.AreEquals(same, same)).toBeTruthy();
	expect(arr.AreEquals([1, 2], [1, 2])).toBeTruthy();
	expect(arr.AreEquals([1, 2], [1, 3])).toBeFalsy();
	expect(arr.AreEquals([1], [1, 2])).toBeFalsy();
	expect(arr.AreEquals(null, [1])).toBeFalsy();
	expect(arr.AreEquals(null, null)).toBeTruthy();
});

describe('arr: ListToTreeFromIndentedItems');

it('arma el árbol según el nivel de cada ítem y limpia hijos previos', () => {
	const items = [
		{ n: 'raiz1', level: 0, kids: ['viejo'] },
		{ n: 'hijo1', level: 1 },
		{ n: 'nieto', level: 2 },
		{ n: 'hijo2', level: 1 },
		{ n: 'raiz2', level: 0 },
	];
	const root = arr.ListToTreeFromIndentedItems(items, 'level', 'kids');
	expect(root).toHaveLength(2);
	expect(root[0].kids).toHaveLength(2);
	expect(root[0].kids[0].kids[0].n).toBe('nieto');
	expect(root[1].kids).toBeFalsy();
});

it('un ítem sin la propiedad de nivel se toma como nivel 0', () => {
	const root = arr.ListToTreeFromIndentedItems([{ n: 'a' }, { n: 'b' }], 'level', 'kids');
	expect(root).toHaveLength(2);
});
