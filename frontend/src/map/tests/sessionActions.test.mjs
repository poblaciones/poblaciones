import { describe, it, expect } from './_harness.mjs';
import { setupWindow, makeCallRecorder } from './fixtures.mjs';
import ActionManagerBase from '@/map/session/ActionManagerBase';
import UIActions from '@/map/session/UIActions';
import ContentActions from '@/map/session/ContentActions';
import Session from '@/map/session/Session';

// La sesión registra las acciones del usuario para telemetría
// (services/session/UpdateUsage). Se prueba ActionManagerBase y sus dos
// subclases con una sesión fingida, y Session por prototipo (el constructor
// arma timers reales: no se instancia; mismo enfoque que segmentedMap.test).

function makeFakeSession() {
        const calls = [];
        const session = {
                Actions: [],
                LastActivity: 0,
                GetTimeMs() { return 1234; },
                summaryCalls: calls,
                Summary: {},
        };
        for (const name of ['ZoomChanged', 'BoundsChanged', 'MetricAdded', 'BaseMetricAdded', 'BoundaryAdded', 'SerieSelected', 'FeatureSelected', 'RegionSelected', 'CircleSelected', 'Metadata', 'Download']) {
                session.Summary[name] = function (...args) { calls.push([name, ...args]); };
        }
        return session;
}

function makeUiActions() {
        const segMap = setupWindow();
        segMap.Suggestions = makeCallRecorder();
        const session = makeFakeSession();
        return { segMap, session, ui: new UIActions(session) };
}

function makeContentActions() {
        const segMap = setupWindow();
        segMap.Suggestions = makeCallRecorder();
        const session = makeFakeSession();
        return { segMap, session, content: new ContentActions(session) };
}

// Post simulado: cadena then/finally resuelta en el acto.
function chain() {
        return { then(fn) { fn({}); return this; }, finally(fn) { fn(); return this; } };
}

// Pulse() re-arma el timer vía KeepTimer: se ejecuta con setTimeout reemplazado
// para que no queden timers reales pendientes.
function runPulse(session) {
        const original = globalThis.setTimeout;
        globalThis.setTimeout = function () { return 0; };
        try {
                session.Pulse();
        } finally {
                globalThis.setTimeout = original;
        }
}

describe('ActionManagerBase: registro de acciones');

it('RegisterAction arma la Action con type, name, value y tiempo, y actualiza LastActivity', () => {
        const session = makeFakeSession();
        const manager = new ActionManagerBase(session, 'UI');
        manager.RegisterAction('Bounds', 'b1');
        expect(session.Actions).toHaveLength(1);
        expect(session.Actions[0].Type).toBe('UI');
        expect(session.Actions[0].Name).toBe('Bounds');
        expect(session.Actions[0].Value).toBe('b1');
        expect(session.Actions[0].TimeMs).toBe(1234);
        expect(session.LastActivity).toBe(1234);
});

it('RegisterActionChange no re-registra mientras el valor no cambie', () => {
        const session = makeFakeSession();
        const manager = new ActionManagerBase(session, 'UI');
        manager.RegisterActionChange('Labels', 'on');
        manager.RegisterActionChange('Labels', 'on');
        expect(session.Actions).toHaveLength(1);
        manager.RegisterActionChange('Labels', 'off');
        expect(session.Actions).toHaveLength(2);
});

it('isRegisterEnabled en false pausa el registro sin tocar los estados', () => {
        const session = makeFakeSession();
        const manager = new ActionManagerBase(session, 'UI');
        manager.RegisterAction('Bounds', 'b1');
        manager.isRegisterEnabled = false;
        manager.RegisterActionChange('Bounds', 'b2');
        expect(session.Actions).toHaveLength(1);
        // el estado sí quedó actualizado: al reactivar, un nuevo cambio sí registra
        expect(manager.states.Bounds).toBe('b2');
        manager.isRegisterEnabled = true;
        manager.RegisterActionChange('Bounds', 'b1');
        expect(session.Actions).toHaveLength(2);
});

it('RemoveIfLastIs saca la última acción solo si coincide nombre y tipo del manager', () => {
        const session = makeFakeSession();
        const ui = new ActionManagerBase(session, 'UI');
        const content = new ActionManagerBase(session, 'Content');
        ui.RegisterAction('Bounds', 'b1');
        content.RegisterAction('AddMetric', 5);
        // la última acción es de Content: el manager UI no la toca
        ui.RemoveIfLastIs('Bounds');
        expect(session.Actions).toHaveLength(2);
        content.RemoveIfLastIs('AddMetric');
        expect(session.Actions).toHaveLength(1);
        // nombre que coincide pero manager de otro tipo: tampoco saca
        content.RemoveIfLastIs('Bounds');
        expect(session.Actions).toHaveLength(1);
        ui.RemoveIfLastIs('Bounds');
        expect(session.Actions).toHaveLength(0);
});

