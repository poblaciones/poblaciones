import { describe, it, expect } from './_harness.mjs';
import { setupWindow } from './fixtures.mjs';
import UndoClassifier from '@/map/classes/UndoClassifier';
import UndoHistory from '@/map/classes/UndoHistory';
import RouteStateDriver from '@/map/classes/RouteStateDriver';

// ---------- Instantáneas de prueba ----------

function layer(key, name, state, isBoundary) {
	return { key: key, name: name, isBoundary: !!isBoundary, state: Object.assign({ '': key.substr(1) }, state || {}) };
}

function snapshot(overrides) {
	return Object.assign({
		frame: '-34.6,-58.4,12z',
		basemap: '',
		featureInfo: '',
		clipping: { regions: '', circle: '' },
		layers: []
	}, overrides || {});
}

function classify(before, after, frameNote) {
	return UndoClassifier.Classify(before, after, frameNote === undefined ? null : frameNote);
}

describe('UndoClassifier: capas agregadas, quitadas y reordenadas');

it('agregar una capa se llama "Agregar" con su nombre', () => {
	const result = classify(snapshot(), snapshot({ layers: [layer('m1', 'Pobreza')] }));
	expect(result.label).toBe('Agregar «Pobreza»');
	expect(result.blocks).toEqual(['infos']);
});

it('quitar una capa se llama "Quitar" con su nombre', () => {
	const result = classify(snapshot({ layers: [layer('m1', 'Pobreza')] }), snapshot());
	expect(result.label).toBe('Quitar «Pobreza»');
});

it('agregar una delimitación y un indicador con el mismo número de id son capas distintas', () => {
	const before = snapshot({ layers: [layer('m5', 'Indicador')] });
	const after = snapshot({ layers: [layer('m5', 'Indicador'), layer('b5', 'Provincias', {}, true)] });
	expect(classify(before, after).label).toBe('Agregar «Provincias»');
});

it('varias altas o bajas juntas se cuentan', () => {
	const two = snapshot({ layers: [layer('m1', 'A'), layer('m2', 'B')] });
	expect(classify(snapshot(), two).label).toBe('Agregar 2 capas');
	expect(classify(two, snapshot()).label).toBe('Quitar 2 capas');
	expect(classify(snapshot({ layers: [layer('m1', 'A')] }), snapshot({ layers: [layer('m2', 'B')] })).label).toBe('Cambiar las capas');
});

it('cambiar el orden de las capas es "Reordenar"', () => {
	const before = snapshot({ layers: [layer('m1', 'A'), layer('m2', 'B')] });
	const after = snapshot({ layers: [layer('m2', 'B'), layer('m1', 'A')] });
	expect(classify(before, after).label).toBe('Reordenar las capas');
});

it('una capa sin nombre se describe de forma genérica', () => {
	expect(classify(snapshot(), snapshot({ layers: [layer('m1', '')] })).label).toBe('Agregar la capa');
});

describe('UndoClassifier: cambios dentro de una capa');

function withState(state, name) {
	return snapshot({ layers: [layer('m1', name || 'Pobreza', state)] });
}

it('cambiar de variable, de serie, de medida o de partición tiene su nombre', () => {
	expect(classify(withState({ i: '0' }), withState({ i: '1' })).label).toBe('Cambiar la variable de «Pobreza»');
	expect(classify(withState({ v: '0' }), withState({ v: '1' })).label).toBe('Cambiar la serie de «Pobreza»');
	expect(classify(withState({ m: 'N' }), withState({ m: 'P' })).label).toBe('Cambiar la medida de «Pobreza»');
	expect(classify(withState({ x: '' }), withState({ x: '2' })).label).toBe('Cambiar la partición de «Pobreza»');
	expect(classify(withState({ u: 'N' }), withState({ u: 'U' })).label).toBe('Cambiar el filtro de urbanidad de «Pobreza»');
});

it('activar, cambiar y desactivar la comparación de series', () => {
	expect(classify(withState({ v: '1' }), withState({ v: '0,1' })).label).toBe('Comparar series de «Pobreza»');
	expect(classify(withState({ v: '0,1' }), withState({ v: '0,2' })).label).toBe('Cambiar las series comparadas de «Pobreza»');
	expect(classify(withState({ v: '0,1' }), withState({ v: '1' })).label).toBe('Salir de la comparación de «Pobreza»');
});

