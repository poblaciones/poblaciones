<template>
	<div class="metric-header">
		<!-- Fila superior: Título y botón remover (el título ya no es trigger de sort) -->
		<div class="metric-header-top">
			<div class="metric-title">
				<span class="metric-name">{{ metric.properties.Metric.Name }}</span>
			</div>
			<button class="metric-remove-btn" @click="handleRemove" title="Remover métrica">
				×
			</button>
		</div>

		<!-- Fila media: Variable lógica y modo de medición, juntos -->
		<div class="metric-variable-section">
			<variable-selector
				:metric="metric"
				:normalization-caption="normalizationCaption"
				@select="selectVariable"
				@open-change="onChildPanelOpen" />
			<metric-mode-selector
				:metric="metric"
				:variable="getCurrentVariable()"
				:level="getCurrentLevel()"
				@change="onModeChange"
				@cycle="cycleSummaryMetric"
				@open-change="onChildPanelOpen" />
		</div>
		</div>
</template>

<script>
	import h from '@/map/js/helper';
	import VariableSelector from '@/table/components/VariableSelector.vue';
	import MetricModeSelector from '@/table/components/MetricModeSelector.vue';

	export default {
		name: 'MetricHeader',
		components: { VariableSelector, MetricModeSelector },

		props: {
			metric: { type: Object, required: true },
			// Una variable normalizable nueva arranca en 'I' (incidencia) aunque el
			// backend traiga 'N'. Se aplica una sola vez por métrica.
			preferIncidenceMode: { type: Boolean, default: true }
		},

		data() {
			return { childPanelsOpen: 0 };
		},

		watch: {
			anyPanelOpen(open) { this.$emit('panel-open', open); }
		},

		computed: {
			anyPanelOpen() { return this.childPanelsOpen > 0; },
			// Modos de resumen válidos para la variable/nivel de referencia (todas las
			// selecciones comparten la variable lógica, así que el modo es común).
			availableSummaryMetrics() {
				var variable = this.getCurrentVariable();
				var level = this.getCurrentLevel();
				return this.metric.getValidMetrics ? this.metric.getValidMetrics(variable, level) : [];
			},
			normalizationCaption() {
				if (this.metric.properties.SummaryMetric !== 'I') return '';
				var cap = h.ResolveNormalizationCaption(this.getCurrentVariable(), false);
				return (cap && cap !== '%') ? cap : '';
			},
			isMultiVersion() { return this.metric.isMultiVersion(); }
		},

		mounted() {
			// El modo inicial se fija una sola vez por métrica (el header puede
			// remontarse en cada re-render del thead).
			if (!this.metric.properties._summaryInitialized) {
				var variable = this.getCurrentVariable();
				if (variable && (variable.IsSimpleCount || variable.IsCategorical)) {
					this.metric.properties.SummaryMetric = 'N';
				} else if (this.preferIncidenceMode) {
					var hasIncidence = this.availableSummaryMetrics.some(function (m) { return m.Key === 'I'; });
					if (hasIncidence) this.metric.properties.SummaryMetric = 'I';
				}
				this.metric.properties._summaryInitialized = true;
			}
			this.ensureAvailableSummaryMetric();
		},

		beforeDestroy() {
			if (this.anyPanelOpen) this.$emit('panel-open', false);
		},

		methods: {
			onChildPanelOpen(open) {
				this.childPanelsOpen += open ? 1 : -1;
				if (this.childPanelsOpen < 0) this.childPanelsOpen = 0;
			},

			// ── Variable lógica (gobierna las selecciones) ────────────────────────
			selectVariable(variableName) {
				this.metric.SelectByCaption(variableName);
				this.ensureAvailableSummaryMetric();
				this.emitSelectionChanged('Variable');
			},

			onModeChange(key) {
				this.metric.properties.SummaryMetric = key;
				this.emitSelectionChanged('Value');
			},

			cycleSummaryMetric() {
				var list = this.availableSummaryMetrics;
				if (!list.length) return;
				var idx = 0;
				for (var n = 0; n < list.length; n++) {
					if (list[n].Key === this.metric.properties.SummaryMetric) { idx = n; break; }
				}
				this.metric.properties.SummaryMetric = list[(idx + 1) % list.length].Key;
				this.emitSelectionChanged('Value');
			},

			// ── Referencia para la UI (primera selección) ─────────────────────────
			getCurrentLevel() { return this.metric.referenceLevel(); },
			getCurrentVariable() { return this.metric.referenceVariable(); },

			ensureAvailableSummaryMetric() {
				var list = this.availableSummaryMetrics;
				if (!list.length) return;
				var current = this.metric.properties.SummaryMetric;
				if (!list.some(function (m) { return m.Key === current; })) {
					this.metric.properties.SummaryMetric = list[0].Key;
				}
			},

			handleRemove() { this.$emit('metric-removed', this.metric); },

			emitSelectionChanged(type) {
				this.$emit('selection-changed', {
					metric: this.metric,
					changeType: type,
					summaryMetric: this.metric.properties.SummaryMetric
				});
			}
		}
	};
</script>

<style scoped>
	.metric-header {
		background-color: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		height: 100%;
		width: 100%;
		min-width: 300px;
		position: relative;
		padding: 10px 14px 0;
		margin-bottom: 12px;
		box-shadow: 0 2px 4px rgba(0,0,0,0.05);
		transition: box-shadow 0.2s ease;
	}

		.metric-header:hover {
			box-shadow: 0 3px 8px rgba(0,0,0,0.1);
		}

	.metric-header-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}

	.metric-title {
		flex: 1;
	}

	.metric-name {
		font-size: 15px;
		font-weight: 600;
		color: #1976d2;
	}

	.metric-remove-btn {
		background: none;
		border: none;
		color: #9e9e9e;
		font-size: 24px;
		line-height: 1;
		cursor: pointer;
		padding: 0;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: all 0.2s ease;
	}

		.metric-remove-btn:hover {
			background-color: #ffebee;
			color: #d32f2f;
		}

	.metric-variable-section {
		position: relative;
		margin-bottom: 8px;
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: nowrap;
	}

	.metric-footer {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 10px;
		margin-top: 13px;
	}

	.footer-left {
		display: flex;
		align-items: center;
	}

	.footer-right {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 12px;
	}

	.metric-title-sortable {
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.metric-title-sortable:hover .metric-name {
		text-decoration: underline;
	}
	.sort-arrow {
		font-size: 11px;
		color: #1976d2;
	}

	@media (max-width: 768px) {
		.metric-header {
			padding: 8px 10px;
		}

		.metric-name {
			font-size: 14px;
		}

		.footer-right {
			font-size: 11px;
			gap: 6px;
		}
	}
</style>
