// Doble de colorbrewer con tres familias reducidas (una por tipo de paleta) y
// pocas clases, suficiente para ejercitar la elección de colores por posición.
const schemes = {
	Blues: {
		3: ['#deebf7', '#9ecae1', '#3182bd'],
		4: ['#eff3ff', '#bdd7e7', '#6baed6', '#2171b5'],
		5: ['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'],
	},
	RdBu: {
		3: ['#ef8a62', '#f7f7f7', '#67a9cf'],
		4: ['#ca0020', '#f4a582', '#92c5de', '#0571b0'],
	},
	Set1: {
		3: ['#e41a1c', '#377eb8', '#4daf4a'],
		4: ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3'],
	},
};

schemes.schemeGroups = {
	sequential: ['Blues'],
	diverging: ['RdBu'],
	qualitative: ['Set1'],
};

module.exports = { default: schemes };
