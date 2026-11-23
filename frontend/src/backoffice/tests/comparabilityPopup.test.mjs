import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite } from './fixtures.mjs';
import ComparabilityPopup from '@/backoffice/views/Metric/ComparabilityPopup.vue';

function setup() {
	setupBackoffice('P');
	return mountLite(ComparabilityPopup);
}

describe('ComparabilityPopup: apertura');

it('show guarda las filas y abre el diálogo, y hide lo cierra', () => {
	const vm = setup();
	const rows = [{ Comparable: true, Versions: '2010, 2022', Level: 'Provincias', Variable: 'Población', Message: 'Comparable.' }];
	vm.show(rows);
	expect(vm.showDialog).toBe(true);
	expect(vm.rows).toEqual(rows);
	vm.hide();
	expect(vm.showDialog).toBe(false);
});

describe('ComparabilityPopup: estado de cada fila');

it('una variable comparable se marca en verde', () => {
	const vm = setup();
	const status = vm.statusOf({ Comparable: true });
	expect(status.icon).toBe('check_circle_outline');
	expect(status.color).toBe('#44b10f');
});

it('una variable no comparable se marca en naranja', () => {
	const vm = setup();
	const status = vm.statusOf({ Comparable: false });
	expect(status.icon).toBe('error_outline');
	expect(status.color).toBe('#ff7936');
});
