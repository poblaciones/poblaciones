import { describe, it, expect } from './_harness.mjs';
import helper from '@/common/components/MpGridHelper';

describe('MpGridHelper: columnas y valores anidados');

it('GetColumnDef devuelve la columna con esa property o null', () => {
	const columns = [{ property: 'Name' }, { property: 'Id' }];
	expect(helper.GetColumnDef(columns, 'Id')).toBe(columns[1]);
	expect(helper.GetColumnDef(columns, 'Otra')).toBeNull();
});

it('GetNestedValue lee una propiedad simple o con notación de punto', () => {
	expect(helper.GetNestedValue({ Name: 'x' }, 'Name')).toBe('x');
	expect(helper.GetNestedValue({ Group: { Caption: 'g' } }, 'Group.Caption')).toBe('g');
});

it('GetNestedValue se detiene en el primer null o indefinido del camino', () => {
	expect(helper.GetNestedValue({ Group: null }, 'Group.Caption')).toBeNull();
	expect(helper.GetNestedValue({}, 'Group.Caption')).toBe(undefined);
});

it('ResolveValue ejecuta una función con el ítem o devuelve el valor tal cual', () => {
	expect(helper.ResolveValue(function (item) { return item.n * 2; }, { n: 4 })).toBe(8);
	expect(helper.ResolveValue('fijo', { n: 4 })).toBe('fijo');
});

describe('MpGridHelper: tipo de ordenamiento');

it('ResolveSortType respeta el sortType declarado', () => {
	expect(helper.ResolveSortType({ sortType: 'date', property: 'x' }, [{ x: 1 }])).toBe('date');
});

it('ResolveSortType infiere boolean, number o text del primer valor no nulo', () => {
	expect(helper.ResolveSortType({ property: 'x' }, [{ x: null }, { x: true }])).toBe('boolean');
	expect(helper.ResolveSortType({ property: 'x' }, [{ x: 5 }])).toBe('number');
	expect(helper.ResolveSortType({ property: 'x' }, [{ x: 'a' }])).toBe('text');
});

it('ResolveSortType sin ningún valor, o con fechas en texto, da text', () => {
	expect(helper.ResolveSortType({ property: 'x' }, [])).toBe('text');
	expect(helper.ResolveSortType({ property: 'x' }, [{ x: '2024-01-01T00:00:00Z' }])).toBe('text');
});

it('FindFirstValue busca también en los hijos cuando se indica la propiedad de hijos', () => {
	const items = [{ x: null, kids: [{ x: null }, { x: 7 }] }];
	expect(helper.FindFirstValue(items, 'x', 'kids')).toBe(7);
	expect(helper.FindFirstValue(items, 'x', null)).toBeNull();
	expect(helper.FindFirstValue([{ x: null, kids: [] }], 'x', 'kids')).toBeNull();
});

describe('MpGridHelper: nombres de pestaña');

it('HashString es determinístico, en base 36 (djb2)', () => {
	expect(helper.HashString('')).toBe('45h');
	expect(helper.HashString('a')).toBe('3t3a');
	expect(helper.HashString('/obras/1')).toBe(helper.HashString('/obras/1'));
	expect(helper.HashString('/obras/1') === helper.HashString('/obras/2')).toBeFalsy();
});

it('BuildEditTabName combina el hash de la URL de la grilla con el id del ítem', () => {
	expect(helper.BuildEditTabName('/obras/1', 15)).toBe('mpgrid_' + helper.HashString('/obras/1') + '_15');
});

describe('MpGridHelper: formato de valores y fechas');

it('ToDate devuelve la misma fecha si ya es Date, o interpreta el texto', () => {
	const date = new Date(2024, 0, 5);
	expect(helper.ToDate(date)).toBe(date);
	expect(helper.ToDate('2024-01-15T10:30:00.000Z').getTime()).toBe(Date.UTC(2024, 0, 15, 10, 30));
});

