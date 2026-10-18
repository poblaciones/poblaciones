import { describe, it, expect } from './_harness.mjs';
import { setupWindow, mountLite } from './fixtures.mjs';
import TopPanel from '@/map/components/panels/topPanel';

function mountPanel(props) {
	setupWindow();
	window.Popups = { AddMetric: { show() {} }, WorkMetadata: { show() {} } };
	window.SegMap.SaveRoute.RemoveWork = function () {};
	window.SegMap.SaveRoute.RemoveBoundary = function () {};
	return mountLite(TopPanel, { props: props });
}

describe('topPanel: resuelve la parte visual para work (W) y delimitación (B) según type');

it('addToMapLabel: "Agregar indicador" para W, "Delimitaciones" para B', () => {
	expect(mountPanel({ type: 'W' }).addToMapLabel).toBe('Agregar indicador');
	expect(mountPanel({ type: 'B' }).addToMapLabel).toBe('Delimitaciones');
});

it('institutionsList arma la lista con "–" a partir de metadata.Institutions (forma work)', () => {
	const panel = mountPanel({
		type: 'W',
		metadata: { Name: 'X', Institutions: [{ Name: 'INDEC' }, { Name: 'Municipio' }] },
	});
	expect(panel.institutionsList).toBe('INDEC – Municipio');
});

it('institutionsList usa metadata.Institution (string) cuando no hay Institutions (forma boundary)', () => {
	const panel = mountPanel({ type: 'B', metadata: { Name: 'X', Institution: 'INDEC' } });
	expect(panel.institutionsList).toBe('INDEC');
});

it('institutionsList es null sin metadata, o sin institución de ningún tipo', () => {
	expect(mountPanel({ type: 'W', metadata: null }).institutionsList).toBeNull();
	expect(mountPanel({ type: 'W', metadata: { Name: 'X' } }).institutionsList).toBeNull();
});

it('hasMetrics reconoce tanto LocalVersions (work) como Versions (boundary)', () => {
	const withWorkItems = mountPanel({ type: 'W', addToMapItems: [{ LocalVersions: [{ Name: '2020' }] }] });
	expect(withWorkItems.hasMetrics).toBeTruthy();
	const withBoundaryItems = mountPanel({ type: 'B', addToMapItems: [{ Versions: [{ Name: '2022' }] }] });
	expect(withBoundaryItems.hasMetrics).toBeTruthy();
	const withoutVersions = mountPanel({ type: 'W', addToMapItems: [{ LocalVersions: [{ Name: '' }] }] });
	expect(withoutVersions.hasMetrics).toBeFalsy();
});

it('hasOnboarding: nunca para B; para W, según work.Current.Onboarding.Enabled', () => {
	const boundaryPanel = mountPanel({ type: 'B', work: { Current: { Onboarding: { Enabled: true } } } });
	expect(boundaryPanel.hasOnboarding()).toBeFalsy();
	const workPanelOn = mountPanel({ type: 'W', work: { Current: { Onboarding: { Enabled: true } } } });
	expect(workPanelOn.hasOnboarding()).toBeTruthy();
	const workPanelOff = mountPanel({ type: 'W', work: { Current: { Onboarding: { Enabled: false } } } });
	expect(workPanelOff.hasOnboarding()).toBeFalsy();
	const workPanelNoWork = mountPanel({ type: 'W', work: null });
	expect(workPanelNoWork.hasOnboarding()).toBeFalsy();
});

it('titleRowsCount cuenta título, institución (si hay) y autores', () => {
	const panel = mountPanel({
		type: 'W',
		metadata: { Name: 'X', Authors: 'Fulano', Institutions: [{ Name: 'INDEC' }] },
	});
	expect(panel.titleRowsCount()).toBe(3);
	expect(mountPanel({ type: 'W', metadata: null }).titleRowsCount()).toBe(0);
});

it('showAddToMap: para W pasa el id del work; para B no pasa id (queda en manos de item.Type)', () => {
	const calls = [];
	const panel = mountPanel({ type: 'W', addToMapItems: [{ Id: 1 }], addToMapId: 55 });
	window.Popups.AddMetric.show = function (...args) { calls.push(args); };
	panel.showAddToMap();
	expect(calls[0]).toEqual([[{ Id: 1 }], 55, 'Agregar indicador']);

	const boundaryPanel = mountPanel({ type: 'B', addToMapItems: [{ Id: 2, Type: 'B' }] });
	window.Popups.AddMetric.show = function (...args) { calls.push(args); };
	boundaryPanel.showAddToMap();
	expect(calls[1]).toEqual([[{ Id: 2, Type: 'B' }], undefined, 'Delimitaciones']);
});

it('clickFuente muestra los metadatos del work activo', () => {
	const calls = [];
	const work = { Current: { Id: 1, Metadata: { Name: 'X' } } };
	const panel = mountPanel({ type: 'W', work: work });
	window.Popups.WorkMetadata.show = function (w) { calls.push(w); };
	panel.clickFuente({ preventDefault() {} });
	expect(calls[0]).toBe(work.Current);
});

it('removeFromRoute llama a RemoveWork para W y a RemoveBoundary para B', () => {
	const workCalls = [];
	const boundaryCalls = [];
	const workPanel = mountPanel({ type: 'W' });
	window.SegMap.SaveRoute.RemoveWork = function () { workCalls.push(true); };
	workPanel.removeFromRoute();
	expect(workCalls).toHaveLength(1);

	const boundaryPanel = mountPanel({ type: 'B' });
	window.SegMap.SaveRoute.RemoveBoundary = function () { boundaryCalls.push(true); };
	boundaryPanel.removeFromRoute();
	expect(boundaryCalls).toHaveLength(1);
});
