<template>
	<div>
		<div class="btn-group">
			<button v-for="pattern in range(patterns, 0, 3)" :key="pattern.Key" type="button"
							@click="$emit('change', pattern.Key)" class="btn btn-default btn-xs" :class="isActive(pattern.Key)">
				{{ pattern.Caption }}
			</button>
		</div>
		<div class="btn-group" style="margin-top: 5px" v-if="range(patterns, 4, 20).length > 0">
			<button v-for="pattern in range(patterns, 4, 20)" :key="pattern.Key" type="button"
							@click="$emit('change', pattern.Key)" class="btn btn-default btn-xs" :class="isActive(pattern.Key)">
				{{ pattern.Caption }}
			</button>
		</div>
	</div>
</template>

<script>
// Botonera de selección de trama, extraída de metricCustomize.vue para
// reutilizarla también en boundaryCustomize.vue (con una lista de patrones
// distinta y más corta). El activo se resuelve igual que
// ActiveMetric.getValidPatterns/metricCustomize.vue: customPattern manda si
// no es '', si no se usa defaultPattern.
export default {
	name: 'patternButtons',
	props: [
		'patterns',
		'customPattern',
		'defaultPattern',
	],
	methods: {
		range(col, from, to) {
			var ret = [];
			for (var n = 0; n < col.length; n++) {
				if (n >= from && n <= to) {
					ret.push(col[n]);
				}
			}
			return ret;
		},
		isActive(key) {
			if (key === this.customPattern ||
				(this.customPattern === '' && key === this.defaultPattern)) {
				return ' active';
			}
			return '';
		},
	},
};
</script>