it('FormatValue devuelve vacío para null, undefined y cadena vacía', () => {
	expect(helper.FormatValue(null, 'text')).toBe('');
	expect(helper.FormatValue(undefined, 'text')).toBe('');
	expect(helper.FormatValue('', 'text')).toBe('');
});

it('FormatValue muestra Sí/No para booleanos, también cuando el valor es false', () => {
	expect(helper.FormatValue(true, 'boolean')).toBe('Sí');
	expect(helper.FormatValue(false, 'boolean')).toBe('No');
});

it('FormatValue formatea fechas con FormateDateTime y deja el resto sin cambios', () => {
	expect(helper.FormatValue(new Date(2024, 0, 5, 9, 5, 3), 'date')).toBe('2024-01-05 9:5:3');
	expect(helper.FormatValue('abc', 'text')).toBe('abc');
	expect(helper.FormatValue(0, 'number')).toBe(0);
});

describe('MpGridHelper: comparación para ordenar');

const numberColumn = { property: 'n' };

it('GetSortValue usa sortValue si existe, o el valor anidado de property', () => {
	expect(helper.GetSortValue({ property: 'n', sortValue: function (item) { return item.n + 1; } }, { n: 1 })).toBe(2);
	expect(helper.GetSortValue({ property: 'g.n' }, { g: { n: 9 } })).toBe(9);
});

it('CompareByColumn devuelve 0 para valores iguales y pone primero los nulos', () => {
	expect(helper.CompareByColumn({ n: 1 }, { n: 1 }, numberColumn, 'number')).toBe(0);
	expect(helper.CompareByColumn({ n: null }, { n: 1 }, numberColumn, 'number')).toBe(-1);
	expect(helper.CompareByColumn({ n: 1 }, { n: undefined }, numberColumn, 'number')).toBe(1);
	expect(helper.CompareByColumn({ n: null }, { n: undefined }, numberColumn, 'number')).toBe(-1);
});

it('CompareByColumn compara números por diferencia', () => {
	expect(helper.CompareByColumn({ n: 10 }, { n: 4 }, numberColumn, 'number')).toBe(6);
	expect(helper.CompareByColumn({ n: 4 }, { n: 10 }, numberColumn, 'number')).toBe(-6);
});

it('CompareByColumn compara booleanos con true después de false', () => {
	expect(helper.CompareByColumn({ n: true }, { n: false }, numberColumn, 'boolean')).toBe(1);
	expect(helper.CompareByColumn({ n: false }, { n: true }, numberColumn, 'boolean')).toBe(-1);
});

it('CompareByColumn compara fechas (Date o texto) por su instante', () => {
	const early = new Date(Date.UTC(2024, 0, 1));
	const late = '2024-01-02T00:00:00.000Z';
	expect(helper.CompareByColumn({ n: late }, { n: early }, numberColumn, 'date')).toBe(24 * 3600 * 1000);
	expect(helper.CompareByColumn({ n: early }, { n: late }, numberColumn, 'date')).toBe(-24 * 3600 * 1000);
});

it('CompareByColumn compara texto sin acentos, recortando espacios y con orden numérico humano', () => {
	expect(helper.CompareByColumn({ n: ' árbol ' }, { n: 'arbol' }, numberColumn, 'text')).toBe(0);
	expect(helper.CompareByColumn({ n: 'Item 2' }, { n: 'Item 10' }, numberColumn, 'text') < 0).toBeTruthy();
});

describe('MpGridHelper: búsqueda por palabras');

it('NormalizeForSearch pasa a minúsculas, quita acentos y toma todo símbolo como separador', () => {
	expect(helper.NormalizeForSearch('Niño-Año')).toBe('nino ano');
	expect(helper.NormalizeForSearch('>Rosario')).toBe('rosario');
	expect(helper.NormalizeForSearch(null)).toBe('');
});

it('AnyWordStartsWith indica si alguna palabra empieza con el prefijo', () => {
	expect(helper.AnyWordStartsWith(['nivel', 'educativo'], 'edu')).toBeTruthy();
	expect(helper.AnyWordStartsWith(['medusa'], 'edu')).toBeFalsy();
});

