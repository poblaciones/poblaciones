<template>
	<div class="categories-selector" v-if="hasCategories">
		<div class="categories-label-wrapper" ref="anchor" @click.stop="togglePanel($refs.anchor)">
			<span class="categories-text">{{ label }}</span>
			<span class="categories-arrow">▾</span>
		</div>

		<div v-if="open" class="categories-panel floating" :style="floatStyle">
			<!-- Multi-versión: corte de control por edición -->
			<template v-if="multi">
				<div v-for="vg in byVersion" :key="'vg-' + vg.versionId" class="categories-group">
					<div class="categories-group-header" @click.stop="$emit('toggle-all', vg.versionId)">
						<input type="checkbox" :checked="isAllSelected(vg.versionId)" @click.stop="$emit('toggle-all', vg.versionId)" />
						<span class="categories-group-title">{{ vg.versionName }}</span>
					</div>
					<div v-for="lbl in vg.labels" :key="'cat-' + vg.versionId + '-' + lbl.Id" class="categories-option" @click.stop="$emit('toggle-label', vg.versionId, lbl.Id)">
						<input type="checkbox" :checked="isLabelSelected(vg.versionId, lbl.Id)" @click.stop="$emit('toggle-label', vg.versionId, lbl.Id)" />
						<span>{{ lbl.Name }}</span>
					</div>
					<div class="categories-option categories-option-total" @click.stop="$emit('toggle-total', vg.versionId)">
						<input type="checkbox" :checked="isTotalSelected(vg.versionId)" @click.stop="$emit('toggle-total', vg.versionId)" />
						<span>Total</span>
					</div>
				</div>
			</template>
			<!-- Single-versión: lista plana -->
			<template v-else>
				<div v-for="lbl in currentLabels" :key="'cat-' + lbl.Id" class="categories-option" @click.stop="$emit('toggle-label', currentVersionId, lbl.Id)">
					<input type="checkbox" :checked="isLabelSelected(currentVersionId, lbl.Id)" @click.stop="$emit('toggle-label', currentVersionId, lbl.Id)" />
					<span>{{ lbl.Name }}</span>
				</div>
				<div class="categories-option categories-option-total" @click.stop="$emit('toggle-total', currentVersionId)">
					<input type="checkbox" :checked="isTotalSelected(currentVersionId)" @click.stop="$emit('toggle-total', currentVersionId)" />
					<span>Total</span>
				</div>
			</template>
		</div>
	</div>
</template>

<script>
import floatingDropdown from '@/table/components/floatingDropdown.js';

/*
 * CategoriesSelector — combo de categorías (ValueLabels) de un indicador.
 * Conoce el objeto de negocio (la métrica, sus versiones activas y la selección
 * de categorías por edición): sabe presentar la lista (plana en single, con
 * corte por edición en multi-versión), el Total y el resumen del botón. No muta
 * la métrica: emite 'toggle-label' (versionId, labelId), 'toggle-total'
 * (versionId) y 'toggle-all' (versionId). El padre aplica los cambios sobre
 * SelectedLabelIds con la reactividad correspondiente.
 */
