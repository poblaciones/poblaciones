<template>
	<div class="categories-selector" v-if="hasCategories">
		<div class="categories-label-wrapper" ref="anchor" @click.stop="togglePanel($refs.anchor)">
			<span class="categories-arrow">▾</span>
		</div>

		<div v-if="open" class="categories-panel floating" :style="floatStyle">
			<div v-for="grp in groups" :key="'vg-' + grp.versionId" class="categories-group">
				<div class="categories-group-header" @click.stop="$emit('toggle-all', grp.versionId)">
					<input type="checkbox" tabindex="-1" :checked="grp.allSelected" @click.prevent />
					<span class="categories-group-title">{{ grp.versionName }}</span>
				</div>
				<div v-for="lbl in grp.labels" :key="'cat-' + grp.versionId + '-' + lbl.Id" class="categories-option" @click.stop="$emit('toggle-label', grp.versionId, lbl.Id)">
					<input type="checkbox" tabindex="-1" :checked="grp.selectedLabels.indexOf(lbl.Id) !== -1" @click.prevent />
					<span>{{ lbl.Name }}</span>
				</div>
				<div class="categories-option categories-option-total" @click.stop="$emit('toggle-total', grp.versionId)">
					<input type="checkbox" tabindex="-1" :checked="grp.includeTotal" @click.prevent />
					<span>Total</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import floatingDropdown from '@/table/components/floatingDropdown.js';

/*
 * CategoriesSelector — combo de categorías del indicador, por censo. Cada
 * Selection (censo) aporta su variable y su selección de labels/total. Emite
 * 'toggle-label' (versionId, labelId), 'toggle-total' (versionId) y 'toggle-all'
 * (versionId); el padre los aplica sobre la Selection correspondiente.
 */
export default {
	name: 'CategoriesSelector',
	mixins: [floatingDropdown],
	props: {
		metric: { type: Object, required: true }
	},
	computed: {
		// Hay categorías si alguna selección tiene variable con más de un label.
		hasCategories() {
			return this.metric.Selections.some(function (s) {
				return s.variable.ValueLabels && s.variable.ValueLabels.length > 1;
			});
		},
		// Un grupo por censo (Selection) con sus labels y su estado.
		groups() {
			return this.metric.Selections.map(function (sel) {
				var labels = sel.variable.ValueLabels.filter(function (l) { return l.Visible; });
				var allSelected = sel.includeTotal && labels.length > 0 &&
					labels.every(function (l) { return sel.labels.indexOf(l.Id) !== -1; });
				return {
					versionId: sel.versionId(),
					versionName: sel.versionName(),
					labels: labels,
					selectedLabels: sel.labels,
					includeTotal: sel.includeTotal,
					allSelected: allSelected
				};
			});
		},
		label() {
			var n = 0, t = 0, totalSelected = false;
			this.groups.forEach(function (g) {
				t += g.labels.length;
				n += g.selectedLabels.length;
				if (g.includeTotal) totalSelected = true;
			});
			if (n === 0 && totalSelected) return 'Total';
			if (n === 0 && !totalSelected) return 'Ninguna';
			return 'Elegir... (' + n + '/' + t + ')';
		}
	},
	methods: {
		rootClass() { return 'categories-selector'; },
		panelWidth() { return 220; }
	}
};
</script>

<style scoped>
	.categories-selector {
		display: inline-flex;
	}
	.categories-label-wrapper {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 0;
		background: none;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}
	.categories-label-wrapper:hover {
		background-color: #2499ef;
	}
	.categories-arrow {
		color: #ffffff;
		font-size: 18px;
		line-height: 1;
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