it('abrir, cambiar y cerrar el ranking se deshacen', () => {
	expect(classify(withState({ k: '' }), withState({ k: 'D' })).label).toBe('Abrir el ranking de «Pobreza»');
	expect(classify(withState({ k: 'D' }), withState({ k: '20A' })).label).toBe('Cambiar el ranking de «Pobreza»');
	expect(classify(withState({ k: 'D' }), withState({ k: '' })).label).toBe('Cerrar el ranking de «Pobreza»');
});

it('las categorías visibles tienen su nombre, y mostrarlas todas también', () => {
	expect(classify(withState({ w: '' }), withState({ w: '1001' })).label).toBe('Cambiar las categorías visibles de «Pobreza»');
	expect(classify(withState({ w: '1001' }), withState({ w: '' })).label).toBe('Seleccionar todas las categorías de «Pobreza»');
});

it('descripciones, valores, trama, opacidad y gráfico son opciones de la capa', () => {
	expect(classify(withState({ d: '0' }), withState({ d: '1' })).label).toBe('Cambiar las opciones de «Pobreza»');
	expect(classify(withState({ p: '' }), withState({ p: '3' })).label).toBe('Cambiar las opciones de «Pobreza»');
	expect(classify(withState({ t: 'M' }), withState({ t: 'H' })).label).toBe('Cambiar las opciones de «Pobreza»');
	expect(classify(withState({ h: '1' }), withState({ h: '0' })).label).toBe('Cambiar las opciones de «Pobreza»');
});

it('colapsar o expandir las categorías no es una acción', () => {
	expect(classify(withState({ c: '0' }), withState({ c: '1' }))).toBeNull();
});

it('el nivel que acompaña al zoom no es una acción, ni lo que depende del nivel visible', () => {
	const before = withState({ a: '0', q: '0', w: '', i: '0' });
	const after = withState({ a: '1', q: '1', w: '1001', i: '0' });
	expect(classify(before, after)).toBeNull();
});

it('elegir un nivel distinto del automático sí es una acción', () => {
	const before = withState({ a: '1', q: '1' });
	const after = withState({ a: '2', q: '1' });
	expect(classify(before, after).label).toBe('Cambiar el nivel de «Pobreza»');
});

it('fijar el nivel es un cambio de nivel', () => {
	expect(classify(withState({ a: '1', q: '1' }), withState({ a: '1', q: '1', l: '1' })).label).toBe('Cambiar el nivel de «Pobreza»');
});

it('cambios en dos capas a la vez se resumen', () => {
	const before = snapshot({ layers: [layer('m1', 'A', { i: '0' }), layer('m2', 'B', { i: '0' })] });
	const after = snapshot({ layers: [layer('m1', 'A', { i: '1' }), layer('m2', 'B', { i: '1' })] });
	expect(classify(before, after).label).toBe('Cambiar las capas');
});

it('mostrar, ocultar y cambiar la serie de una delimitación', () => {
	const make = function (state) { return snapshot({ layers: [layer('b2', 'Provincias', state, true)] }); };
	expect(classify(make({ v: '1' }), make({ v: '0' })).label).toBe('Ocultar «Provincias»');
	expect(classify(make({ v: '0' }), make({ v: '1' })).label).toBe('Mostrar «Provincias»');
	expect(classify(make({ a: '0' }), make({ a: '1' })).label).toBe('Cambiar la serie de «Provincias»');
	expect(classify(make({ d: '0' }), make({ d: '1' })).label).toBe('Cambiar las opciones de «Provincias»');
});

it('sin diferencias no hay acción', () => {
	expect(classify(withState({ i: '0' }), withState({ i: '0' }))).toBeNull();
});

describe('UndoClassifier: mapa base, recorte y elemento seleccionado');

it('cambiar el tipo de mapa, las capas o las etiquetas', () => {
	expect(classify(snapshot({ basemap: '' }), snapshot({ basemap: 's' })).label).toBe('Cambiar el mapa base');
	expect(classify(snapshot({ basemap: '' }), snapshot({ basemap: 'rn' })).label).toBe('Ocultar las etiquetas del mapa');
	expect(classify(snapshot({ basemap: 'rn' }), snapshot({ basemap: '' })).label).toBe('Mostrar las etiquetas del mapa');
	expect(classify(snapshot({ basemap: 'r' }), snapshot({ basemap: 'rE' })).label).toBe('Cambiar las capas del mapa base');
});