it('MatchesCaption exige que cada palabra del término sea prefijo de alguna palabra del valor', () => {
	expect(helper.MatchesCaption('Nivel educativo', 'edu')).toBeTruthy();
	expect(helper.MatchesCaption('Nivel educativo', 'edu niv')).toBeTruthy();
	expect(helper.MatchesCaption('Nivel educativo', 'edu xyz')).toBeFalsy();
});

it('MatchesCaption no coincide a mitad de palabra', () => {
	expect(helper.MatchesCaption('medusa', 'edu')).toBeFalsy();
});

it('MatchesCaption ignora acentos, mayúsculas y signos', () => {
	expect(helper.MatchesCaption('Educación > Básica', 'EDUCACION basica')).toBeTruthy();
});

it('MatchesCaption: un término vacío coincide con todo y un valor nulo con nada', () => {
	expect(helper.MatchesCaption('algo', '')).toBeTruthy();
	expect(helper.MatchesCaption(null, 'a')).toBeFalsy();
	expect(helper.MatchesCaption(undefined, '')).toBeFalsy();
});

describe('MpGridHelper: íconos');

it('IsFontAwesome reconoce los prefijos "fas " y "fa ", no otros íconos ni valores no textuales', () => {
	expect(helper.IsFontAwesome('fas fa-history')).toBeTruthy();
	expect(helper.IsFontAwesome('fa fa-history')).toBeTruthy();
	expect(helper.IsFontAwesome('lock')).toBeFalsy();
	expect(helper.IsFontAwesome(null)).toBeFalsy();
});

it('ResolveBadges descarta los íconos cuyo show da falso y resuelve funciones de ícono y tooltip', () => {
	const icons = [
		{ icon: 'lock', tooltip: 'Bloqueado' },
		{ icon: function (item) { return 'fas ' + item.icon; }, tooltip: function (item) { return item.tip; } },
		{ icon: 'oculto', show: function () { return false; } },
	];
	const badges = helper.ResolveBadges(icons, { icon: 'fa-star', tip: 'Favorito' });
	expect(badges).toEqual([
		{ icon: 'lock', isFontAwesome: false, tooltip: 'Bloqueado' },
		{ icon: 'fas fa-star', isFontAwesome: true, tooltip: 'Favorito' },
	]);
});

it('ResolveBadges sin lista de íconos devuelve un arreglo vacío; sin tooltip da null', () => {
	expect(helper.ResolveBadges(undefined, {})).toEqual([]);
	expect(helper.ResolveBadges([{ icon: 'lock' }], {})[0].tooltip).toBeNull();
});

it('ResolveInlineIcons separa con coma solo a los íconos con texto que siguen a otro con texto', () => {
	const icons = [
		{ icon: 'a', text: 'Uno' },
		{ icon: 'b' },
		{ icon: 'c', text: 'Dos' },
		{ icon: 'd', text: 'Tres', show: function () { return false; } },
	];
	const inline = helper.ResolveInlineIcons(icons, {});
	expect(inline).toHaveLength(3);
	expect(inline[0].leadingSeparator).toBeFalsy();
	expect(inline[1].leadingSeparator).toBeFalsy();
	expect(inline[1].text).toBeNull();
	expect(inline[2].leadingSeparator).toBeTruthy();
});

it('ResolveInlineIcons sin lista de íconos devuelve un arreglo vacío', () => {
	expect(helper.ResolveInlineIcons(undefined, {})).toEqual([]);
});

it('ResolveInlineIcons resuelve el texto y el tooltip cuando son funciones', () => {
	const icons = [{ icon: 'a', text: function (item) { return item.t; }, tooltip: function () { return 'ayuda'; } }];
	const inline = helper.ResolveInlineIcons(icons, { t: 'Hola' });
	expect(inline[0].text).toBe('Hola');
	expect(inline[0].tooltip).toBe('ayuda');
});

describe('MpGridHelper: texto buscable de una fila');

