/*
 * ColumnDragController.test.mjs — reordenamiento de columnas por arrastre.
 *
 *     node --import ./tests/_register-alias.mjs tests/ColumnDragController.test.mjs
 *
 * El estado es un objeto plano; los eventos del DOM se simulan con stubs.
 */

import { describe, it, expect, report } from './_harness.mjs';
import ColumnDragController, { initialDragState } from '@/table/components/pivot/ColumnDragController.js';

function dragEvent() {
	return {
		prevented: false,
		preventDefault: function () { this.prevented = true; },
		dataTransfer: { setData: function () {} }
	};
}

function make() {
	var moves = [];
	var state = initialDragState();
	var ctrl = new ColumnDragController(state, function (from, to) { moves.push([from, to]); });
	return { ctrl: ctrl, state: state, moves: moves };
}

describe('ColumnDragController — ciclo de arrastre', function () {
	it('arm habilita el índice; start fija el que se arrastra', function () {
		var m = make();
		m.ctrl.arm(2);
		expect(m.state.armed).toBe(2);
		m.ctrl.start(2, dragEvent());
		expect(m.state.index).toBe(2);
	});
	it('over marca el índice de destino solo si hay arrastre en curso', function () {
		var m = make();
		m.ctrl.over(3, dragEvent());
		expect(m.state.overIndex).toBeNull(); // sin start previo, no hay arrastre
		m.ctrl.start(1, dragEvent());
		m.ctrl.over(3, dragEvent());
		expect(m.state.overIndex).toBe(3);
	});
	it('leave limpia el destino solo si coincide', function () {
		var m = make();
		m.ctrl.start(1, dragEvent());
		m.ctrl.over(3, dragEvent());
		m.ctrl.leave(9);
		expect(m.state.overIndex).toBe(3); // no coincide, no limpia
		m.ctrl.leave(3);
		expect(m.state.overIndex).toBeNull();
	});
});

describe('ColumnDragController — drop', function () {
	it('drop válido avisa el movimiento y resetea', function () {
		var m = make();
		m.ctrl.start(1, dragEvent());
		var ev = dragEvent();
		m.ctrl.drop(4, ev);
		expect(ev.prevented).toBeTruthy();
		expect(m.moves).toHaveLength(1);
		expect(m.moves[0][0]).toBe(1);
		expect(m.moves[0][1]).toBe(4);
		expect(m.state.index).toBeNull(); // reseteado
	});
	it('drop sobre la misma columna no mueve', function () {
		var m = make();
		m.ctrl.start(2, dragEvent());
		m.ctrl.drop(2, dragEvent());
		expect(m.moves).toHaveLength(0);
	});
	it('drop sin arrastre previo no mueve', function () {
		var m = make();
		m.ctrl.drop(2, dragEvent());
		expect(m.moves).toHaveLength(0);
	});
	it('end resetea el estado', function () {
		var m = make();
		m.ctrl.arm(1);
		m.ctrl.start(1, dragEvent());
		m.ctrl.over(3, dragEvent());
		m.ctrl.end();
		expect(m.state.armed).toBeNull();
		expect(m.state.index).toBeNull();
		expect(m.state.overIndex).toBeNull();
	});
});

if (import.meta.url === 'file://' + process.argv[1]) {
	process.exit(await report() ? 0 : 1);
}
