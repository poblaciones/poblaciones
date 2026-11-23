import fs from 'node:fs';
import { describe, it, expect } from './_harness.mjs';
import { setupWindow, mountLite } from './fixtures.mjs';
import Toolbar from '@/map/components/widgets/summary/toolbar.vue';

function mount(history) {
	setupWindow();
	const toolbarStates = { history: history };
	return mountLite(Toolbar, { props: { toolbarStates: toolbarStates, config: {}, user: {}, work: {}, metrics: [] } });
}

const IDLE = { CanUndo: false, CanRedo: false, UndoLabel: 'Deshacer', RedoLabel: 'Rehacer' };

describe('toolbar: deshacer y rehacer');

it('los botones delegan en el historial del visor', () => {
	const panel = mount(IDLE);
	const calls = [];
	window.SegMap.History = { Undo() { calls.push('undo'); }, Redo() { calls.push('redo'); } };
	panel.undo();
	panel.redo();
	expect(calls).toEqual(['undo', 'redo']);
});

it('el estado sale de toolbarStates.history', () => {
	const history = { CanUndo: true, CanRedo: false, UndoLabel: 'Deshacer: Agregar «A»', RedoLabel: 'Rehacer' };
	const panel = mount(history);
	expect(panel.history).toBe(history);
});

it('los tooltips agregan el atajo de teclado a lo que se deshace o rehace', () => {
	const panel = mount({ CanUndo: true, CanRedo: true, UndoLabel: 'Deshacer: Quitar «A»', RedoLabel: 'Rehacer: Quitar «A»' });
	expect(panel.undoTitle).toBe('Deshacer: Quitar «A» (Ctrl+Z)');
	expect(panel.redoTitle).toBe('Rehacer: Quitar «A» (Ctrl+Y)');
});

it('los botones van antes que el resto de la barra y se deshabilitan según el estado', () => {
	const source = fs.readFileSync(new URL('../components/widgets/summary/toolbar.vue', import.meta.url), 'utf8');
	const undoAt = source.indexOf('fa-undo-alt');
	const redoAt = source.indexOf('fa-redo-alt');
	expect(undoAt < redoAt).toBeTruthy();
	expect(redoAt < source.indexOf('<mp-dropdown-menu')).toBeTruthy();
	expect(source.indexOf(':disabled="!history.CanUndo"') !== -1).toBeTruthy();
	expect(source.indexOf(':disabled="!history.CanRedo"') !== -1).toBeTruthy();
});
