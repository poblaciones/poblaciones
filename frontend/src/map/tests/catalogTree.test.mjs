import { describe, it, expect } from './_harness.mjs';
import { makeCatalogTree } from './fixtures.mjs';
import CatalogTree from '@/map/classes/catalog/CatalogTree';

function makeTree() {
	return new CatalogTree(makeCatalogTree());
}

describe('catalogTree: clasificación del árbol (ContentOf)');

it('una categoría con sub-nodos que tienen Items es una rama navegable', () => {
	const tree = makeTree();
	const content = tree.ContentOf(tree.categories[0]); // Población
	expect(content.branches).toHaveLength(2);
	expect(content.sections).toHaveLength(0);
});

it('un nodo con hojas planas produce una única sección sin nombre', () => {
	const tree = makeTree();
	const censos = tree.categories[0].Items[0];
	const content = tree.ContentOf(censos);
	expect(content.branches).toHaveLength(0);
	expect(content.sections).toHaveLength(1);
	expect(content.sections[0].Key).toBe('_all');
	expect(content.sections[0].Items).toHaveLength(2);
});

it('un nodo con VersionId y agrupadores produce una sección por agrupador, no ramas', () => {
	const tree = makeTree();
	const grouped = {
		Id: 9, Name: 'Municipios', VersionId: 3,
		Items: [
			{ Id: 91, Name: 'Buenos Aires', Code: '06', Items: [{ Id: 911, Name: 'Tandil' }] },
			{ Id: 92, Name: 'Córdoba', Code: '14', Items: [{ Id: 921, Name: 'Río Cuarto' }] },
		],
	};
	const content = tree.ContentOf(grouped);
	expect(content.branches).toHaveLength(0);
	expect(content.sections).toHaveLength(2);
	expect(content.sections[0].Name).toBe('Buenos Aires');
	expect(content.sections[0].GroupId).toBe(91);
	expect(content.sections[0].Items[0].Name).toBe('Tandil');
});

it('el formato anterior (diccionario agrupador→hojas) produce una sección por clave', () => {
	const tree = makeTree();
	const content = tree.ContentOf(tree.categories[2]); // Educación
	expect(content.branches).toHaveLength(0);
	expect(content.sections).toHaveLength(2);
	expect(content.sections[0].Name).toBe('INDEC');
	expect(content.sections[1].Items[0].Name).toBe('Matrícula');
});

describe('catalogTree: delimitaciones, etiquetas y subtítulos');

it('IsDelimitation distingue contenedores de hojas de los agrupadores de tipo', () => {
	const tree = makeTree();
	const limites = tree.categories[1];
	expect(tree.IsDelimitation(limites)).toBeFalsy();          // agrupa ramas
	expect(tree.IsDelimitation(limites.Items[0])).toBeTruthy(); // Provincias: hojas
});

it('BranchLabel cuenta hijos directos y usa el nombre del nodo si nounFromNodeName', () => {
	const tree = makeTree();
	expect(tree.BranchLabel(tree.categories[0], 'indicador', 'indicadores', false)).toBe('2 indicadores');
	const provincias = tree.categories[1].Items[0];
	expect(tree.BranchLabel(provincias, 'indicador', 'indicadores', false)).toBe('2 indicadores');
	expect(tree.BranchLabel(provincias, 'indicador', 'indicadores', true)).toBe('2 provincias');
});

it('ItemSubtitle prioriza Subtitle, luego las versiones y luego "Parent > Tipo"', () => {
	const tree = makeTree();
	const container = { Name: 'Departamentos' };
	expect(tree.ItemSubtitle({ Subtitle: 'x', Versions: [{ Name: '2020' }] }, container)).toBe('x');
	expect(tree.ItemSubtitle({ Versions: [{ Name: '2010' }, { Name: '2020' }] }, container)).toBe('2010, 2020');
	expect(tree.ItemSubtitle({ Parent: 'Buenos Aires' }, container)).toBe('Buenos Aires > Departamentos');
	expect(tree.ItemSubtitle({ Parent: 'Buenos Aires' }, null)).toBe('Buenos Aires');
	expect(tree.ItemSubtitle({ Name: 'Tandil' }, container)).toBe('');
});

describe('catalogTree: recorridos (Leaves, Branches)');

it('Leaves recorre todo el catálogo con el contenedor directo de cada hoja', () => {
	const tree = makeTree();
	const leaves = tree.Leaves(null);
	expect(leaves).toHaveLength(8);
	const tandil = leaves.find(e => e.item.Name === 'Tandil');
	expect(tandil.container.Name).toBe('Departamentos');
});

it('Leaves con un nodo se acota a su subárbol', () => {
	const tree = makeTree();
	expect(tree.Leaves(tree.categories[0])).toHaveLength(3);
});

it('Branches incluye agrupadores y contenedores de hojas con padre y profundidad', () => {
	const tree = makeTree();
	const branches = tree.Branches(null);
	const provincias = branches.find(e => e.branch.Name === 'Provincias');
	expect(provincias.parent.Name).toBe('Límites políticos');
	expect(provincias.depth).toBe(1);
	const limites = branches.find(e => e.branch.Name === 'Límites políticos');
	expect(limites.parent).toBeNull();
	expect(limites.depth).toBe(0);
});
