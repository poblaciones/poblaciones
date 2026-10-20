import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, flushPromises } from './fixtures.mjs';
import LevelGenerator from '@/backoffice/classes/LevelGenerator';

function makeColumn(name) {
	return { Id: name.length, Variable: name };
}

function makeSourceVariable() {
	return {
		Id: 10,
		DataColumn: makeColumn('edad'),
		NormalizationColumn: makeColumn('total'),
		Symbology: { Id: 20, CutColumn: makeColumn('region'), SequenceColumn: null },
		Values: [{ Id: 30, Caption: 'A' }, { Id: 31, Caption: 'B' }],
	};
}

function makeDatasetDouble(columnNames) {
	const calls = [];
	const dataset = {
		calls: calls,
		Columns: columnNames.map(makeColumn),
		Work: {
			GetHighestLevelForVersion(version) {
				calls.push(['GetHighestLevelForVersion', version]);
				return Promise.resolve({ MetricVersion: 'version-destino', Variables: [makeSourceVariable()] });
			},
		},
		UpdateMetricVersionLevel(level) {
			calls.push(['UpdateMetricVersionLevel', level]);
			return Promise.resolve();
		},
		ScaleGenerator: {
			RegenAndSaveAllLevelVariables(level) {
				calls.push(['RegenAndSaveAllLevelVariables', level]);
				return Promise.resolve('grabadas');
			},
		},
	};
	return dataset;
}

function installFactory(browser) {
	browser.window.Context.Factory = {
		GetCopyPromise(type) {
			return Promise.resolve({ Type: type, Id: null });
		},
	};
}

describe('LevelGenerator: mensajes');

it('arranca sin mensajes y ClearMessages los descarta', () => {
	const generator = new LevelGenerator({});
	expect(generator.HasMessages()).toBeFalsy();
	generator.Messages.push('x');
	expect(generator.HasMessages()).toBeTruthy();
	generator.ClearMessages();
	expect(generator.HasMessages()).toBeFalsy();
});

describe('LevelGenerator: CloneVariable');

it('copia la variable sin identificadores y sin alterar la original', () => {
	const generator = new LevelGenerator({});
	const source = makeSourceVariable();
	const cloned = generator.CloneVariable(source);
	expect(cloned.Id).toBeNull();
	expect(cloned.Symbology.Id).toBeNull();
	expect(cloned.Values.map(function (value) { return value.Id; })).toEqual([null, null]);
	expect(source.Id).toBe(10);
	expect(source.Symbology.Id).toBe(20);
	expect(source.Values[0].Id).toBe(30);
});

describe('LevelGenerator: MigrateColumn');

it('una columna null se mantiene null', () => {
	expect(new LevelGenerator(makeDatasetDouble([])).MigrateColumn(null, 'a la formula')).toBeNull();
});

it('busca por nombre de variable y devuelve la columna del dataset actual', () => {
	const dataset = makeDatasetDouble(['edad', 'total']);
	const generator = new LevelGenerator(dataset);
	const migrated = generator.MigrateColumn({ Id: 999, Variable: 'edad' }, 'a la formula');
	expect(migrated === dataset.Columns[0]).toBeTruthy();
	expect(generator.HasMessages()).toBeFalsy();
});

it('si no la encuentra devuelve null y deja un mensaje que la nombra', () => {
	const generator = new LevelGenerator(makeDatasetDouble(['edad']));
	expect(generator.MigrateColumn({ Variable: 'peso' }, 'a la normalización')).toBeNull();
	expect(generator.Messages).toEqual(["La variable 'peso' correspondiente a la normalización del indicador no fue encontrada en el dataset actual."]);
});

describe('LevelGenerator: MigrateVariable');

it('migra las cuatro columnas de la variable', () => {
	const dataset = makeDatasetDouble(['edad', 'total', 'region']);
	const generator = new LevelGenerator(dataset);
	const variable = generator.MigrateVariable(makeSourceVariable());
	expect(variable.DataColumn === dataset.Columns[0]).toBeTruthy();
	expect(variable.NormalizationColumn === dataset.Columns[1]).toBeTruthy();
	expect(variable.Symbology.CutColumn === dataset.Columns[2]).toBeTruthy();
	expect(variable.Symbology.SequenceColumn).toBeNull();
	expect(generator.HasMessages()).toBeFalsy();
});

