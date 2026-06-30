<!--
  CategoryPicker.vue — contenido del selector de categorías de un indicador, por
  versión. Encapsula la lista de etiquetas con su check, el "Total" y el toggle de
  "todas" por versión, operando directamente sobre las Selections del metric.

  Es el mismo control que aparece en el encabezado de la pivot y en los gráficos de
  distribución; se extrajo a un componente para no duplicarlo. El componente solo
  muta metric.Selections y emite 'change'; cada consumidor decide cómo refrescar
  (la pivot llama a handleChange; el widget re-renderiza y avisa al contenedor).

  No incluye el contenedor flotante ni el posicionamiento: eso lo provee el
  consumidor, que ya tiene su propia lógica de anclaje.
-->
<template>
	<div class="cat-picker">
		<div v-for="grp in groups" :key="'cg-' + grp.versionId" class="ifp-group">
			<div class="ifp-group-header" @click.stop="toggleAll(grp.versionId)">
				<input type="checkbox" tabindex="-1" :checked="grp.allSelected" @click.prevent />
				<span class="ifp-group-title">{{ grp.versionName }}</span>
			</div>
			<div v-for="lbl in grp.labels" :key="'cl-' + grp.versionId + '-' + lbl.Id"
					class="ifp-option" @click.stop="toggleLabel(grp.versionId, lbl.Id)">
				<input type="checkbox" tabindex="-1" :checked="grp.selectedLabels.indexOf(lbl.Id) !== -1" @click.prevent />
				<span>{{ lbl.Name }}</span>
			</div>
			<div class="ifp-option ifp-total" @click.stop="toggleTotal(grp.versionId)">
				<input type="checkbox" tabindex="-1" :checked="grp.includeTotal" @click.prevent />
				<span>Total</span>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	name: 'CategoryPicker',
	props: {
		// Indicador del modelo de la pivot (ActiveMultiselectedMetric): se leen y
		// mutan sus Selections (labels e includeTotal por versión).
		metric: { type: Object, default: null },
		// Si se indica, el selector muestra solo esa versión (el corte de control es
		// metric+versión): el grupo de esa versión, con su cabecera como "Todos".
		// Si es null, muestra todas las versiones (cabecera = nombre de cada año).
		versionId: { type: [Number, String], default: null },
		// Cambia con cada refresh de datos; se lee para recomputar los grupos cuando
		// el metric muta en el lugar sin cambiar de referencia.
		tick: { type: [Number, String], default: 0 }
	},
	data: function () {
		// Contador propio: las Selections del metric no son reactivas para Vue, así
		// que tras mutarlas se incrementa esto para forzar el recálculo de groups (y
		// que el tilde del checkbox cambie en el acto, sin esperar el refresco de datos).
		return { localTick: 0 };
	},
	computed: {
		// Un grupo por versión (o solo la indicada por versionId), con sus etiquetas
		// visibles, las seleccionadas y el estado del total y del "todas".
		groups() {
			this.tick; this.localTick;
			var m = this.metric;
			if (!m || !m.Selections) return [];
			var only = this.versionId;
			var single = only != null;
			/* eslint-disable-next-line eqeqeq */
			var sels = single ? m.Selections.filter(function (s) { return s.versionId() == only; }) : m.Selections;
			return sels.map(function (sel) {
				var labels = sel.variable.ValueLabels.filter(function (l) { return l.Visible; });
				var allSelected = sel.includeTotal && labels.length > 0 &&
					labels.every(function (l) { return sel.labels.indexOf(l.Id) !== -1; });
				return {
					versionId: sel.versionId(),
					// Con una sola versión, la cabecera "Todos" basta (seleccionar todo en
					// un clic); con varias, se distingue por el nombre del año.
					versionName: single ? 'Todos' : sel.versionName(),
					labels: labels,
					selectedLabels: sel.labels,
					includeTotal: sel.includeTotal,
					allSelected: allSelected
				};
			});
		}
	},
	methods: {
		_selectionFor(versionId) {
			var m = this.metric;
			if (!m) return null;
			return m.Selections.filter(function (s) { return s.versionId() === versionId; })[0] || null;
		},
		toggleLabel(versionId, labelId) {
			var sel = this._selectionFor(versionId);
			if (!sel) return;
			if (sel.labels.indexOf(labelId) >= 0) sel.labels = sel.labels.filter(function (id) { return id !== labelId; });
			else sel.labels = sel.labels.concat(labelId);
			this.localTick++;
			this.$emit('change', this.metric);
		},
		toggleTotal(versionId) {
			var sel = this._selectionFor(versionId);
			if (!sel) return;
			sel.includeTotal = !sel.includeTotal;
			this.localTick++;
			this.$emit('change', this.metric);
		},
		toggleAll(versionId) {
			var sel = this._selectionFor(versionId);
			if (!sel) return;
			var labels = sel.variable.ValueLabels.filter(function (l) { return l.Visible; });
			var allSelected = sel.includeTotal && labels.length > 0 &&
				labels.every(function (l) { return sel.labels.indexOf(l.Id) !== -1; });
			sel.labels = allSelected ? [] : labels.map(function (l) { return l.Id; });
			sel.includeTotal = true;
			this.localTick++;
			this.$emit('change', this.metric);
		}
	}
};
</script>

<style scoped>
	.cat-picker { font-size: 13px; color: #37474f; }
	.ifp-option,
	.ifp-group-header {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 12px;
		cursor: pointer;
		white-space: nowrap;
		text-align: left;
	}
	.ifp-option:hover,
	.ifp-group-header:hover { background-color: #e3f2fd; }
	.ifp-group-header { font-weight: 600; border-top: 1px solid #eceff1; }
	.ifp-group:first-child .ifp-group-header { border-top: none; }
	/* Las categorías cuelgan de su grupo de versión: se indentan para reflejarlo. */
	.ifp-group .ifp-option { padding-left: 28px; }
	.ifp-total { font-style: italic; color: #607d8b; }
	.ifp-option input, .ifp-group-header input { margin: 0; }
</style>
