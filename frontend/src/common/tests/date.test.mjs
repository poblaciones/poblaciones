import { describe, it, expect } from './_harness.mjs';
import date from '@/common/framework/date';

describe('date: serialización');

it('SerializeDate produce ISO 8601 en UTC y DeserializeDate lo revierte', () => {
	const original = new Date(Date.UTC(2024, 0, 15, 10, 30));
	const text = date.SerializeDate(original);
	expect(text).toBe('2024-01-15T10:30:00.000Z');
	expect(date.DeserializeDate(text).getTime()).toBe(original.getTime());
});

it('FormateDateTime usa la hora local y no rellena con ceros hora, minutos ni segundos', () => {
	expect(date.FormateDateTime(new Date(2024, 0, 5, 9, 5, 3))).toBe('2024-01-05 9:5:3');
	expect(date.FormateDateTime(new Date(2024, 10, 25, 18, 45, 30))).toBe('2024-11-25 18:45:30');
});

describe('date: diferencias y desplazamientos');

it('DateDiffMinutes calcula contra la fecha máxima indicada', () => {
	const start = new Date(2024, 0, 1, 10, 0);
	const end = new Date(2024, 0, 1, 10, 30);
	expect(date.DateDiffMinutes(start, end)).toBe(30);
});

it('DateDiffMinutes sin fecha máxima compara contra ahora', () => {
	const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
	expect(date.DateDiffMinutes(oneMinuteAgo)).toBeCloseTo(1, 1);
});

it('DateDiffDays calcula contra la fecha máxima indicada, con fracciones', () => {
	const start = new Date(Date.UTC(2024, 0, 1));
	expect(date.DateDiffDays(start, new Date(Date.UTC(2024, 0, 3)))).toBe(2);
	expect(date.DateDiffDays(start, new Date(Date.UTC(2024, 0, 2, 12)))).toBe(1.5);
});

it('DateDiffDays sin fecha máxima compara contra la medianoche de hoy', () => {
	const todayMidnight = new Date();
	todayMidnight.setHours(0, 0, 0, 0);
	expect(date.DateDiffDays(todayMidnight)).toBe(0);
});

it('AddHours devuelve una copia desplazada y no modifica la original', () => {
	const original = new Date(Date.UTC(2024, 5, 15, 12));
	const moved = date.AddHours(original, 5);
	expect(moved.getTime() - original.getTime()).toBe(5 * 3600 * 1000);
	expect(original.getTime()).toBe(Date.UTC(2024, 5, 15, 12));
});

it('CalculateUTOffset redondea a horas enteras respecto de ahora', () => {
	expect(date.CalculateUTOffset(new Date(Date.now() + 3 * 3600 * 1000))).toBe(3);
	expect(date.CalculateUTOffset(new Date(Date.now() - 2 * 3600 * 1000))).toBe(-2);
});

it('GetCurrentYear devuelve el año actual', () => {
	expect(date.GetCurrentYear()).toBe(new Date().getFullYear());
});

describe('date: etiquetas de período');

it('GetMonthLabel nombra los meses base 0 y devuelve vacío fuera de rango', () => {
	expect(date.GetMonthLabel(0)).toBe('Enero');
	expect(date.GetMonthLabel(11)).toBe('Diciembre');
	expect(date.GetMonthLabel(12)).toBe('');
	expect(date.GetMonthLabel(-1)).toBe('');
});

it('GetMonthLabel nombra los doce meses en orden', () => {
	const expected = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
	const labels = [];
	for (let month = 0; month < 12; month++) {
		labels.push(date.GetMonthLabel(month));
	}
	expect(labels).toEqual(expected);
});

it('GetQuarterLabel nombra los trimestres base 0 y devuelve undefined fuera de rango', () => {
	expect(date.GetQuarterLabel(0)).toBe('Primer trimestre');
	expect(date.GetQuarterLabel(1)).toBe('Segundo trimestre');
	expect(date.GetQuarterLabel(2)).toBe('Tercer trimestre');
	expect(date.GetQuarterLabel(3)).toBe('Cuarto trimestre');
	expect(date.GetQuarterLabel(4)).toBe(undefined);
});

it('FormatLabelMonth convierte "AAAA-MM" y puede omitir el año', () => {
	expect(date.FormatLabelMonth('2024-03')).toBe('2024 - Marzo');
	expect(date.FormatLabelMonth('2024-03', false)).toBe('Marzo');
});

it('FormatLabelMonth devuelve igual un texto que no tiene el formato "AAAA-MM"', () => {
	expect(date.FormatLabelMonth('2024')).toBe('2024');
	expect(date.FormatLabelMonth('Anual')).toBe('Anual');
});

it('FormatLabelQuarter convierte "AAAA-Tn" y puede omitir el año', () => {
	expect(date.FormatLabelQuarter('2024-T2')).toBe('2024 - Segundo trimestre');
	expect(date.FormatLabelQuarter('2024-T4', false)).toBe('Cuarto trimestre');
});

it('FormatLabelQuarter devuelve igual un texto que no tiene el formato "AAAA-Tn"', () => {
	expect(date.FormatLabelQuarter('2024-03')).toBe('2024-03');
});