it('acumula un mensaje por cada columna sin homónima, indicando su uso', () => {
	const generator = new LevelGenerator(makeDatasetDouble([]));
	generator.MigrateVariable(makeSourceVariable());
	expect(generator.Messages).toHaveLength(3);
	expect(generator.Messages[0].includes("'edad' correspondiente a la formula")).toBeTruthy();
	expect(generator.Messages[1].includes("'total' correspondiente a la normalización")).toBeTruthy();
	expect(generator.Messages[2].includes("'region' correspondiente al criterio de corte")).toBeTruthy();
});

describe('LevelGenerator: CreateLevel y CreateVariables');

it('CreateLevel toma una copia del molde del catálogo, le asigna la versión y vacía las variables', async () => {
	const browser = setupBackoffice();
	installFactory(browser);
	const level = await new LevelGenerator({}).CreateLevel('version-x');
	expect(level).toEqual({ Type: 'MetricVersionLevel', Id: null, MetricVersion: 'version-x', Variables: [] });
});

it('CreateVariables agrega las variables migradas al nivel nuevo y delega su grabación', async () => {
	const dataset = makeDatasetDouble(['edad', 'total', 'region']);
	const generator = new LevelGenerator(dataset);
	const newLevel = { Variables: [] };
	const result = await generator.CreateVariables(newLevel, { Variables: [makeSourceVariable()] });
	expect(result).toBe('grabadas');
	expect(newLevel.Variables).toHaveLength(1);
	expect(newLevel.Variables[0].Id).toBeNull();
	expect(newLevel.Variables[0].DataColumn === dataset.Columns[0]).toBeTruthy();
	expect(dataset.calls[0][0]).toBe('RegenAndSaveAllLevelVariables');
});

describe('LevelGenerator: CompleteLevel');

it('busca el nivel más alto, crea el nuevo, lo graba y traslada las variables, en ese orden', async () => {
	const browser = setupBackoffice();
	installFactory(browser);
	const dataset = makeDatasetDouble(['edad', 'total', 'region']);
	const result = await new LevelGenerator(dataset).CompleteLevel('version-origen');
	expect(result).toBe('grabadas');
	expect(dataset.calls.map(function (call) { return call[0]; })).toEqual([
		'GetHighestLevelForVersion', 'UpdateMetricVersionLevel', 'RegenAndSaveAllLevelVariables',
	]);
	expect(dataset.calls[0][1]).toBe('version-origen');
	expect(dataset.calls[1][1].MetricVersion).toBe('version-destino');
	expect(browser.alerts).toHaveLength(0);
});

it('descarta los mensajes de una ejecución anterior', async () => {
	const browser = setupBackoffice();
	installFactory(browser);
	const generator = new LevelGenerator(makeDatasetDouble(['edad', 'total', 'region']));
	generator.Messages.push('viejo');
	await generator.CompleteLevel('version-origen');
	expect(generator.HasMessages()).toBeFalsy();
});

it('con variables sin homónima avisa con el detalle de cada una y completa igual el traslado', async () => {
	const browser = setupBackoffice();
	installFactory(browser);
	browser.window.alert = function (message) { browser.alerts.push(message); };
	const generator = new LevelGenerator(makeDatasetDouble(['edad']));
	const result = await generator.CompleteLevel('version-origen');
	await flushPromises();
	expect(result).toBe('grabadas');
	expect(browser.alerts).toHaveLength(1);
	const message = browser.alerts[0];
	expect(message.startsWith('Algunas de las variables del indicador no tienen su variable homónima: \n\n')).toBeTruthy();
	expect(message.includes("La variable 'total' correspondiente a la normalización")).toBeTruthy();
	expect(message.includes("La variable 'region' correspondiente al criterio de corte")).toBeTruthy();
	expect(message.endsWith('\n\nProcure revisar las definiciones de variables para este nivel.')).toBeTruthy();
});