it('el círculo y las regiones del recorte', () => {
	const none = { regions: '', circle: '' };
	const circle = { regions: '', circle: '-34,-58,0.1,0.1' };
	const region = { regions: '12', circle: '' };
	expect(classify(snapshot({ clipping: none }), snapshot({ clipping: circle })).label).toBe('Seleccionar un círculo');
	expect(classify(snapshot({ clipping: circle }), snapshot({ clipping: none })).label).toBe('Quitar el círculo');
	expect(classify(snapshot({ clipping: circle }), snapshot({ clipping: { regions: '', circle: '-35,-58,0.1,0.1' } })).label).toBe('Cambiar el círculo');
	expect(classify(snapshot({ clipping: none }), snapshot({ clipping: region })).label).toBe('Seleccionar un recorte');
	expect(classify(snapshot({ clipping: region }), snapshot({ clipping: { regions: '12,13', circle: '' } })).label).toBe('Cambiar el recorte');
	expect(classify(snapshot({ clipping: region }), snapshot({ clipping: none })).label).toBe('Quitar el recorte');
});

it('abrir, cambiar y cerrar el panel de un elemento son acciones', () => {
	expect(classify(snapshot(), snapshot({ featureInfo: 'f5!l1' })).label).toBe('Seleccionar un elemento');
	expect(classify(snapshot({ featureInfo: 'f5!l1' }), snapshot({ featureInfo: 'f6!l1' })).label).toBe('Seleccionar un elemento');
	expect(classify(snapshot({ featureInfo: 'f5!l1' }), snapshot()).label).toBe('Cerrar el panel del elemento');
	expect(classify(snapshot({ featureInfo: 'f5!l1' }), snapshot()).blocks).toEqual(['featureInfo']);
});

it('mover el mapa o cambiar el zoom solos no son acciones', () => {
	expect(classify(snapshot(), snapshot({ frame: '-30.1,-60.2,15z' }))).toBeNull();
});

it('el encuadre se restaura junto con el recorte o el elemento, si hubo una nota previa', () => {
	const note = { frame: '-34.6,-58.4,12z', at: 0 };
	const region = classify(snapshot(), snapshot({ clipping: { regions: '12', circle: '' } }), note);
	expect(region.blocks).toEqual(['clipping', 'frame']);
	const feature = classify(snapshot(), snapshot({ featureInfo: 'f5' }), note);
	expect(feature.blocks).toEqual(['featureInfo', 'frame']);
});

it('el encuadre no se restaura con las capas ni sin nota', () => {
	const note = { frame: 'x', at: 0 };
	expect(classify(snapshot(), snapshot({ layers: [layer('m1', 'A')] }), note).blocks).toEqual(['infos']);
	expect(classify(snapshot(), snapshot({ featureInfo: 'f5' }), null).blocks).toEqual(['featureInfo']);
});

it('si el panel del elemento se cierra junto con una acción, se restaura con ella', () => {
	const before = snapshot({ layers: [layer('m1', 'A')], featureInfo: 'f5!l1' });
	const after = snapshot();
	expect(classify(before, after).blocks).toEqual(['infos', 'featureInfo']);
});

// ---------- UndoHistory con un driver de mentira ----------

// El "estado del mapa" es un objeto; Capture lo copia y Apply lo reemplaza.
function makeFakeDriver() {
	const driver = {
		world: snapshot(),
		applied: [],
		applyDelay: false,
		Capture() {
			return JSON.parse(JSON.stringify(driver.world));
		},
		Pick(snap, blocks) {
			return { snap: snap, blocks: blocks };
		},
		Apply(values, blocks) {
			driver.applied.push(blocks.join('+'));
			driver.world = JSON.parse(JSON.stringify(values.snap));
			return Promise.resolve();
		}
	};
	return driver;
}

function makeHistory() {
	const driver = makeFakeDriver();
	const state = { CanUndo: false, CanRedo: false, UndoLabel: '', RedoLabel: '' };
	const history = new UndoHistory(driver, state);
	history.Rebase();
	return { driver: driver, state: state, history: history };
}