it('GetColumnSearchText de un switch da Sí/No', () => {
	expect(helper.GetColumnSearchText({ type: 'switch', property: 'On' }, { On: true })).toBe('Sí');
	expect(helper.GetColumnSearchText({ type: 'switch', property: 'On' }, { On: 0 })).toBe('No');
});

it('GetColumnSearchText de íconos concatena solo los textos presentes', () => {
	const column = { type: 'icons', icons: [{ icon: 'a', text: 'Uno' }, { icon: 'b' }, { icon: 'c', text: 'Dos' }] };
	expect(helper.GetColumnSearchText(column, {})).toBe('Uno Dos');
});

it('GetColumnSearchText de status usa el tooltip, o vacío si no hay', () => {
	expect(helper.GetColumnSearchText({ type: 'status', tooltip: 'Activo' }, {})).toBe('Activo');
	expect(helper.GetColumnSearchText({ type: 'status', tooltip: function (item) { return item.s; } }, { s: 'X' })).toBe('X');
	expect(helper.GetColumnSearchText({ type: 'status' }, {})).toBe('');
});

it('GetColumnSearchText de texto usa value(item) o la propiedad, con Sí/No para booleanos y vacío para nulos', () => {
	expect(helper.GetColumnSearchText({ property: 'n', value: function (item) { return 'v' + item.n; } }, { n: 1 })).toBe('v1');
	expect(helper.GetColumnSearchText({ property: 'n' }, { n: 5 })).toBe('5');
	expect(helper.GetColumnSearchText({ property: 'n' }, { n: true })).toBe('Sí');
	expect(helper.GetColumnSearchText({ property: 'n' }, { n: false })).toBe('No');
	expect(helper.GetColumnSearchText({ property: 'n' }, { n: null })).toBe('');
});

it('GetRowSearchText une el texto no vacío de cada columna con espacios', () => {
	const columns = [{ property: 'a' }, { property: 'b' }, { property: 'c' }];
	expect(helper.GetRowSearchText(columns, { a: 'uno', b: null, c: 'tres' })).toBe('uno tres');
});

describe('MpGridHelper: jerarquía (filtrar, ordenar y aplanar)');

const byName = function (a, b) { return a.Name.localeCompare(b.Name); };

function makeTree() {
	return [
		{ Id: 2, Name: 'Zeta', Kids: [{ Id: 21, Name: 'Hijo B' }, { Id: 20, Name: 'Hijo A' }] },
		{ Id: 1, Name: 'Alfa' },
	];
}

const levelOptions = {
	comparator: byName,
	childrenProperty: 'Kids',
	searchColumns: [{ property: 'Name' }],
	search: '',
	expandedIds: {},
};

it('FilterAndSortLevel ordena hermanos a cada nivel y conserva los hijos ya ordenados', () => {
	const level = helper.FilterAndSortLevel(makeTree(), levelOptions);
	expect(level.map(node => node.item.Name)).toEqual(['Alfa', 'Zeta']);
	expect(level[1].matchingChildren.map(node => node.item.Name)).toEqual(['Hijo A', 'Hijo B']);
	expect(level[1].hasChildrenData).toBeTruthy();
	expect(level[0].hasChildrenData).toBeFalsy();
});

it('FilterAndSortLevel sin childrenProperty trata a todos los ítems como hojas', () => {
	const options = { ...levelOptions, childrenProperty: null };
	const level = helper.FilterAndSortLevel(makeTree(), options);
	expect(level[1].hasChildrenData).toBeFalsy();
	expect(level[1].matchingChildren).toHaveLength(0);
});

it('FilterAndSortLevel no modifica el arreglo original', () => {
	const tree = makeTree();
	helper.FilterAndSortLevel(tree, levelOptions);
	expect(tree.map(item => item.Name)).toEqual(['Zeta', 'Alfa']);
});

