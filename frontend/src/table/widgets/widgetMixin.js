/**
 * widgetMixin.js — contrato común de los widgets de análisis.
 *
 * Todo widget de análisis (Resumen, Distribución, Relaciones, Agrupamientos) usa
 * este mixin. Le da:
 *   - la prop `dataset` (la vista plana de resultados de la pivot, pivot.Dataset)
 *     y la `config` con la que arranca
 *   - estado derivado de disponibilidad de datos (vacío por columnas / por filas / listo)
 *   - emisión de cambios de config para que el Dashboard los persista
 *
 * El dataset se lo pasa el Dashboard por prop: cada widget pertenece a la única
 * pivot del tablero y consume su dataset directamente, sin intermediarios.
 */

export default {
	props: {
		dataset: { type: Object, default: null },
		config: { type: Object, default: function () { return {}; } }
	},

	data: function () {
		return {
			// Copia local de la config para editar sin mutar la prop; los cambios
			// se emiten al Dashboard vía 'config-changed'.
			localConfig: JSON.parse(JSON.stringify(this.config || {}))
		};
	},

	computed: {
		// Cambia en cada RefreshData; los widgets la observan para recomputar sin
		// comparaciones profundas.
		datasetVersion: function () {
			return this.dataset ? this.dataset.version : -1;
		},
		measureColumns: function () {
			if (!this.dataset) return [];
			return this.dataset.columns.filter(function (c) { return c.role === 'measure'; });
		},
		dataRows: function () {
			if (!this.dataset || typeof this.dataset.dataRows !== 'function') return [];
			return this.dataset.dataRows();
		},
		// Estado de disponibilidad, para que cada widget muestre el vacío adecuado.
		//   'initializing' -> la pivot todavía no produjo su dataset
		//   'no-columns'   -> hay dataset pero no hay indicadores
		//   'no-rows'      -> hay columnas pero ninguna fila de datos
		//   'ready'        -> hay con qué trabajar
		availability: function () {
			if (!this.dataset) return 'initializing';
			if (!this.measureColumns.length) return 'no-columns';
			if (!this.dataRows.length) return 'no-rows';
			return 'ready';
		}
	},

	methods: {
		updateConfig: function (patch) {
			this.localConfig = Object.assign({}, this.localConfig, patch);
			this.$emit('config-changed', this.localConfig);
		},
		requestClose: function () {
			this.$emit('close');
		},
		emptyMessage: function () {
			switch (this.availability) {
				case 'initializing':
					return 'Cargando datos…';
				case 'no-columns':
					return 'Para ver este análisis debe haber indicadores en la tabla.';
				case 'no-rows':
					return 'Para ver este análisis debe haber delimitaciones en la tabla.';
				default:
					return '';
			}
		}
	}
};