describe('UIActions: acciones de interfaz');

it('ZoomChanged registra la acción, avisa a Suggestions y al Summary', () => {
        const { segMap, session, ui } = makeUiActions();
        ui.ZoomChanged(9);
        expect(session.Actions[0].Name).toBe('Zoom');
        expect(session.Actions[0].Value).toBe(9);
        expect(segMap.Suggestions.calls[0]).toEqual({ method: 'RegisterAction', args: ['UI', 'Zoom', 9] });
        expect(session.summaryCalls[0]).toEqual(['ZoomChanged', 9]);
});

it('BoundsChanged colapsa los bounds consecutivos: queda solo el último', () => {
        const { session, ui } = makeUiActions();
        ui.BoundsChanged('b1');
        ui.BoundsChanged('b2');
        ui.BoundsChanged('b3');
        expect(session.Actions).toHaveLength(1);
        expect(session.Actions[0].Name).toBe('Bounds');
        expect(session.Actions[0].Value).toBe('b3');
});

it('un Zoom en el medio interrumpe el colapso de bounds', () => {
        const { session, ui } = makeUiActions();
        ui.BoundsChanged('b1');
        ui.ZoomChanged(9);
        ui.BoundsChanged('b2');
        expect(session.Actions).toHaveLength(3);
        expect(session.Actions.map(a => a.Name)).toEqual(['Bounds', 'Zoom', 'Bounds']);
});

it('LabelsChanged registra on/off y deduplica consecutivos iguales', () => {
        const { session, ui } = makeUiActions();
        ui.LabelsChanged(true);
        ui.LabelsChanged(true);
        expect(session.Actions).toHaveLength(1);
        expect(session.Actions[0].Value).toBe('on');
        ui.LabelsChanged(false);
        expect(session.Actions).toHaveLength(2);
        expect(session.Actions[1].Value).toBe('off');
});

describe('ContentActions: acciones de contenido');

it('AddMetric registra la acción y avisa a Suggestions y Summary', () => {
        const { segMap, session, content } = makeContentActions();
        content.AddMetric(42);
        expect(session.Actions[0]).toEqual({ Type: 'Content', Name: 'AddMetric', Value: 42, TimeMs: 1234 });
        expect(segMap.Suggestions.calls[0]).toEqual({ method: 'RegisterAction', args: ['Content', 'AddMetric', 42] });
        expect(session.summaryCalls).toEqual([['MetricAdded']]);
});

it('SelectSerie ignora series nulas y deduplica la acción por nombre de versión', () => {
        const { session, content } = makeContentActions();
        content.SelectSerie(null);
        expect(session.Actions).toHaveLength(0);
        content.SelectSerie({ Version: { Name: '2010' } });
        content.SelectSerie({ Version: { Name: '2010' } });
        // la acción deduplica, pero el Summary se avisa en cada llamada
        expect(session.Actions).toHaveLength(1);
        expect(session.Actions[0].Value).toBe('2010');
        expect(session.summaryCalls).toEqual([['SerieSelected', '2010'], ['SerieSelected', '2010']]);
});

it('SelectBoundarySerie usa el nombre directo de la serie (segunda definición del prototype)', () => {
        const { session, content } = makeContentActions();
        content.SelectBoundarySerie({ Name: '2020' });
        expect(session.Actions[0].Name).toBe('SelectBoundarySerie');
        expect(session.Actions[0].Value).toBe('2020');
        expect(session.summaryCalls).toEqual([['SerieSelected', '2020']]);
});

it('SelectFeature registra featureId, metricId y variableId (con defaults null)', () => {
        const { session, content } = makeContentActions();
        content.SelectFeature(5, 3, 9);
        expect(session.Actions[0].Name).toBe('SelectFeature');
        expect(session.Actions[0].Value).toEqual({ featureId: 5, metricId: 3, variableId: 9 });
        content.SelectFeature(7);
        expect(session.Actions[1].Value).toEqual({ featureId: 7, metricId: null, variableId: null });
        expect(session.summaryCalls).toEqual([['FeatureSelected'], ['FeatureSelected']]);
});

it('SelectRegion registra como SelectRegions', () => {
        const { segMap, session, content } = makeContentActions();
        content.SelectRegion([1, 2]);
        expect(session.Actions[0].Name).toBe('SelectRegions');
        expect(session.Actions[0].Value).toEqual([1, 2]);
        expect(segMap.Suggestions.calls[0]).toEqual({ method: 'RegisterAction', args: ['Content', 'SelectRegions', [1, 2]] });
        expect(session.summaryCalls).toEqual([['RegionSelected']]);
});

describe('Session: datos de arranque y pulso (por prototipo, sin instanciar)');

