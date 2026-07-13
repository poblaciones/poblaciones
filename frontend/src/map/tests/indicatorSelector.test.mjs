import { describe, it, expect } from './_harness.mjs';
import { setupWindow, makeCatalogTree, mountLite } from './fixtures.mjs';
import IndicatorSelector from '@/map/components/widgets/sideToolbar/indicatorSelector.vue';

// Caracterización de la lógica del panel selector ANTES de modularizarlo.
// mountLite (fixtures) instancia el objeto de opciones sin Vue: props con
// defaults, data(), methods bindeados y computed como getters. No se prueba
// template ni DOM; sí toda la clasificación del árbol, la búsqueda y las
// emisiones, que es lo que la refactorización debe conservar.

function mountSelector(options) {
	setupWindow();
	options = options || {};
	options.props = Object.assign({ categories: makeCatalogTree() }, options.props);
	return mountLite(IndicatorSelector, options);
}

describe('indicatorSelector: clasificación del árbol (contentOf)');

it('una categoría con sub-nodos que tienen Items es una rama navegable', () => {
	const panel = mountSelector();
	const content = panel.contentOf(panel.categories[0]); // Población
	expect(content.branches).toHaveLength(2);
	expect(content.sections).toHaveLength(0);
});

it('un nodo con hojas planas produce una única sección sin nombre', () => {
	const panel = mountSelector();
	const censos = panel.categories[0].Items[0];
	const content = panel.contentOf(censos);
	expect(content.branches).toHaveLength(0);
	expect(content.sections).toHaveLength(1);
	expect(content.sections[0].Key).toBe('_all');
	expect(content.sections[0].Items).toHaveLength(2);
});

it('un nodo con VersionId y agrupadores produce una sección por agrupador, no ramas', () => {
	const panel = mountSelector();
	const grouped = {
		Id: 9, Name: 'Municipios', VersionId: 3,
		Items: [
			{ Id: 91, Name: 'Buenos Aires', Code: '06', Items: [{ Id: 911, Name: 'Tandil' }] },
			{ Id: 92, Name: 'Córdoba', Code: '14', Items: [{ Id: 921, Name: 'Río Cuarto' }] },
		],
	};
	const content = panel.contentOf(grouped);
	expect(content.branches).toHaveLength(0);
	expect(content.sections).toHaveLength(2);
	expect(content.sections[0].Name).toBe('Buenos Aires');
	expect(content.sections[0].GroupId).toBe(91);
	expect(content.sections[0].Items[0].Name).toBe('Tandil');
});

it('el formato anterior (diccionario agrupador→hojas) produce una sección por clave', () => {
	const panel = mountSelector();
	const content = panel.contentOf(panel.categories[2]); // Educación
	expect(content.branches).toHaveLength(0);
	expect(content.sections).toHaveLength(2);
	expect(content.sections[0].Name).toBe('INDEC');
	expect(content.sections[1].Items[0].Name).toBe('Matrícula');
});

describe('indicatorSelector: delimitaciones y etiquetas de conteo');

it('isDelimitation distingue contenedores de hojas de los agrupadores de tipo', () => {
	const panel = mountSelector();
	const limites = panel.categories[1];
	expect(panel.isDelimitation(limites)).toBeFalsy();          // agrupa ramas
	expect(panel.isDelimitation(limites.Items[0])).toBeTruthy(); // Provincias: hojas
});

it('branchLabel cuenta hijos directos y usa el nombre del nodo si nounFromNodeName', () => {
	const panel = mountSelector();
	expect(panel.branchLabel(panel.categories[0])).toBe('2 indicadores');
	const provincias = panel.categories[1].Items[0];
	expect(panel.branchLabel(provincias)).toBe('2 indicadores');
	panel.nounFromNodeName = true;
	expect(panel.branchLabel(provincias)).toBe('2 provincias');
});

describe('indicatorSelector: búsqueda');

it('normalize ignora mayúsculas y tildes', () => {
	const panel = mountSelector();
	expect(panel.normalize('Proyección')).toBe('proyeccion');
});

