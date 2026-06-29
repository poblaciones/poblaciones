// Fixture de un indicador con DOS censos (versiones) que NO coinciden del todo,
// para ejercitar el modelo multi-selección. Refleja la estructura real de
// `properties`: Versions[] → Levels[] → Variables[] → ValueLabels[].
//
// Censo 2010: niveles Provincias (geog G10P) y Departamentos (geog G10D).
//   - "NBI" (categórica) está en AMBOS niveles.
//   - "Discapacidad" (categórica) está SOLO en Departamentos.
// Censo 2022: niveles Provincias (geog G22P) y Radios (geog G22R).
//   - "NBI" está SOLO en Provincias.
//   - "Discapacidad" NO existe en 2022.
//
// Esto fuerza: oferta de años por variable lógica (NBI en ambos; Discapacidad
// solo 2010), geographies distintos por censo, y niveles no coincidentes.

function label(id, name) { return { Id: id, Name: name }; }

function variable(id, name, labelDefs) {
	return {
		Id: id, Name: name,
		IsCategorical: labelDefs.length > 0, IsSimpleCount: false,
		ValueLabels: labelDefs.map(function (d) { return label(d[0], d[1]); }),
		SelectedVariableIndex: 0
	};
}

function level(id, name, geographyId, variables) {
	return {
		Id: id, Name: name, GeographyId: geographyId,
		Dataset: { Type: 'D', AreSegments: false },
		Variables: variables, SelectedVariableIndex: 0
	};
}

function version(id, name, levels) {
	return {
		Version: { Id: id, Name: name },
		Work: { Id: 'W' + id },
		Levels: levels, SelectedLevelIndex: 0, SelectedVariableIndex: 0
	};
}

// Variables (instancias físicas por censo/nivel; misma variable lógica = mismo Name).
function nbi(idBase) {
	return variable(idBase, 'Hogares con NBI', [[idBase + 1, 'Con NBI'], [idBase + 2, 'Sin NBI']]);
}
function discapacidad(idBase) {
	return variable(idBase, 'Población con discapacidad', [[idBase + 1, 'Con dis.'], [idBase + 2, 'Sin dis.']]);
}

export function makeMultiVersionProperties() {
	var v2010 = version('2010', '2010', [
		level('L10P', 'Provincias', 'G10P', [nbi(1010)]),
		level('L10D', 'Departamentos', 'G10D', [nbi(1020), discapacidad(1030)])
	]);
	var v2022 = version('2022', '2022', [
		level('L22P', 'Provincias', 'G22P', [nbi(2210)]),
		level('L22R', 'Radios', 'G22R', [nbi(2220)])
	]);

	return {
		Metric: { Id: 7, Name: 'Censo' },
		SummaryMetric: 'P',          // incidencia / %
		Versions: [v2010, v2022],
		SelectedVersionIndex: 0,
		SelectedLabelIds: {}
	};
}

export default { makeMultiVersionProperties };