// Simula una acción del usuario: interacción, cambio del mundo y actualización de la ruta.
function userChange(ctx, changes) {
	ctx.history.NoteUserInput();
	Object.assign(ctx.driver.world, changes);
	ctx.history.OnRouteChanged();
}

describe('UndoHistory: registro de acciones');

it('al comienzo no hay nada para deshacer ni rehacer, y los tooltips son genéricos', () => {
	const ctx = makeHistory();
	expect(ctx.state.CanUndo).toBe(false);
	expect(ctx.state.CanRedo).toBe(false);
	expect(ctx.state.UndoLabel).toBe('Deshacer');
	expect(ctx.state.RedoLabel).toBe('Rehacer');
});

it('una acción habilita deshacer y el tooltip dice qué deshace', () => {
	const ctx = makeHistory();
	userChange(ctx, { layers: [layer('m1', 'Pobreza')] });
	expect(ctx.state.CanUndo).toBe(true);
	expect(ctx.state.CanRedo).toBe(false);
	expect(ctx.state.UndoLabel).toBe('Deshacer: Agregar «Pobreza»');
});

it('un cambio sin interacción previa del usuario no se registra (cargas y respuestas tardías)', () => {
	const ctx = makeHistory();
	ctx.driver.world.layers = [layer('m1', 'Pobreza')];
	ctx.history.OnRouteChanged();
	expect(ctx.state.CanUndo).toBe(false);
});

it('mover el mapa no registra nada, aunque el usuario haya interactuado', () => {
	const ctx = makeHistory();
	userChange(ctx, { frame: '-30,-60,15z' });
	expect(ctx.state.CanUndo).toBe(false);
});

it('Rebase toma el estado actual sin registrarlo y exige una nueva interacción', () => {
	const ctx = makeHistory();
	ctx.history.NoteUserInput();
	ctx.driver.world.layers = [layer('m1', 'Pobreza')];
	ctx.history.Rebase();
	ctx.driver.world.layers = [layer('m1', 'Pobreza'), layer('m2', 'Otra')];
	ctx.history.OnRouteChanged();
	expect(ctx.state.CanUndo).toBe(false);
});

it('si no hubo un estado previo, el primer cambio solo lo establece', () => {
	const driver = makeFakeDriver();
	const state = { CanUndo: false, CanRedo: false, UndoLabel: '', RedoLabel: '' };
	const history = new UndoHistory(driver, state);
	history.NoteUserInput();
	driver.world.layers = [layer('m1', 'Pobreza')];
	history.OnRouteChanged();
	expect(state.CanUndo).toBe(false);
});

it('guarda como máximo 50 acciones', () => {
	const ctx = makeHistory();
	for (let n = 0; n < 60; n++) {
		userChange(ctx, { clipping: { regions: String(n + 1), circle: '' } });
	}
	expect(ctx.history.undoStack).toHaveLength(50);
});

describe('UndoHistory: deshacer y rehacer');

it('deshacer restaura el estado anterior y habilita rehacer', async () => {
	const ctx = makeHistory();
	userChange(ctx, { layers: [layer('m1', 'Pobreza')] });
	await ctx.history.Undo();
	expect(ctx.driver.world.layers).toEqual([]);
	expect(ctx.state.CanUndo).toBe(false);
	expect(ctx.state.CanRedo).toBe(true);
	expect(ctx.state.RedoLabel).toBe('Rehacer: Agregar «Pobreza»');
});

it('rehacer vuelve a aplicar la acción y deja deshacer disponible', async () => {
	const ctx = makeHistory();
	userChange(ctx, { layers: [layer('m1', 'Pobreza')] });
	await ctx.history.Undo();
	await ctx.history.Redo();
	expect(ctx.driver.world.layers).toEqual([layer('m1', 'Pobreza')]);
	expect(ctx.state.CanUndo).toBe(true);
	expect(ctx.state.CanRedo).toBe(false);
});