it('filteredItems matchea por nombre parcial insensible a tildes', () => {
	const panel = mountSelector();
	panel.searchQuery = 'proyeccion';
	expect(panel.filteredItems).toHaveLength(1);
	expect(panel.filteredItems[0].item.Name).toBe('Proyección 2030');
});

it('el match por código es exacto, no parcial', () => {
	const panel = mountSelector();
	panel.searchQuery = 'P01';
	const byCode = panel.filteredItems.filter(e => e.item.Code === 'P01');
	expect(byCode).toHaveLength(1);
	panel.searchQuery = 'P0';
	// "P0" no es código completo de nadie ni parte de un nombre.
	expect(panel.filteredItems).toHaveLength(0);
});

it('deduplica por Id un ítem presente en varias categorías', () => {
	const panel = mountSelector();
	// El mismo indicador aparece también en otra categoría (p. ej. "más usados").
	panel.categories.push({ Id: 4, Name: 'Más usados', Items: [{ Id: 111, Name: 'Población total', Code: 'P01' }] });
	// matchesWordStart compara contra el inicio de cada palabra por separado:
	// una frase con espacio no matchea ninguna palabra individual. 'total' es
	// específico de este ítem (a diferencia de 'poblacion', que también
	// matchea 'Población migrante' del catálogo base).
	panel.searchQuery = 'total';
	expect(panel.filteredItems).toHaveLength(1);
});

it('la búsqueda dentro de una rama se acota a su subárbol', () => {
	const panel = mountSelector();
	panel.navStack = [panel.categories[1]]; // Límites políticos
	panel.searchQuery = 'población';
	expect(panel.filteredItems).toHaveLength(0);
	panel.searchFromRoot();
	expect(panel.filteredItems.length > 0).toBeTruthy();
});

it('filteredBranches ofrece los contenedores coincidentes, los más amplios primero', () => {
	const panel = mountSelector();
	panel.searchQuery = 'provincia';
	const branches = panel.filteredBranches;
	expect(branches).toHaveLength(1);
	expect(branches[0].branch.Name).toBe('Provincias');
});

describe('indicatorSelector: filas a renderizar (renderRows)');

it('en búsqueda, las ramas coincidentes van antes que las hojas', () => {
	const panel = mountSelector();
	panel.searchQuery = 'p'; // matchea ramas (Proyecciones, Provincias) y hojas
	const rows = panel.renderRows;
	const firstItemIndex = rows.findIndex(r => r.type === 'item');
	const lastBranchIndex = rows.map(r => r.type).lastIndexOf('branch');
	expect(lastBranchIndex < firstItemIndex).toBeTruthy();
});

it('limita el render de búsqueda y agrega la fila "Ver más"', () => {
	const panel = mountSelector();
	const many = [];
	for (let n = 0; n < 60; n++) {
		many.push({ Id: 9000 + n, Name: 'Hoja repetida ' + n });
	}
	panel.categories.push({ Id: 5, Name: 'Masivos', Items: many });
	// matchesWordStart compara contra el inicio de cada palabra por separado.
	panel.searchQuery = 'hoja';
	let rows = panel.renderRows;
	expect(rows).toHaveLength(51); // 50 + la fila "more"
	expect(rows[50].type).toBe('more');
	expect(rows[50].remaining).toBe(10);
	panel.liftSearchLimit();
	rows = panel.renderRows;
	expect(rows).toHaveLength(60);
});

it('en navegación, las secciones con nombre entran como cortes de control colapsables', () => {
	const panel = mountSelector();
	panel.navStack = [panel.categories[2]]; // Educación (diccionario)
	let rows = panel.renderRows;
	// expandLeaves=false: los cortes arrancan colapsados, solo headers.
	expect(rows.filter(r => r.type === 'header')).toHaveLength(2);
	expect(rows.filter(r => r.type === 'item')).toHaveLength(0);
	panel.toggleCollapse(rows[0].sectionKey);
	rows = panel.renderRows;
	expect(rows.filter(r => r.type === 'item')).toHaveLength(1);
});