function makeSessionInstance() {
        const segMap = setupWindow();
        const posts = [];
        segMap.Post = function (url, data) { posts.push({ url, data }); return chain(); };
        const session = Object.create(Session.prototype);
        session.Data = { Startup: null, IsMobile: null, IsEmbedded: null, Screen: { Width: null, Height: null }, DayWeek: null, DayHour: null };
        session.savedData = false;
        session.Actions = [];
        session.LastActivity = 0;
        session.lastSave = 0;
        session.saving = false;
        session.Summary = { Data: { P: 1 }, updateCalls: [], UpdateEllapsed() { session.Summary.updateCalls.push(1); } };
        session.navigationId = 5;
        session.navigationMonth = 7;
        session.INTERVAL_SECS = 5;
        session.INTERVAL_SECS_SET = [5, 10, 20, 30];
        return { segMap, posts, session };
}

it('FillStartup llena Data desde window', () => {
        setupWindow({ location: { href: 'http://host/map/83401' } });
        const session = Object.create(Session.prototype);
        session.Data = { Startup: null, IsMobile: null, IsEmbedded: null, Screen: { Width: null, Height: null }, DayWeek: null, DayHour: null };
        session.FillStartup({ IsMobile: true });
        expect(session.Data.IsMobile).toBe(true);
        expect(session.Data.IsEmbedded).toBe(false);
        expect(session.Data.Startup).toBe('http://host/map/83401');
        expect(session.Data.Screen).toEqual({ Width: 1200, Height: 800 });
        // DayWeek/DayHour salen del reloj: solo se verifica que queden cargados
        expect(session.Data.DayWeek != null).toBeTruthy();
        expect(session.Data.DayHour != null).toBeTruthy();
});

it('GetTimeMs mide desde el inicio de la sesión', () => {
        const session = Object.create(Session.prototype);
        session.startSessionTime = new Date(Date.now() - 5000);
        const ms = session.GetTimeMs();
        expect(ms > 4900 && ms < 15000).toBeTruthy();
});

it('KeepTimer avanza la escalera 5→10→20→30 y se queda en 30', () => {
        const original = globalThis.setTimeout;
        const delays = [];
        globalThis.setTimeout = function (fn, ms) { delays.push(ms); return 0; };
        try {
                const session = Object.create(Session.prototype);
                session.INTERVAL_SECS = 5;
                session.INTERVAL_SECS_SET = [5, 10, 20, 30];
                session.KeepTimer();
                session.KeepTimer();
                session.KeepTimer();
                session.KeepTimer();
                expect(session.INTERVAL_SECS).toBe(30);
                expect(delays).toEqual([10000, 20000, 30000, 30000]);
        } finally {
                globalThis.setTimeout = original;
        }
});

it('Pulse sin actividad nueva no guarda ni avisa al Summary', () => {
        const { posts, session } = makeSessionInstance();
        runPulse(session);
        expect(posts).toHaveLength(0);
        expect(session.Summary.updateCalls).toHaveLength(0);
});

it('Pulse con actividad envía las acciones y las limpia al confirmarse el guardado', () => {
        const { posts, session } = makeSessionInstance();
        session.Actions.push({ Type: 'UI', Name: 'Zoom', Value: 9, TimeMs: 1 });
        session.LastActivity = 5000;
        runPulse(session);
        expect(posts).toHaveLength(1);
        expect(posts[0].url).toBe('http://host/services/session/UpdateUsage');
        expect(posts[0].data.id).toBe(5);
        expect(posts[0].data.m).toBe(7);
        // primer guardado: el payload lleva los datos de arranque
        expect(posts[0].data.i).toBe(session.Data);
        expect(posts[0].data.a).toHaveLength(1);
        expect(posts[0].data.a[0].Name).toBe('Zoom');
        expect(posts[0].data.s).toEqual({ P: 1 });
        expect(session.Summary.updateCalls).toHaveLength(1);
        // tras el guardado: lista limpia, savedData y lastSave actualizados
        expect(session.Actions).toHaveLength(0);
        expect(session.savedData).toBe(true);
        expect(session.lastSave).toBe(5000);
        expect(session.saving).toBe(false);
});

it('Pulse con guardado en curso no vuelve a enviar', () => {
        const { posts, session } = makeSessionInstance();
        session.LastActivity = 5000;
        session.saving = true;
        runPulse(session);
        expect(posts).toHaveLength(0);
});

it('Pulse tras el primer guardado envía i nulo (los datos de arranque van una sola vez)', () => {
        const { posts, session } = makeSessionInstance();
        session.savedData = true;
        session.lastSave = -1;
        session.LastActivity = 5000;
        runPulse(session);
        expect(posts).toHaveLength(1);
        expect(posts[0].data.i).toBe(null);
});
