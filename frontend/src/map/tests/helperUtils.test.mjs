import { describe, it, expect } from './_harness.mjs';
import h from '@/map/js/helper';

// Utilidades puras de helper.js complementarias a las de helperQueue.test.mjs
// (cálculo de comparaciones, deltas, encabezados, formatos, parámetros, urls y
// lookups). Solo comportamiento determinista: nada de DOM, timers ni random.

describe('helper: comparación entre períodos');

it('calculateCompareValue devuelve la diferencia absoluta o la variación porcentual', () => {
        expect(h.calculateCompareValue(false, { value: 150 }, { value: 100 })).toBe(50);
        expect(h.calculateCompareValue(false, { value: 100 }, { value: 150 })).toBe(-50);
        expect(h.calculateCompareValue(true, { value: 150 }, { value: 100 })).toBe(50);
});

it('calculateCompareValue proporcional con divisor cero devuelve cadena vacía', () => {
        expect(h.calculateCompareValue(true, { value: 150 }, { value: 0 })).toBe('');
});

describe('helper: formato de deltas de comparación');

it('formatDeltaValue agrega flechas solo con |delta| >= 1 y según el signo', () => {
        // El número se redondea a 1 decimal y se re-convierte a número: '50.0' vuelve
        // a ser 50, por eso no queda ',0' en enteros.
        expect(h.formatDeltaValue(50, true)).toBe('↗ 50');
        expect(h.formatDeltaValue(-50, true)).toBe('↘ 50');
        expect(h.formatDeltaValue(0.5, true)).toBe('0,5');
        expect(h.formatDeltaValue(-0.5, true)).toBe('-0,5');
});

it('formatDeltaValue sin flechas muestra solo el número formateado', () => {
        expect(h.formatDeltaValue(-50, false)).toBe('-50');
});

it('formatDeltaValue pasa through los valores vacíos', () => {
        expect(h.formatDeltaValue('', true)).toBe('-');
        expect(h.formatDeltaValue(NaN, true)).toBe('-');
});

describe('helper: encabezados de columna');

it('getColumnHeader rotula por escala con y sin comparación', () => {
        expect(h.getColumnHeader({ HasTotals: true, NormalizationScale: 100 }, false)).toBe('%');
        expect(h.getColumnHeader({ HasTotals: true, NormalizationScale: 1 }, false)).toBe('/1');
        expect(h.getColumnHeader({ HasTotals: true, NormalizationScale: 1000 }, false)).toBe('/k');
        expect(h.getColumnHeader({ HasTotals: true, NormalizationScale: 10000 }, false)).toBe('/10k');
        expect(h.getColumnHeader({ HasTotals: true, NormalizationScale: 100000 }, false)).toBe('/100k');
        expect(h.getColumnHeader({ HasTotals: true, NormalizationScale: 1000000 }, false)).toBe('/1M');
        expect(h.getColumnHeader({ HasTotals: true, NormalizationScale: 7 }, false)).toBe('N');
});

it('getColumnHeader con comparación activa muestra Δ % para todo lo no-gap', () => {
        expect(h.getColumnHeader({ HasTotals: false }, true)).toBe('Δ %');
        expect(h.getColumnHeader({ HasTotals: true, NormalizationScale: 1000 }, true)).toBe('Δ %');
        expect(h.getColumnHeader({ IsGap: true }, false)).toBe('Δ %');
        expect(h.getColumnHeader({ HasTotals: false }, false)).toBe('N');
});

describe('helper: formatos sueltos');

it('formatPercent devuelve guión para entrada vacía o total cero, y un decimal fijo', () => {
        expect(h.formatPercent('', 100)).toBe('-');
        expect(h.formatPercent(50, 0)).toBe('-');
        // El número se formatea con toFixed (punto decimal), el toLocaleString del
        // string es identidad: no reemplaza el punto por coma.
        expect(h.formatPercent(1, 4)).toBe('25.0');
});

it('formatPercentNumber formatea con un decimal (punto, no coma)', () => {
        expect(h.formatPercentNumber(25)).toBe('25.0');
        expect(h.formatPercentNumber('')).toBe('-');
});

it('capitalize solo toca cadenas con contenido', () => {
        expect(h.capitalize('hola')).toBe('Hola');
        expect(h.capitalize('')).toBe('');
        expect(h.capitalize(null)).toBe(null);
});

it('formatKm elige decimales según la magnitud', () => {
        expect(h.formatKm('')).toBe('-');
        // El locale 'es' no agrupa números de 4 dígitos (agrupación mínima de 2).
        expect(h.formatKm(1500)).toBe('1500');
        expect(h.formatKm(15000)).toBe('15.000');
        expect(h.formatKm(12.345)).toBe('12');
        expect(h.formatKm(3.456)).toBe('3,5');
        expect(h.formatKm(0.123)).toBe('0,12');
        expect(h.formatKm(0.012)).toBe('0,012');
        expect(h.formatKm(0)).toBe('0');
});