it('con expandLeaves los cortes de un nivel hoja arrancan expandidos', () => {
	const panel = mountSelector({ props: { expandLeaves: true } });
	panel.navStack = [panel.categories[2]];
	expect(panel.renderRows.filter(r => r.type === 'item')).toHaveLength(2);
});

describe('indicatorSelector: selección y emisiones');

it('onItemClick en selección simple emite select, limpia la búsqueda y cierra', () => {
	const panel = mountSelector();
	// matchesWordStart compara contra el inicio de cada palabra por separado.
	panel.searchQuery = 'total';
	const item = panel.filteredItems[0].item;
	panel.onItemClick(item, null);
	expect(panel.$emitted[0].event).toBe('select');
	expect(panel.$emitted[0].args[0]).toEqual([item]);
	expect(panel.searchQuery).toBe('');
	expect(panel.$emitted[1].event).toBe('close');
});

it('en multiselección alterna select/deselect según el estado', () => {
	const item = { Id: 111, Name: 'Población total' };
	const panel = mountSelector({ props: { multiSelect: true, selection: [item] } });
	panel.onItemClick(item, null);
	expect(panel.$emitted[0].event).toBe('deselect');
	panel.onItemClick({ Id: 112, Name: 'Otra' }, null);
	expect(panel.$emitted[1].event).toBe('select');
});

it('leavesSelectionState informa none/some/all sobre un corte de control', () => {
	const leaves = [{ Id: 1 }, { Id: 2 }];
	const panel = mountSelector({ props: { selection: [{ Id: 1 }] } });
	expect(panel.leavesSelectionState(leaves)).toBe('some');
	expect(panel.leavesSelectionState([{ Id: 1 }])).toBe('all');
	expect(panel.leavesSelectionState([{ Id: 9 }])).toBe('none');
});

it('toggleLeavesSelection selecciona solo las hojas faltantes', () => {
	const leaves = [{ Id: 1 }, { Id: 2 }];
	const panel = mountSelector({ props: { selection: [{ Id: 1 }], emitContainer: true } });
	const container = { Id: 99 };
	panel.toggleLeavesSelection(leaves, container);
	expect(panel.$emitted[0].event).toBe('select');
	expect(panel.$emitted[0].args[0]).toEqual([{ Id: 2 }]);
	expect(panel.$emitted[0].args[1]).toBe(container);
});

it('enterBranch sobre una delimitación con exploración inactiva emite select-group sin navegar', () => {
	const panel = mountSelector({ props: { selectableBranches: true } });
	const provincias = panel.categories[1].Items[0];
	panel.drillIntoElements = false;
	panel.enterBranch(provincias);
	expect(panel.$emitted[0].event).toBe('select-group');
	expect(panel.$emitted[0].args[0]).toBe(provincias);
	expect(panel.navStack).toHaveLength(0);
});

it('enterBranch con exploración activa navega y limpia la búsqueda', () => {
	const panel = mountSelector({ props: { selectableBranches: true } });
	panel.drillIntoElements = true;
	panel.searchQuery = 'algo';
	panel.enterBranch(panel.categories[1].Items[0]);
	expect(panel.navStack).toHaveLength(1);
	expect(panel.searchQuery).toBe('');
});

it('en modo filtro la exploración es obligatoria y el toggle no se ofrece', () => {
	const panel = mountSelector({ props: { selectableBranches: true, filterMode: true } });
	expect(panel.drillIntoElements).toBeTruthy();
	expect(panel.showDrillToggle).toBeFalsy();
});

it('el placeholder de búsqueda se contextualiza al nodo actual', () => {
	const panel = mountSelector();
	expect(panel.dynamicPlaceholder).toBe('Buscar indicador o delimitación...');
	panel.navStack = [panel.categories[0]];
	expect(panel.dynamicPlaceholder).toBe('Buscar en población...');
});