it('deshace en orden inverso y los tooltips siguen a la pila', async () => {
	const ctx = makeHistory();
	userChange(ctx, { layers: [layer('m1', 'A')] });
	userChange(ctx, { layers: [layer('m1', 'A'), layer('m2', 'B')] });
	expect(ctx.state.UndoLabel).toBe('Deshacer: Agregar «B»');
	await ctx.history.Undo();
	expect(ctx.state.UndoLabel).toBe('Deshacer: Agregar «A»');
	expect(ctx.state.RedoLabel).toBe('Rehacer: Agregar «B»');
	await ctx.history.Undo();
	expect(ctx.driver.world.layers).toEqual([]);
});

it('una acción nueva después de deshacer borra lo que se podía rehacer', async () => {
	const ctx = makeHistory();
	userChange(ctx, { layers: [layer('m1', 'A')] });
	await ctx.history.Undo();
	expect(ctx.state.CanRedo).toBe(true);
	userChange(ctx, { clipping: { regions: '3', circle: '' } });
	expect(ctx.state.CanRedo).toBe(false);
	expect(ctx.state.RedoLabel).toBe('Rehacer');
});

it('lo que cambia al aplicar un deshacer no se registra como acción nueva', async () => {
	const ctx = makeHistory();
	userChange(ctx, { layers: [layer('m1', 'A')] });
	ctx.history.NoteUserInput();
	await ctx.history.Undo();
	ctx.history.OnRouteChanged();
	expect(ctx.history.undoStack).toHaveLength(0);
	expect(ctx.history.redoStack).toHaveLength(1);
});

it('mientras se aplica no se puede deshacer ni rehacer, y se informa a la interfaz', async () => {
	const ctx = makeHistory();
	userChange(ctx, { layers: [layer('m1', 'A')] });
	let release = null;
	ctx.driver.Apply = function (values) {
		ctx.driver.world = JSON.parse(JSON.stringify(values.snap));
		return new Promise(function (resolve) { release = resolve; });
	};
	const pending = ctx.history.Undo();
	expect(ctx.state.CanUndo).toBe(false);
	expect(ctx.state.CanRedo).toBe(false);
	expect(await ctx.history.Undo()).toBe(false);
	release();
	await pending;
	expect(ctx.state.CanRedo).toBe(true);
});

it('si aplicar falla, el historial queda usable y el error se propaga', async () => {
	const ctx = makeHistory();
	userChange(ctx, { layers: [layer('m1', 'A')] });
	ctx.driver.Apply = function () {
		return Promise.reject(new Error('falló'));
	};
	let message = '';
	try {
		await ctx.history.Undo();
	} catch (error) {
		message = error.message;
	}
	expect(message).toBe('falló');
	expect(ctx.history.applying).toBe(false);
});

it('deshacer sin nada que deshacer no hace nada', async () => {
	const ctx = makeHistory();
	expect(await ctx.history.Undo()).toBe(false);
	expect(await ctx.history.Redo()).toBe(false);
	expect(ctx.driver.applied).toEqual([]);
});

it('con la nota de encuadre, deshacer devuelve el encuadre previo al clic', async () => {
	const ctx = makeHistory();
	ctx.history.NoteFrame();
	ctx.driver.world.frame = '-30,-60,16z';
	userChange(ctx, { featureInfo: 'f5' });
	await ctx.history.Undo();
	expect(ctx.driver.world.frame).toBe('-34.6,-58.4,12z');
	expect(ctx.driver.world.featureInfo).toBe('');
});

it('una nota de encuadre vencida no se aplica', async () => {
	const ctx = makeHistory();
	ctx.history.NoteFrame();
	ctx.history.frameNote.at = Date.now() - 60000;
	ctx.driver.world.frame = '-30,-60,16z';
	userChange(ctx, { featureInfo: 'f5' });
	expect(ctx.history.undoStack[0].blocks).toEqual(['featureInfo']);
});

describe('UndoHistory: atajos de teclado');

function keyEvent(options) {
	const event = Object.assign({ key: 'z', ctrlKey: true, metaKey: false, shiftKey: false, altKey: false, target: { tagName: 'DIV' }, defaultPrevented: false }, options);
	event.prevented = false;
	event.preventDefault = function () { event.prevented = true; };
	return event;
}

async function twoActions() {
	const ctx = makeHistory();
	userChange(ctx, { layers: [layer('m1', 'A')] });
	userChange(ctx, { layers: [layer('m1', 'A'), layer('m2', 'B')] });
	return ctx;
}