export default {
	name: 'CategoriesSelector',
	mixins: [floatingDropdown],
	props: {
		metric: { type: Object, required: true },
		// Variable de la versión actual (la presentación depende de sus ValueLabels).
		variable: { type: Object, default: null }
	},
	computed: {
		multi() { return !!this.metric.properties.MultiVersion; },
		hasCategories() {
			var v = this.variable;
			return !!(v && v.ValueLabels && v.ValueLabels.length > 1);
		},
		currentVersionId() {
			var v = this._currentVersion();
			return v && v.Version ? v.Version.Id : null;
		},
		// Categorías visibles de la versión actual (single).
		currentLabels() {
			var v = this.variable;
			return (v && v.ValueLabels) ? v.ValueLabels.filter(function (l) { return l.Visible; }) : [];
		},
		// Agrupación por edición (multi).
		byVersion() {
			var idxs = this.metric.properties.SelectedVersionIndices;
			var versions = this.metric.properties.Versions;
			var out = [];
			for (var i = 0; i < idxs.length; i++) {
				var v = versions[idxs[i]];
				if (!v) continue;
				var level = v.Levels[v.SelectedLevelIndex];
				if (!level) continue;
				var variable = level.Variables[level.SelectedVariableIndex];
				if (!variable) continue;
				out.push({
					versionId: v.Version.Id,
					versionName: v.Version.Name,
					labels: variable.ValueLabels.filter(function (l) { return l.Visible; })
				});
			}
			return out;
		},
		// Resumen del botón: "Total" / "Ninguna" / "Elegir... (n/t)".
		label() {
			var n = 0, t = 0, totalSelected = false;
			var selById = this.metric.properties.SelectedLabelIds;
			var groups = this.multi
				? this.byVersion
				: [{ versionId: this.currentVersionId, labels: this.currentLabels }];
			for (var g = 0; g < groups.length; g++) {
				var grp = groups[g];
				var sel = selById[grp.versionId];
				t += grp.labels.length;
				if (sel) {
					n += (sel.labels ? sel.labels.length : 0);
					if (sel.includeTotal !== false) totalSelected = true;
				}
			}
			if (n === 0 && totalSelected) return 'Total';
			if (n === 0 && !totalSelected) return 'Ninguna';
			return 'Elegir... (' + n + '/' + t + ')';
		}
	},
	methods: {
		rootClass() { return 'categories-selector'; },
		panelWidth() { return 220; },
		_currentVersion() {
			var versions = this.metric.properties.Versions;
			if (!versions.length) return null;
			var idx = this.metric.properties.SelectedVersionIndex;
			if (idx == null || idx < 0 || idx >= versions.length) idx = 0;
			return versions[idx] || null;
		},
		_findVersionById(versionId) {
			var versions = this.metric.properties.Versions;
			for (var i = 0; i < versions.length; i++) {
				if (versions[i].Version.Id === versionId) return versions[i];
			}
			return null;
		},
		isLabelSelected(versionId, labelId) {
			var sel = this.metric.properties.SelectedLabelIds[versionId];
			return !!(sel && sel.labels && sel.labels.indexOf(labelId) !== -1);
		},
		isTotalSelected(versionId) {
			var sel = this.metric.properties.SelectedLabelIds[versionId];
			return !!(sel && sel.includeTotal !== false);
		},
		isAllSelected(versionId) {
			var version = this._findVersionById(versionId);
			if (!version) return false;
			var level = version.Levels[version.SelectedLevelIndex];
			if (!level) return false;
			var variable = level.Variables[level.SelectedVariableIndex];
			if (!variable) return false;
			var labels = variable.ValueLabels.filter(function (l) { return l.Visible; });
			var sel = this.metric.properties.SelectedLabelIds[versionId];
			if (!sel || !sel.includeTotal) return false;
			for (var i = 0; i < labels.length; i++) {
				if (sel.labels.indexOf(labels[i].Id) === -1) return false;
			}
			return labels.length > 0;
		}
	}
};
</script>

<style scoped>
	.categories-selector {
		position: relative;
	}
	.categories-label-wrapper {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 8px;
		background-color: #f5f5f5;
		border: 1px solid #e0e0e0;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	.categories-label-wrapper:hover {
		background-color: #eeeeee;
		border-color: #bdbdbd;
	}
	.categories-text {
		font-size: 12px;
		color: #424242;
		white-space: nowrap;
	}
	.categories-arrow {
		color: #757575;
		font-size: 10px;
	}
	.categories-panel {
		background-color: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 4px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
		z-index: 1000;
		min-width: 220px;
		max-height: 360px;
		overflow-y: auto;
	}
	/* Posición fija calculada por el mixin. */
	.categories-panel.floating {
		position: fixed;
		right: auto;
		top: auto;
		bottom: auto;
		margin: 0;
		width: 220px;
		min-width: 0;
		max-width: 280px;
		overflow-y: auto;
	}
	.categories-group {
		border-bottom: 1px solid #f0f0f0;
	}
	.categories-group:last-child {
		border-bottom: none;
	}
	.categories-group-header {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 12px;
		background-color: #fafafa;
		font-weight: 600;
		font-size: 12px;
		color: #424242;
		cursor: pointer;
		border-bottom: 1px solid #f0f0f0;
	}
	.categories-group-header:hover {
		background-color: #f0f0f0;
	}
	.categories-group-title {
		flex: 1;
	}
	.categories-option {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px 6px 24px;
		font-size: 12px;
		color: #424242;
		cursor: pointer;
	}
	.categories-option:hover {
		background-color: #f5f5f5;
	}
	.categories-option-total {
		font-weight: 600;
		border-top: 1px dashed #e0e0e0;
	}
</style>
