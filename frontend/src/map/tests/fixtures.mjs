// Fixtures de la batería del módulo map.
//
// - setupWindow(): arma un window global mínimo con el mock de SegMap que las
//   clases consultan (frame, Clipping, SaveRoute, Configuration). Devuelve el
//   mock para ajustarlo por test.
// - makeMetricProperties(): el JSON de un indicador (Versions/Levels/Variables/
//   ValueLabels) con la forma mínima que el cliente espera del servidor.
// - makeCatalogTree(): árbol de categorías como el de GetFabIndicators /
//   GetFabBoundaries, para el indicatorSelector.
// - mountLite(): "instancia" el objeto de opciones de un componente Vue sin
//   Vue: resuelve defaults de props, ejecuta data(), bindea methods, expone
//   los computed como getters sin caché y registra $emit. Alcanza para
//   ejercitar la lógica pura del componente (no el template ni el DOM).

export function setupWindow(overrides) {
	const segMap = {
		frame: { Zoom: 10, Envelope: { Min: { Lat: 0, Lon: 0 }, Max: { Lat: 0, Lon: 0 } }, Center: { Lat: 0, Lon: 0 } },
		Clipping: {
			HasClippingLevels() { return false; },
			LevelMachLevels() { return true; },
			clipping: { IsUpdating: false, Region: { Envelope: null } },
		},
		SaveRoute: { UpdateRoute() {}, Disabled: false },
		Session: { Content: makeCallRecorder(), UI: makeCallRecorder() },
		Configuration: { UseGradients: false, UseTextures: false, IsMobile: false, StaticWorks: [], StaticServer: 'http://static' },
		MapsApi: null,
		InfoWindow: { CheckUpdateNavigation() {} },
		Metrics: null,
		tileDataBlockSize: null,
	};
	globalThis.window = Object.assign({
		SegMap: segMap,
		Use: {},
		Embedded: { Active: false },
		innerWidth: 1200,
		innerHeight: 800,
	}, overrides || {});
	// Stub mínimo de document: alcanza para los componentes que miden #holder
	// (mapLegend.vue) sin necesidad de jsdom. Por defecto no encuentra nada,
	// como si #holder no existiera en el momento del montaje.
	globalThis.document = { getElementById() { return null; } };
	return segMap;
}

// Objeto cuyos métodos se crean a demanda y registran sus invocaciones.
export function makeCallRecorder() {
	const calls = [];
	return new Proxy({ calls }, {
		get(target, prop) {
			if (prop === 'calls') {
				return calls;
			}
			return function (...args) { calls.push({ method: prop, args }); };
		},
	});
}

let nextId = 1000;

export function makeValueLabel(overrides) {
	return Object.assign({
		Id: nextId++,
		Name: 'Categoría',
		Visible: true,
		FillColor: '#ff0000',
		Symbol: null,
		Values: null,
	}, overrides);
}

export function makeVariable(overrides) {
	const base = {
		Id: nextId++,
		Name: 'Variable',
		Visible: true,
		IsSimpleCount: false,
		IsCategorical: false,
		IsSequence: false,
		IsGap: false,
		HasTotals: true,
		NormalizationScale: 100,
		Normalization: 'población',
		Decimals: 0,
		Pattern: 0,
		CustomPattern: '',
		Opacity: 'M',
		GradientOpacity: 'M',
		ShowDescriptions: 0,
		ShowValues: 0,
		ShowPerimeter: 0,
		ValueLabels: null,
		Comparable: false,
	};
	const variable = Object.assign(base, overrides);
	if (variable.ValueLabels === null) {
		variable.ValueLabels = [makeValueLabel({ Name: 'Sí' }), makeValueLabel({ Name: 'No' })];
	}
	return variable;
}

export function makeLevel(overrides) {
	const base = {
		Id: nextId++,
		Name: 'Nivel',
		MinZoom: 0,
		MaxZoom: 20,
		Pinned: false,
		HasArea: true,
		HasDescriptions: true,
		SelectedVariableIndex: 0,
		Variables: null,
		Dataset: { Type: 'D', AreSegments: false, ShowInfo: true, Marker: null, Id: nextId++ },
		Partitions: null,
		GeographyId: nextId++,
	};
	const level = Object.assign(base, overrides);
	if (level.Variables === null) {
		level.Variables = [makeVariable()];
	}
	return level;
}