it('Ctrl+Z deshace y Ctrl+Y rehace', async () => {
	const ctx = await twoActions();
	const undo = keyEvent({});
	expect(ctx.history.HandleKeyDown(undo)).toBe(true);
	expect(undo.prevented).toBe(true);
	await Promise.resolve();
	expect(ctx.state.UndoLabel).toBe('Deshacer: Agregar «A»');
	expect(ctx.state.RedoLabel).toBe('Rehacer: Agregar «B»');
	expect(ctx.history.HandleKeyDown(keyEvent({ key: 'y' }))).toBe(true);
	await Promise.resolve();
	expect(ctx.state.UndoLabel).toBe('Deshacer: Agregar «B»');
});

it('Ctrl+Shift+Z también rehace, y Cmd reemplaza a Ctrl', async () => {
	const ctx = await twoActions();
	ctx.history.HandleKeyDown(keyEvent({ ctrlKey: false, metaKey: true }));
	await Promise.resolve();
	expect(ctx.state.CanRedo).toBe(true);
	ctx.history.HandleKeyDown(keyEvent({ key: 'Z', shiftKey: true }));
	await Promise.resolve();
	expect(ctx.state.CanRedo).toBe(false);
});

it('en un campo de texto se deja el deshacer del navegador', async () => {
	const ctx = await twoActions();
	const targets = [{ tagName: 'INPUT' }, { tagName: 'TEXTAREA' }, { tagName: 'SELECT' }, { tagName: 'DIV', isContentEditable: true }];
	for (const target of targets) {
		const event = keyEvent({ target: target });
		expect(ctx.history.HandleKeyDown(event)).toBe(false);
		expect(event.prevented).toBe(false);
	}
	expect(ctx.state.CanRedo).toBe(false);
});

it('sin Ctrl o Cmd, con Alt, con otra tecla o ya atendido, no hace nada', async () => {
	const ctx = await twoActions();
	expect(ctx.history.HandleKeyDown(keyEvent({ ctrlKey: false }))).toBe(false);
	expect(ctx.history.HandleKeyDown(keyEvent({ altKey: true }))).toBe(false);
	expect(ctx.history.HandleKeyDown(keyEvent({ key: 'a' }))).toBe(false);
	expect(ctx.history.HandleKeyDown(keyEvent({ defaultPrevented: true }))).toBe(false);
	expect(ctx.state.CanRedo).toBe(false);
});

it('sin nada para deshacer el atajo se atiende sin efecto', async () => {
	const ctx = makeHistory();
	expect(ctx.history.HandleKeyDown(keyEvent({}))).toBe(true);
	expect(ctx.state.CanRedo).toBe(false);
});

describe('UndoHistory: acciones fuera de la ruta');

it('una acción propia se deshace y se rehace con las funciones que aporta, y resetea el rehacer', async () => {
	const ctx = makeHistory();
	const calls = [];
	ctx.history.RecordCustom('Quitar «Uno» de recientes', () => calls.push('undo'), () => calls.push('redo'));
	expect(ctx.state.UndoLabel).toBe('Deshacer: Quitar «Uno» de recientes');
	await ctx.history.Undo();
	expect(ctx.state.RedoLabel).toBe('Rehacer: Quitar «Uno» de recientes');
	await ctx.history.Redo();
	expect(calls).toEqual(['undo', 'redo']);
	expect(ctx.state.CanUndo).toBe(true);
	await ctx.history.Undo();
	ctx.history.RecordCustom('Otra', () => {}, () => {});
	expect(ctx.state.CanRedo).toBe(false);
});

it('lo que una acción propia dispare al deshacerse o rehacerse no se registra como una acción nueva', async () => {
	const ctx = makeHistory();
	ctx.history.RecordCustom('Cerrar el panel de estadísticas', () => {
		ctx.history.RecordCustom('Efecto secundario', () => {}, () => {});
	}, () => {
		ctx.history.RecordCustom('Efecto secundario', () => {}, () => {});
	});
	await ctx.history.Undo();
	expect(ctx.history.undoStack).toHaveLength(0);
	expect(ctx.state.RedoLabel).toBe('Rehacer: Cerrar el panel de estadísticas');
	await ctx.history.Redo();
	expect(ctx.history.redoStack).toHaveLength(0);
	expect(ctx.state.UndoLabel).toBe('Deshacer: Cerrar el panel de estadísticas');
});

