import { describe, it, expect } from './_harness.mjs';
import { setupWindow, mountLite } from './fixtures.mjs';
import SideToolbar from '@/map/components/widgets/sideToolbar/sideToolbar.vue';
import IndicatorSelector from '@/map/components/widgets/sideToolbar/indicatorSelector.vue';
import { toChip } from '@/map/components/widgets/sideToolbar/selectorTooltips';

// Bug: en el filtro de regiones (boundaries/clipping), los chips se veían
// bien pero el checkbox del árbol no marcaba los elementos ya seleccionados
// en selección múltiple. Causa: indicatorSelector.vue matchea
// selection[].Id contra item.Id del árbol (selectedIds = Set(selection.map(
// s => s.Id))), pero boundarySelection armaba el chip con Id prefijado
// ('B:'+id, 'C:'+id) en vez del Id real. La deselección desde el chip no se
// veía afectada porque indicatorSelector.vue ya emite chip.Item (con su
// propio Id real) al quitar un chip, no el chip completo.

describe('toChip: separa el Id real (matchea el árbol) de la clave de renderizado');

it('sin key, el chip queda igual que antes (retrocompatible)', () => {
	const chip = toChip({ Id: 501, Name: 'Población' });
	expect(chip.Id).toBe(501);
	expect(chip.Key).toBeFalsy();
	expect(chip.Caption).toBe('Población');
	expect(chip.Item).toEqual({ Id: 501, Name: 'Población' });
});

it('con key, Id sigue siendo el real; Key lleva el prefijo', () => {
	const chip = toChip({ Id: 501, Name: 'Barrios de Tandil', Type: 'B' }, 'B:501');
	expect(chip.Id).toBe(501);
	expect(chip.Key).toBe('B:501');
	expect(chip.Item.Type).toBe('B');
});

describe('sideToolbar: boundarySelection arma chips con Id real (no prefijado)');

function mountSideToolbar(metrics, clipping) {
	setupWindow();
	return mountLite(SideToolbar, { props: { metrics: metrics || [], clipping: clipping || {} } });
}

it('una capa de delimitación activa: chip.Id es el Id real del boundary, Key lleva el prefijo B:', () => {
	const boundaryLayer = { isBaseMetric: false, isBoundary: true, properties: { Id: 501, Name: 'Barrios de Tandil' } };
	const panel = mountSideToolbar([boundaryLayer]);
	const chips = panel.boundarySelection;
	expect(chips).toHaveLength(1);
	expect(chips[0].Id).toBe(501);
	expect(chips[0].Key).toBe('B:501');
	expect(chips[0].Item.Type).toBe('B');
});

it('una región de recorte activa: chip.Id es el Id real de la región, Key lleva el prefijo C:', () => {
	const clipping = { Region: { Summary: { Regions: [{ Id: 202, Name: 'Las Flores' }] } } };
	const panel = mountSideToolbar([], clipping);
	const chips = panel.boundarySelection;
	expect(chips).toHaveLength(1);
	expect(chips[0].Id).toBe(202);
	expect(chips[0].Key).toBe('C:202');
	expect(chips[0].Item.Type).toBe('C');
});

describe('Integración: indicatorSelector.isSelected marca el checkbox con un chip real de boundarySelection');

it('un nodo del árbol con el mismo Id que la capa activa aparece marcado', () => {
	const boundaryLayer = { isBaseMetric: false, isBoundary: true, properties: { Id: 501, Name: 'Barrios de Tandil' } };
	const panel = mountSideToolbar([boundaryLayer]);
	const selector = mountLite(IndicatorSelector, { props: { categories: [], selection: panel.boundarySelection, multiSelect: true } });
	expect(selector.isSelected({ Id: 501, Name: 'Barrios de Tandil' })).toBeTruthy();
	expect(selector.isSelected({ Id: 999, Name: 'Otro' })).toBeFalsy();
});