it('FilterAndSortLevel con búsqueda conserva a los que coinciden y a los que tienen descendientes que coinciden', () => {
	const options = { ...levelOptions, search: 'hijo a' };
	const level = helper.FilterAndSortLevel(makeTree(), options);
	expect(level).toHaveLength(1);
	expect(level[0].item.Name).toBe('Zeta');
	expect(level[0].selfMatch).toBeFalsy();
	expect(level[0].descendantMatch).toBeTruthy();
	expect(level[0].matchingChildren).toHaveLength(1);
});

it('FilterAndSortLevel con onlySearchDescriptions busca solo en captionProperty', () => {
	const options = { ...levelOptions, search: 'alfa', onlySearchDescriptions: true, captionProperty: 'Name', searchColumns: [] };
	const level = helper.FilterAndSortLevel(makeTree(), options);
	expect(level).toHaveLength(1);
	expect(level[0].item.Name).toBe('Alfa');
});

it('FlattenLevel sin búsqueda respeta expandedIds e indenta por nivel', () => {
	const level = helper.FilterAndSortLevel(makeTree(), levelOptions);
	const collapsed = helper.FlattenLevel(level, 0, levelOptions);
	expect(collapsed.map(row => row.item.Id)).toEqual([1, 2]);
	expect(collapsed[1].hasChildren).toBeTruthy();
	expect(collapsed[1].expanded).toBeFalsy();
	const expandedOptions = { ...levelOptions, expandedIds: { 2: true } };
	const expanded = helper.FlattenLevel(level, 0, expandedOptions);
	expect(expanded.map(row => row.item.Id)).toEqual([1, 2, 20, 21]);
	expect(expanded.map(row => row.level)).toEqual([0, 0, 1, 1]);
});

it('FlattenLevel bajo búsqueda expande a la fuerza al nodo incluido solo por un descendiente', () => {
	const options = { ...levelOptions, search: 'hijo a' };
	const level = helper.FilterAndSortLevel(makeTree(), options);
	const rows = helper.FlattenLevel(level, 0, options);
	expect(rows.map(row => row.item.Id)).toEqual([2, 20]);
	expect(rows[0].expanded).toBeTruthy();
	expect(rows[0].hasChildren).toBeTruthy();
});

it('FlattenLevel bajo búsqueda: un nodo que coincide por sí mismo, sin descendientes que coincidan, no muestra expansor', () => {
	const options = { ...levelOptions, search: 'zeta' };
	const level = helper.FilterAndSortLevel(makeTree(), options);
	const rows = helper.FlattenLevel(level, 0, options);
	expect(rows).toHaveLength(1);
	expect(rows[0].hasChildren).toBeFalsy();
});

it('FlattenLevel bajo búsqueda: un nodo con descendientes que también coinciden se muestra expandido aunque el usuario no lo haya expandido', () => {
	const tree = [{ Id: 1, Name: 'Hijo raíz', Kids: [{ Id: 2, Name: 'Hijo nieto' }] }];
	const options = { ...levelOptions, search: 'hijo', expandedIds: {} };
	const level = helper.FilterAndSortLevel(tree, options);
	const rows = helper.FlattenLevel(level, 0, options);
	expect(rows.map(row => row.item.Id)).toEqual([1, 2]);
	expect(rows[0].expanded).toBeTruthy();
});

it('FlattenLevel bajo búsqueda: un nodo que coincide solo por sí mismo queda marcado expandido si el usuario lo había expandido', () => {
	const options = { ...levelOptions, search: 'zeta', expandedIds: { 2: true } };
	const level = helper.FilterAndSortLevel(makeTree(), options);
	const rows = helper.FlattenLevel(level, 0, options);
	expect(rows[0].expanded).toBeTruthy();
	expect(rows[0].hasChildren).toBeFalsy();
});

it('CollectExpandableIds reúne los Id de todos los ítems con hijos, a cualquier profundidad', () => {
	const tree = [
		{ Id: 1, Kids: [{ Id: 2, Kids: [{ Id: 3 }] }, { Id: 4, Kids: [] }] },
		{ Id: 5 },
	];
	expect(helper.CollectExpandableIds(tree, 'Kids')).toEqual({ 1: true, 2: true });
});