// ---------- RouteStateDriver ----------

function makeRouters(log) {
	const record = function (name) {
		return function () {
			log.push(name + ':' + Array.prototype.slice.call(arguments).map(a => JSON.stringify(a)).join('|'));
			return Promise.resolve();
		};
	};
	return {
		frame: { FromRoute: record('frame') },
		basemap: { FromRoute: record('basemap') },
		clipping: {
			clippingFromRoute(args) { return args; },
			ToRoute() { return []; }
		},
		infos: { FromRoute: record('infos'), SelectedInfoToRoute() { return []; } },
		featureInfo: { FromRoute: record('feature'), Clear: record('featureClear') }
	};
}

function makeDriver(options) {
	setupWindow();
	const log = [];
	const routers = makeRouters(log);
	const parsed = options && options.parsed ? options.parsed : {};
	const clippingCalls = [];
	const segMap = {
		SaveRoute: {
			subscribersByName: routers,
			calculateState() { return '/route'; },
			callSubscriber() { return 'v'; },
			UpdateRoute() { log.push('updateRoute'); }
		},
		RestoreRoute: {
			parseRoute(route, router) {
				for (const name of Object.keys(routers)) {
					if (routers[name] === router) {
						return parsed[name] === undefined ? null : parsed[name];
					}
				}
				return null;
			}
		},
		Session: { UI: { isRegisterEnabled: true } },
		Metrics: { metrics: [] },
		Clipping: {
			SetClippingCircle(c) { clippingCalls.push(['circle', c]); },
			SetClippingRegion(ids, a, b, c) { clippingCalls.push(['region', ids, a, b, c]); },
			ResetClippingCircle() { clippingCalls.push(['resetCircle']); },
			ResetClippingRegion(r) { clippingCalls.push(['resetRegion', r]); },
			FrameHasClippingCircle() { return options && options.hasCircle === true; },
			FrameHasClippingRegionId() { return options && options.hasRegion === true; }
		}
	};
	return { driver: new RouteStateDriver(segMap), log: log, segMap: segMap, clippingCalls: clippingCalls };
}

describe('RouteStateDriver: captura');

it('routeValuesToMap numera la clave repetida (nivel y pasos de secuencia comparten la "a")', () => {
	const { driver } = makeDriver();
	const map = driver.routeValuesToMap([[7], ['v', 1, -1], ['a', 2, 0], ['a', '3@2', null], ['k', '', '']]);
	expect(map).toEqual({ '': '7', v: '1', a: '2', a2: '3@2', k: '' });
});

it('Capture arma las capas con prefijo según sean indicadores o delimitaciones', () => {
	const { driver, segMap } = makeDriver();
	segMap.SaveRoute.subscribersByName.infos.SelectedInfoToRoute = function (metric) {
		return [[metric.properties.Id], ['v', 0, -1]];
	};
	segMap.Metrics.metrics = [
		{ isBoundary: false, properties: { Id: 5, Metric: { Name: 'Pobreza' } } },
		{ isBoundary: true, properties: { Id: 5, Name: 'Provincias' } }
	];
	const captured = driver.Capture();
	expect(captured.layers.map(l => l.key)).toEqual(['m5', 'b5']);
	expect(captured.layers.map(l => l.name)).toEqual(['Pobreza', 'Provincias']);
	expect(captured.layers[1].isBoundary).toBe(true);
	expect(captured.route).toBe('/route');
});

it('Capture lee las regiones y el círculo del recorte', () => {
	const { driver, segMap } = makeDriver();
	segMap.SaveRoute.subscribersByName.clipping.ToRoute = function () {
		return [['l', '', ''], ['r', '1,2'], ['c', '-34,-58,1,1']];
	};
	const captured = driver.Capture();
	expect(captured.clipping).toEqual({ regions: '1,2', circle: '-34,-58,1,1' });
});

describe('RouteStateDriver: restauración');

it('restaura solo los bloques indicados, en orden, y actualiza la ruta al final', async () => {
	const { driver, log } = makeDriver({ parsed: { infos: [{ '': '1' }], basemap: ['s'] } });
	await driver.Apply({ route: '/r', frame: '-30,-60,15z' }, ['frame', 'basemap', 'infos']);
	expect(log).toEqual(['infos:[{"":"1"}]|false', 'basemap:["s"]', 'frame:["-30","-60","15z"]', 'updateRoute']);
});