it('formatNumOverall abrevia miles y millones', () => {
        expect(h.formatNumOverall('')).toBe('-');
        expect(h.formatNumOverall('n/d')).toBe('n/d');
        expect(h.formatNumOverall(1500)).toBe('1500');
        expect(h.formatNumOverall(25000)).toBe('25 mil');
        expect(h.formatNumOverall(1020000)).toBe('1 millón');
        expect(h.formatNumOverall(1500000)).toBe('1,5 millones');
});

it('ensureFinalDot y ensureFinalBar agregan el carácter solo si falta', () => {
        expect(h.ensureFinalDot('texto')).toBe('texto.');
        expect(h.ensureFinalDot('texto.')).toBe('texto.');
        expect(h.ensureFinalDot('   ')).toBe('');
        expect(h.ensureFinalBar('path')).toBe('path/');
        expect(h.ensureFinalBar('path/')).toBe('path/');
        expect(h.ensureFinalBar('')).toBe('/');
});

it('extractFileExtension / extractFilename separan nombre y extensión', () => {
        expect(h.extractFileExtension('archivo.CSV')).toBe('csv');
        expect(h.extractFileExtension('sinext')).toBe('');
        expect(h.extractFileExtension('a.b.c')).toBe('c');
        expect(h.extractFilename('a.b.c')).toBe('a.b');
        expect(h.extractFilename('sinext')).toBe('sinext');
});

it('quickFormat aplica toFixed y un formato final, tolerando ceros si se pide', () => {
        const identity = function (value) { return value; };
        expect(h.quickFormat(identity, 2, 3.14159)).toBe('3.14');
        expect(h.quickFormat(identity, 1, 0.001, true)).toBe('0.001');
        expect(h.quickFormat(identity, 1, 0.001)).toBe('0.0');
        expect(h.quickFormat(identity, 2, '')).toBe('');
        expect(h.quickFormat(identity, 2, 'n/d')).toBe('n/d');
});

describe('helper: parseo de rutas y parámetros');

it('parseSingleLetterArgs separa por ! tomando la inicial como clave (el = queda en el valor)', () => {
        expect(h.parseSingleLetterArgs('l=123!v0!a1!x')).toEqual({ l: '=123', v: '0', a: '1' });
});

it('getSafeValue devuelve el valor presente o el default; sin default lanza error', () => {
        expect(h.getSafeValue({ f: '12' }, 'f', null)).toBe('12');
        expect(h.getSafeValue({}, 'f', null)).toBe(null);
        let thrown = null;
        try {
                h.getSafeValue({}, 'f');
        } catch (e) {
                thrown = e;
        }
        if (thrown === null) {
                throw new Error('getSafeValue sin default debería lanzar');
        }
        expect(thrown.message).toBe('Parámetro no válido.');
});

it('getSafeValueInt parsea a entero y respeta el default', () => {
        expect(h.getSafeValueInt({ l: '34' }, 'l', null)).toBe(34);
        expect(h.getSafeValueInt({}, 'l', null)).toBe(null);
});

it('getSafeValueBool interpreta "0" como falso y todo lo demás como su veracidad', () => {
        expect(h.getSafeValueBool({ c: '1' }, 'c', false)).toBe(true);
        expect(h.getSafeValueBool({ c: '0' }, 'c', false)).toBe(false);
        // El 0 numérico se devuelve tal cual (0 && ... es 0): los consumidores lo
        // tratan como falso por veracidad.
        expect(h.getSafeValueBool({ c: 0 }, 'c', true)).toBe(0);
        expect(h.getSafeValueBool({}, 'c', false)).toBe(false);
        expect(h.getSafeValueBool({}, 'c', true)).toBe(true);
});

