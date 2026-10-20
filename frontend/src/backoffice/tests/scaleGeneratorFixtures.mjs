// Fábricas compartidas por las suites de ScaleGenerator: una variable con la
// forma mínima que espera el servidor y un dataset doble que registra las
// grabaciones.
export const MAX_VALUE = 9999999217;

export function makeValue(caption, value, order) {
	return { Id: null, Caption: caption, Visible: true, Value: value, FillColor: null, Symbol: null, LineColor: null, Order: order };
}

export function makeVariable(symbologyOverrides, overrides) {
	const variable = {
		Id: 1,
		Data: 'N',
		DataColumn: null,
		Normalization: null,
		NormalizationColumn: null,
		NormalizationScale: 1,
		GapData: null,
		GapDataColumn: null,
		GapNormalization: null,
		GapNormalizationColumn: null,
		FilterValue: null,
		AutoRounding: false,
		IsGap: false,
		Values: [],
		Symbology: Object.assign({
			Id: 7,
			CutMode: 'J',
			Categories: '3',
			CutColumn: null,
			SequenceColumn: null,
			IsSequence: 'N',
			PaletteType: 'G',
			ColorFrom: '000000',
			ColorTo: 'ffffff',
			Rainbow: 0,
			RainbowReverse: false,
			CustomColors: '[]',
			Round: '0',
			PendingPaste: null,
		}, symbologyOverrides),
	};
	return Object.assign(variable, overrides);
}

export function makeDataset(overrides) {
	const dataset = {
		properties: { Id: 42, Type: 'R' },
		MetricVersionLevels: [],
		Labels: null,
		updated: [],
		UpdateVariable(level, variable) {
			dataset.updated.push({ level: level, variable: variable });
			return Promise.resolve();
		},
		GetColumnFromVariable(name) {
			return { Id: 99, Variable: name };
		},
	};
	return Object.assign(dataset, overrides);
}

export function captions(variable) {
	return variable.Values.map(function (value) { return value.Caption; });
}

export function valuesOf(variable) {
	return variable.Values.map(function (value) { return value.Value; });
}
