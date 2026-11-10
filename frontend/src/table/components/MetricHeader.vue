<template>
	<div class="metric-header measure-selector">
		<div class="metric-header-top">
			<span class="metric-name" :title="metricName">{{ metricName }}</span>
			<button v-if="removable" class="mp-icon-btn mp-icon-btn--sm mp-icon-btn--dismiss metric-remove" @click="handleRemove" title="Quitar indicador" aria-label="Quitar indicador">×</button>
		</div>

		<div class="metric-measure">
			<span ref="variableAnchor" class="metric-measure-text" :class="{ 'is-choice': hasVariableChoices }" :title="measureTooltip"
						@click.stop="openMenu('variable', 'variableAnchor', hasVariableChoices)">{{ currentVariableName }}<span v-if="normalizationCaption" class="metric-measure-norm"> {{ normalizationCaption }}</span><span v-if="hasVariableChoices" class="metric-measure-arrow">▾</span></span>
			<span ref="modeAnchor" class="metric-measure-mode" :class="{ 'is-choice': hasModeChoices }" :title="currentModeCaption"
						@click.stop="openMenu('mode', 'modeAnchor', hasModeChoices)"><span v-html="modeBadgeHtml"></span><span v-if="hasModeChoices" class="metric-measure-arrow">▾</span></span>
		</div>

		<div v-if="open" class="measure-panel floating" :style="floatStyle">
			<div v-if="menuKind === 'variable'" class="measure-section">
				<div v-for="(name, index) in variableNames"
						 :key="'variable-' + index"
						 class="measure-option"
						 :class="{ 'active': name === currentVariableName }"
						 @click="selectVariable(name)">{{ name }}</div>
			</div>
			<div v-else class="measure-section">
				<div v-for="opt in modeOptions"
						 :key="'mode-' + opt.key"
						 class="measure-option measure-mode-option"
						 :class="{ 'active': opt.key === currentModeKey }"
						 @click="selectMode(opt.key)">
					<span class="measure-option-symbol" v-html="opt.symbol"></span>
					<span class="measure-option-caption">{{ opt.caption }}</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
	import h from '@/map/js/helper';
	import { valueHeader, valueHeaderForKey } from '@/table/classes/pivotValue.js';
	import floatingDropdown from '@/table/components/floatingDropdown.js';

	/*
	 * MetricHeader — encabezado de un indicador: nombre en la primera línea; variable
	 * y medida (tipo de métrica) en la segunda. Cada una, si tiene alternativas,
	 * lleva su desplegable, que se abre con clic en el propio texto. No muta la
	 * pivot: emite 'selection-changed' y 'metric-removed'.
	 */
	export default {
		name: 'MetricHeader',
		mixins: [floatingDropdown],

		props: {
			metric: { type: Object, required: true },
			// Una variable normalizable nueva arranca en 'I' (incidencia) aunque el
			// backend traiga 'N'. Se aplica una sola vez por métrica.
			preferIncidenceMode: { type: Boolean, default: true },
			removable: { type: Boolean, default: true }
		},

		data() {
			return { menuKind: 'variable' };
		},

		watch: {
			open(isOpen) { this.$emit('panel-open', isOpen); }
		},

		computed: {
			metricName() {
				return this.metric.properties.Metric.Name;
			},
			variableNames() {
				return this.metric.AvailableVariables();
			},
			currentVariableName() {
				return this.metric.variableName() || '';
			},
			// Modos de resumen válidos para la variable/nivel de referencia (todas las
			// selecciones comparten la variable lógica, así que el modo es común).
			availableSummaryMetrics() {
				var variable = this.getCurrentVariable();
				var level = this.getCurrentLevel();
				return this.metric.getValidMetrics ? this.metric.getValidMetrics(variable, level) : [];
			},
			modeOptions() {
				var variable = this.getCurrentVariable();
				var options = [];
				for (var i = 0; i < this.availableSummaryMetrics.length; i++) {
					var mode = this.availableSummaryMetrics[i];
					options.push({ key: mode.Key, symbol: valueHeaderForKey(mode.Key, variable), caption: mode.Caption });
				}
				return options;
			},
			currentModeKey() {
				return this.metric.properties.SummaryMetric;
			},
			currentModeCaption() {
				for (var i = 0; i < this.availableSummaryMetrics.length; i++) {
					if (this.availableSummaryMetrics[i].Key === this.currentModeKey) {
						return this.availableSummaryMetrics[i].Caption;
					}
				}
				return '';
			},
			modeBadgeHtml() {
				return valueHeader(this.metric, this.getCurrentVariable());
			},
			hasVariableChoices() {
				return this.variableNames.length > 1;
			},
			hasModeChoices() {
				return this.modeOptions.length > 1;
			},
			normalizationCaption() {
				if (this.metric.properties.SummaryMetric !== 'I') return '';
				var caption = h.ResolveNormalizationCaption(this.getCurrentVariable(), false);
				if (caption && caption !== '%') {
					return caption;
				}
				return '';
			},
			measureTooltip() {
				var text = this.currentVariableName;
				if (this.normalizationCaption) {
					text += ' ' + this.normalizationCaption;
				}
				if (this.currentModeCaption) {
					text += ' — ' + this.currentModeCaption;
				}
				return text;
			}
		},

		mounted() {
			// El modo inicial se fija una sola vez por métrica (el header puede
			// remontarse en cada re-render del thead).
			if (!this.metric.properties._summaryInitialized) {
				var variable = this.getCurrentVariable();
				if (variable && (variable.IsSimpleCount || variable.IsCategorical)) {
					this.metric.properties.SummaryMetric = 'N';
				} else if (this.preferIncidenceMode && this.hasAvailableMode('I')) {
					this.metric.properties.SummaryMetric = 'I';
				}
				this.metric.properties._summaryInitialized = true;
			}
			this.ensureAvailableSummaryMetric();
		},

		beforeDestroy() {
			if (this.open) this.$emit('panel-open', false);
		},

		methods: {
			rootClass() { return 'measure-selector'; },
			panelWidth() {
				if (this.menuKind === 'mode') return 240;
				return 300;
			},

			// Abre el desplegable de la variable o de la medida desde su texto; un
			// segundo clic sobre el mismo lo cierra.
			openMenu(kind, anchorRef, available) {
				if (!available) return;
				var sameMenu = this.open && this.menuKind === kind;
				if (this.open) this.closePanel();
				if (!sameMenu) {
					this.menuKind = kind;
					this.openPanel(this.$refs[anchorRef]);
				}
			},

			selectVariable(variableName) {
				this.closePanel();
				this.metric.ChangeVariable(variableName);
				this.ensureAvailableSummaryMetric();
				this.emitSelectionChanged('Variable');
			},

			selectMode(key) {
				this.closePanel();
				this.metric.properties.SummaryMetric = key;
				this.emitSelectionChanged('Value');
			},

			// Referencia para la UI (primera selección).
			getCurrentLevel() { return this.metric.referenceLevel(); },
			getCurrentVariable() { return this.metric.referenceVariable(); },

			hasAvailableMode(key) {
				for (var i = 0; i < this.availableSummaryMetrics.length; i++) {
					if (this.availableSummaryMetrics[i].Key === key) return true;
				}
				return false;
			},

			ensureAvailableSummaryMetric() {
				var list = this.availableSummaryMetrics;
				if (!list.length) return;
				if (!this.hasAvailableMode(this.metric.properties.SummaryMetric)) {
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
		width: 100%;
		min-width: 220px;
		position: relative;
		padding: 8px 6px 6px 8px;
		text-align: left;
		color: #fff;
	}

	.metric-header-top {
		display: flex;
		align-items: flex-start;
		gap: 6px;
	}

	.metric-name {
		flex: 1;
		font-size: 14px;
		font-weight: 600;
		line-height: 1.25;
	}

	.metric-remove {
		color: rgba(255, 255, 255, 0.75);
		visibility: hidden;
		margin-right: -5px;
	}
	.metric-header:hover .metric-remove {
		visibility: visible;
	}
	.metric-remove:hover {
		color: #1976d2;
	}

	.metric-measure {
		display: flex;
		align-items: flex-start;
		gap: 6px;
		margin-top: 3px;
		font-size: 12px;
		font-weight: 400;
		line-height: 1.3;
		color: rgba(255, 255, 255, 0.85);
	}
	.metric-measure-text {
		flex: 1;
		white-space: normal;
		word-wrap: break-word;
	}
	.metric-measure-norm {
		color: rgba(255, 255, 255, 0.65);
	}
	.metric-measure-mode {
		font-weight: 600;
		white-space: nowrap;
	}
	.is-choice {
		cursor: pointer;
		border-radius: 3px;
	}
	.is-choice:hover {
		background-color: rgba(0, 0, 0, 0.15);
		color: #fff;
	}
	.metric-measure-arrow {
		margin-left: 4px;
		font-size: 10px;
	}

	.measure-panel {
		background-color: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 4px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		overflow-y: auto;
		text-align: left;
	}
	.measure-option {
		padding: 7px 12px;
		font-size: 13px;
		font-weight: 400;
		color: #424242;
		line-height: 1.35;
		cursor: pointer;
		white-space: normal;
		word-wrap: break-word;
	}
	.measure-option:hover {
		background-color: #f5f5f5;
	}
	.measure-option.active {
		background-color: #e9f2fd;
		color: #1976d2;
	}
	.measure-mode-option {
		display: flex;
		align-items: baseline;
		gap: 8px;
		white-space: nowrap;
	}
	.measure-option-symbol {
		display: inline-block;
		min-width: 38px;
		font-weight: 700;
		color: #1565c0;
	}
	.measure-option-caption {
		color: #455a64;
	}
</style>