it('mergeObject combina superficialmente con prevalencia del segundo', () => {
        expect(h.mergeObject({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
        expect(h.mergeObject({ a: 1, b: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
});

describe('helper: urls y escalas');

it('resolveMultiUrl concatena el path a un server o a una lista de servers', () => {
        expect(h.resolveMultiUrl('http://a', '/p')).toBe('http://a/p');
        expect(h.resolveMultiUrl(['http://a', 'http://b'], '/p')).toEqual(['http://a/p', 'http://b/p']);
});

it('selectMultiUrl elige por seed; con un único server lo devuelve directo', () => {
        expect(h.selectMultiUrl('http://a', 5)).toBe('http://a');
        expect(h.selectMultiUrl(['http://a'], 5)).toBe('http://a');
        // Con seed falsy (0) cae en la rama aleatoria: no es determinista, no se testa.
        expect(h.selectMultiUrl(['a', 'b', 'c'], 1)).toBe('b');
        expect(h.selectMultiUrl(['a', 'b', 'c'], 2)).toBe('c');
        expect(h.selectMultiUrl(['a', 'b', 'c'], 3)).toBe('a');
        expect(h.selectMultiUrl(['a', 'b', 'c'], [2])).toBe('c');
});

it('getScaleFactor es 2^(zoom/3)', () => {
        expect(h.getScaleFactor(0)).toBe(1);
        expect(h.getScaleFactor(3)).toBe(2);
        expect(h.getScaleFactor(6)).toBe(4);
        expect(h.getScaleFactor(4)).toBeCloseTo(2.5198, 3);
});

describe('helper: envelope y círculo de clipping');

it('getEnvelopeParam serializa Min;Max y getCircleParam centro;radio', () => {
        const envelope = { Min: { Lat: 1, Lon: 2 }, Max: { Lat: 3, Lon: 4 } };
        expect(h.getEnvelopeParam(envelope)).toBe('1,2;3,4');
        const circle = { Center: { Lat: -34.6, Lon: -58.4 }, Radius: { Lat: 0.5, Lon: 0.5 } };
        expect(h.getCircleParam(circle)).toBe('-34.6,-58.4;0.5,0.5');
});

it('hasCircle descarta nulls y círculos con centro o radio en cero', () => {
        const circle = { Center: { Lat: -34.6, Lon: -58.4 }, Radius: { Lat: 0.5, Lon: 0.5 } };
        expect(h.hasCircle(circle)).toBeTruthy();
        expect(h.hasCircle(null)).toBeFalsy();
        expect(h.hasCircle({ Center: { Lat: 0, Lon: 1 }, Radius: { Lat: 1, Lon: 1 } })).toBeFalsy();
        expect(h.hasCircle({ Center: { Lat: 1, Lon: 1 }, Radius: { Lat: 1, Lon: 0 } })).toBeFalsy();
});

it('scaleEnvelope contrae el envelope hacia el centro sin moverlo', () => {
        const envelope = { Min: { Lat: 0, Lon: 0 }, Max: { Lat: 10, Lon: 10 } };
        const same = h.scaleEnvelope(envelope, 1);
        expect(same.Min.Lat).toBeCloseTo(0, 6);
        expect(same.Max.Lat).toBeCloseTo(10, 6);
        const shrunk = h.scaleEnvelope(envelope, 0.5);
        expect(shrunk.Min.Lat).toBeCloseTo(1.25, 6);
        expect(shrunk.Max.Lat).toBeCloseTo(8.75, 6);
});

it('getFrameParams serializa zoom y envelope, y ante clipping anula el envelope', () => {
        const frame = {
                Zoom: '12',
                Envelope: { Min: { Lat: 1, Lon: 2 }, Max: { Lat: 3, Lon: 4 } },
                ClippingRegionIds: null,
                ClippingCircle: null,
        };
        expect(h.getFrameParams(frame)).toEqual({ e: '1,2;3,4', z: 12 });
        frame.ClippingRegionIds = [5, 6];
        expect(h.getFrameParams(frame)).toEqual({ e: null, z: 12, r: '5,6' });
        frame.ClippingRegionIds = null;
        frame.ClippingCircle = { Center: { Lat: -34.6, Lon: -58.4 }, Radius: { Lat: 0.5, Lon: 0.5 } };
        expect(h.getFrameParams(frame)).toEqual({ e: null, z: 12, c: '-34.6,-58.4;0.5,0.5' });
});

describe('helper: lookups por Id');

it('getMetric / getVariable / getValueLabel / getLevel encuentran por Id y devuelven null si no está', () => {
        const metrics = [{ Metric: { Id: 1 } }, { Metric: { Id: 2 } }];
        expect(h.getMetric(metrics, 2)).toBe(metrics[1]);
        expect(h.getMetric(metrics, 9)).toBe(null);
        const variables = [{ Id: 7 }];
        expect(h.getVariable(variables, 7)).toBe(variables[0]);
        expect(h.getVariable(variables, 8)).toBe(null);
        const labels = [{ Id: 3 }];
        expect(h.getValueLabel(labels, 3)).toBe(labels[0]);
        expect(h.getValueLabel(labels, 4)).toBe(null);
        const levels = [{ Id: 5 }];
        expect(h.getLevel(levels, 5)).toBe(levels[0]);
        expect(h.getLevel(levels, 6)).toBe(null);
});
