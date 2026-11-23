import fs from 'node:fs';
import { describe, it, expect } from './_harness.mjs';
import { setupWindow, mountLite } from './fixtures.mjs';
import PanelType from '@/map/enums/PanelType';
import LeftPanel from '@/map/components/panels/leftPanel.vue';

function mountLeft() {
	setupWindow();
	window.SegMap.toolbarStates = { leftPanelVisible: false };
	const panel = mountLite(LeftPanel, { props: {} });
	panel.arrangePanels = function () {};
	return panel;
}

function listPanel(id, title) {
	return { Key: { Id: id }, panelType: PanelType.ListPanel, Title: title, Items: [] };
}

function infoPanel(id) {
	return { Key: { Id: id }, panelType: PanelType.InfoPanel };
}

function entries() {
	return window.SegMap.History.customEntries;
}

describe('leftPanel: cerrar y ocultar se pueden deshacer');

it('cerrar el panel de una lista registra una acción que lo vuelve a abrir', () => {
	const panel = mountLeft();
	const list = listPanel(7, 'Escuelas');
	panel.hasContent = true;
	panel.collapsed = false;
	panel.Full = list;
	panel.doClose(null, 7);
	expect(panel.Full).toBeNull();
	expect(panel.hasContent).toBe(false);
	expect(entries()).toHaveLength(1);
	expect(entries()[0].label).toBe('Cerrar el panel de «Escuelas»');
	entries()[0].undo();
	expect(panel.Full).toBe(list);
	expect(panel.hasContent).toBe(true);
	expect(panel.collapsed).toBe(false);
	entries()[0].redo();
	expect(panel.Full).toBeNull();
});

it('al restaurar una lista se recupera también la disposición de los otros paneles', () => {
	const panel = mountLeft();
	const top = infoPanel(1);
	const bottom = listPanel(2, 'Escuelas');
	panel.hasContent = true;
	panel.collapsed = false;
	panel.isFullFront = false;
	panel.Top = top;
	panel.Bottom = bottom;
	panel.doClose(null, 2);
	expect(panel.Bottom).toBeNull();
	expect(panel.Top).toBe(top);
	entries()[0].undo();
	expect(panel.Top).toBe(top);
	expect(panel.Bottom).toBe(bottom);
	expect(panel.isFullFront).toBe(false);
});

it('el panel de un elemento no se registra acá: se deshace por la ruta', () => {
	const panel = mountLeft();
	panel.hasContent = true;
	panel.collapsed = false;
	panel.Full = infoPanel(5);
	panel.doClose(null, 5);
	expect(panel.Full).toBeNull();
	expect(entries()).toHaveLength(0);
});

it('cerrar un panel que no está abierto no hace nada', () => {
	const panel = mountLeft();
	panel.doClose(null, 99);
	expect(entries()).toHaveLength(0);
});

it('ocultar y mostrar el panel se deshacen con su rótulo', () => {
	const panel = mountLeft();
	panel.hasContent = true;
	panel.collapsed = false;
	panel.doToggle();
	expect(panel.collapsed).toBe(true);
	expect(entries()[0].label).toBe('Cerrar el panel de información');
	entries()[0].undo();
	expect(panel.collapsed).toBe(false);
	expect(window.SegMap.toolbarStates.leftPanelVisible).toBe(true);
	panel.doToggle();
	panel.doToggle();
	expect(entries()[2].label).toBe('Abrir el panel de información');
});

describe('App: el panel de estadísticas de la derecha se cierra con una acción deshacible');

it('doToggle registra la acción y usa setRightPanelCollapsed para deshacerla', () => {
	const source = fs.readFileSync(new URL('../App.vue', import.meta.url), 'utf8');
	const start = source.indexOf('doToggle() {');
	const body = source.substring(start, source.indexOf('setRightPanelCollapsed(collapsed) {', start));
	expect(body.indexOf("'Cerrar el panel de estadísticas'") !== -1).toBeTruthy();
	expect(body.indexOf("'Abrir el panel de estadísticas'") !== -1).toBeTruthy();
	expect(body.indexOf('window.SegMap.History.RecordCustom') !== -1).toBeTruthy();
});