it('sin bloque de mapa base en la ruta restaura el mapa base predeterminado', async () => {
	const { driver, log } = makeDriver();
	await driver.Apply({ route: '/r', frame: '' }, ['basemap']);
	expect(log[0]).toBe('basemap:["r"]');
});

it('sin bloque de capas en la ruta quita todas las capas', async () => {
	const { driver, log } = makeDriver();
	await driver.Apply({ route: '/r', frame: '' }, ['infos']);
	expect(log[0]).toBe('infos:null|false');
});

it('sin bloque de elemento en la ruta cierra el panel; con bloque lo reabre', async () => {
	const closing = makeDriver();
	await closing.driver.Apply({ route: '/r', frame: '' }, ['featureInfo']);
	expect(closing.log[0]).toBe('featureClear:');
	const opening = makeDriver({ parsed: { featureInfo: { f: '5' } } });
	await opening.driver.Apply({ route: '/r', frame: '' }, ['featureInfo']);
	expect(opening.log[0]).toBe('feature:{"f":"5"}');
});

it('recorte: un círculo se vuelve a dibujar con coordenadas numéricas', async () => {
	const { driver, clippingCalls } = makeDriver({ parsed: { clipping: {
		ClippingCircle: { Center: { Lat: '-34.5', Lon: '-58.5' }, Radius: { Lat: '0.1', Lon: '0.2' } },
		ClippingRegionIds: null
	} } });
	await driver.Apply({ route: '/r', frame: '' }, ['clipping']);
	expect(clippingCalls).toEqual([['circle', { Center: { Lat: -34.5, Lon: -58.5 }, Radius: { Lat: 0.1, Lon: 0.2 } }]]);
});

it('recorte: las regiones se seleccionan sin mover el encuadre', async () => {
	const { driver, clippingCalls } = makeDriver({ parsed: { clipping: { ClippingCircle: null, ClippingRegionIds: [3, 4] } } });
	await driver.Apply({ route: '/r', frame: '' }, ['clipping']);
	expect(clippingCalls).toEqual([['region', [3, 4], false, false, false]]);
});

it('recorte: sin recorte en el estado destino se quita el círculo o las regiones que haya', async () => {
	const none = { ClippingCircle: null, ClippingRegionIds: null };
	const circle = makeDriver({ parsed: { clipping: none }, hasCircle: true });
	await circle.driver.Apply({ route: '/r', frame: '' }, ['clipping']);
	expect(circle.clippingCalls).toEqual([['resetCircle']]);
	const region = makeDriver({ parsed: { clipping: none }, hasRegion: true });
	await region.driver.Apply({ route: '/r', frame: '' }, ['clipping']);
	expect(region.clippingCalls).toEqual([['resetRegion', null]]);
	const nothing = makeDriver({ parsed: { clipping: none } });
	await nothing.driver.Apply({ route: '/r', frame: '' }, ['clipping']);
	expect(nothing.clippingCalls).toEqual([]);
});

it('mientras restaura, el registro de acciones de la sesión queda apagado y después se reactiva', async () => {
	const { driver, segMap } = makeDriver({ parsed: {} });
	let during = null;
	segMap.SaveRoute.subscribersByName.basemap.FromRoute = function () {
		during = segMap.Session.UI.isRegisterEnabled;
	};
	await driver.Apply({ route: '/r', frame: '' }, ['basemap']);
	expect(during).toBe(false);
	expect(segMap.Session.UI.isRegisterEnabled).toBe(true);
});

it('si un bloque falla, el registro de acciones se reactiva igual y el error se propaga', async () => {
	const { driver, segMap } = makeDriver({ parsed: {} });
	segMap.SaveRoute.subscribersByName.basemap.FromRoute = function () {
		throw new Error('falló el mapa base');
	};
	let message = '';
	try {
		await driver.Apply({ route: '/r', frame: '' }, ['basemap']);
	} catch (error) {
		message = error.message;
	}
	expect(message).toBe('falló el mapa base');
	expect(segMap.Session.UI.isRegisterEnabled).toBe(true);
});