export function makeVersion(overrides) {
	const base = {
		Version: { Id: nextId++, Name: '2020' },
		Work: { Id: nextId++, Icons: [] },
		Levels: null,
		SelectedLevelIndex: 0,
		SelectedMultiLevelIndex: 0,
		LabelsCollapsed: false,
	};
	const version = Object.assign(base, overrides);
	if (version.Levels === null) {
		version.Levels = [makeLevel()];
	}
	return version;
}

export function makeMetricProperties(overrides) {
	const base = {
		Metric: { Id: nextId++, Name: 'Indicador de prueba', Signature: 'sig' },
		Versions: null,
		SelectedVersionIndex: 0,
		SelectedUrbanity: 'N',
		SelectedPartition: null,
		SummaryMetric: 'N',
		Visible: true,
		Comparable: false,
		AllowRowPercent: false,
	};
	const properties = Object.assign(base, overrides);
	if (properties.Versions === null) {
		properties.Versions = [makeVersion()];
	}
	return properties;
}

// Árbol con la forma nativa de GetFabIndicators / GetFabBoundaries:
// categorías con Items = lista de sub-ramas | lista de hojas | diccionario.
export function makeCatalogTree() {
	return [
		{
			Id: 1, Name: 'Población', Icon: 'fas fa-users',
			Items: [
				{ Id: 11, Name: 'Censos', Icon: 'fas fa-list', Items: [
					{ Id: 111, Name: 'Población total', Code: 'P01' },
					{ Id: 112, Name: 'Población migrante', Code: 'P02' },
				] },
				{ Id: 12, Name: 'Proyecciones', Icon: 'fas fa-chart-line', Items: [
					{ Id: 121, Name: 'Proyección 2030', Code: 'P30' },
				] },
			],
		},
		{
			Id: 2, Name: 'Límites políticos', Icon: 'fas fa-draw-polygon',
			Items: [
				{ Id: 21, Name: 'Provincias', VersionId: 5, Items: [
					{ Id: 211, Name: 'Buenos Aires' },
					{ Id: 212, Name: 'Córdoba' },
				] },
				{ Id: 22, Name: 'Departamentos', VersionId: 6, Items: [
					{ Id: 221, Name: 'Tandil', Items: undefined, Parent: 'Buenos Aires' },
				] },
			],
		},
		{
			// Formato anterior: diccionario { agrupador: hojas[] }.
			Id: 3, Name: 'Educación',
			Items: { 'INDEC': [{ Id: 311, Name: 'Analfabetismo' }], 'Ministerio': [{ Id: 321, Name: 'Matrícula' }] },
		},
	];
}

export function mountLite(component, options) {
	options = options || {};
	const instance = {
		$emit(event, ...args) { instance.$emitted.push({ event, args }); },
		$emitted: [],
		$set(obj, key, value) { obj[key] = value; },
		$nextTick(cb) { if (cb) cb(); },
		$refs: {},
		$el: { querySelector() { return null; } },
		// Plugin vue-mobile-detection (main.js): disponible en cualquier
		// componente vía this.$isMobile(). Por defecto false; se sobreescribe
		// con options.isMobile cuando el test necesita simular pantalla chica.
		$isMobile() { return !!(options && options.isMobile); },
	};
	// Props: defaults del componente pisados por los provistos.
	const props = component.props || {};
	for (const name of Object.keys(props)) {
		const def = props[name].default;
		instance[name] = (typeof def === 'function') ? def() : def;
	}
	Object.assign(instance, options.props || {});
	// Data.
	if (component.data) {
		Object.assign(instance, component.data.call(instance));
	}
	Object.assign(instance, options.data || {});
	// Methods bindeados.
	for (const name of Object.keys(component.methods || {})) {
		instance[name] = component.methods[name].bind(instance);
	}
	// Computed como getters sin caché. Admite tanto la forma función (solo
	// lectura) como { get, set } (usada por mapLegend.minimized).
	for (const name of Object.keys(component.computed || {})) {
		const definition = component.computed[name];
		if (typeof definition === 'function') {
			Object.defineProperty(instance, name, {
				get: definition.bind(instance),
				configurable: true,
			});
		} else {
			Object.defineProperty(instance, name, {
				get: definition.get.bind(instance),
				set: definition.set ? definition.set.bind(instance) : undefined,
				configurable: true,
			});
		}
	}
	return instance;
}
