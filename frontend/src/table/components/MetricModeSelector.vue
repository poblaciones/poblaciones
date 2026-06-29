<template>
	<div class="summary-selector mode-selector">
		<div class="summary-label-wrapper" ref="anchor" :title="currentCaption">
			<span class="value-badge" @click.stop="$emit('cycle')" title="Cambiar al siguiente modo"><span v-html="badgeHtml"></span></span>
			<span class="summary-arrow" @click.stop="togglePanel($refs.anchor)" title="Elegir modo">▾</span>
		</div>

		<div v-if="open" class="summary-dropdown floating" :style="floatStyle">
			<div v-for="opt in options"
					 :key="'sm-' + opt.key"
					 class="summary-option"
					 :class="{ 'active': opt.key === currentKey }"
					 @click="choose(opt.key)">
				<span class="summary-option-symbol" v-html="opt.symbol"></span>
				<span class="summary-option-dash">—</span>
				<span class="summary-option-caption">{{ opt.caption }}</span>
			</div>
		</div>
	</div>
</template>

<script>
import { valueHeader, valueHeaderForKey } from '@/table/classes/pivotValue.js';
import floatingDropdown from '@/table/components/floatingDropdown.js';

/*
 * MetricModeSelector — combo del tipo de métrica (modo de resumen) de un
 * indicador. Conoce el objeto de negocio (la métrica y su variable): sabe pedir
 * los modos válidos, dibujar el badge del modo actual y listar las opciones con
 * sus símbolos. No muta la métrica: emite 'change' (key elegida) y 'cycle'.
 */
export default {
	name: 'MetricModeSelector',
	mixins: [floatingDropdown],
	props: {
		metric: { type: Object, required: true },
		variable: { type: Object, default: null },
		level: { type: Object, default: null }
	},
	computed: {
		// Modos de resumen válidos para esta métrica/variable/nivel.
		validModes() {
			return this.metric.getValidMetrics ? this.metric.getValidMetrics(this.variable, this.level) : [];
		},
		currentKey() {
			return this.metric.properties.SummaryMetric;
		},
		currentMode() {
			var list = this.validModes, key = this.currentKey;
			for (var i = 0; i < list.length; i++) if (list[i].Key === key) return list[i];
			return list.length ? list[0] : null;
		},
		currentCaption() {
			return this.currentMode ? this.currentMode.Caption : '';
		},
		// Badge del modo actual (N, %, etc.) tal como va en el encabezado.
		badgeHtml() {
			return valueHeader(this.metric, this.variable);
		},
		// Opciones del combo: cada modo con su símbolo y descripción.
		options() {
			var variable = this.variable;
			return this.validModes.map(function (m) {
				return { key: m.Key, symbol: valueHeaderForKey(m.Key, variable), caption: m.Caption };
			});
		}
	},
	methods: {
		rootClass() { return 'mode-selector'; },
		panelWidth() { return 220; },
		choose(key) {
			this.closePanel();
			this.$emit('change', key);
		}
	}
};
</script>

<style scoped>
	.summary-selector {
		position: relative;
	}
	.summary-label-wrapper {
		display: flex;
		align-items: stretch;
		gap: 0;
		padding: 0;
		background-color: #2196f3;
		border-radius: 12px;
		overflow: hidden;
		transition: background-color 0.15s ease;
	}
	.summary-label-wrapper:hover {
		background-color: #1976d2;
	}
	.summary-arrow {
		display: flex;
		align-items: center;
		color: rgba(255,255,255,0.85);
		font-size: 10px;
		padding: 0 8px 0 4px;
		cursor: pointer;
		border-left: 1px solid rgba(255,255,255,0.25);
	}
	.summary-arrow:hover {
		background-color: rgba(0,0,0,0.12);
	}
	.value-badge {
		display: inline-flex;
		align-items: center;
		padding: 3px 6px 3px 10px;
		color: white;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.5px;
		white-space: nowrap;
		cursor: pointer;
	}
	.value-badge:hover {
		background-color: rgba(0,0,0,0.12);
	}
	.summary-dropdown {
		background-color: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 4px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
		z-index: 1000;
		min-width: 200px;
		overflow: hidden;
	}
	.summary-option {
		display: flex;
		align-items: baseline;
		gap: 6px;
		padding: 7px 12px;
		font-size: 12px;
		color: #424242;
		cursor: pointer;
		white-space: nowrap;
	}
	.summary-option:hover {
		background-color: #f5f5f5;
	}
	.summary-option.active {
		background-color: #e3f2fd;
	}
	.summary-option-symbol {
		display: inline-block;
		min-width: 38px;
		font-weight: 700;
		color: #1565c0;
	}
	.summary-option-dash {
		color: #b0bec5;
	}
	.summary-option-caption {
		color: #455a64;
	}
</style>
