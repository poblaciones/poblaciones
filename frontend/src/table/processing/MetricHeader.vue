<template>
	<div class="metric-header">
		<!-- Fila superior: Título y botón remover -->
		<div class="metric-header-top">
			<div class="metric-title metric-title-sortable" @click="cycleOrder" :title="sortTooltip">
				<span class="metric-name">{{ metric.properties.Metric.Name }}</span>
				<span v-if="sortState === 'desc'" class="sort-arrow">▼</span>
				<span v-else-if="sortState === 'asc'" class="sort-arrow">▲</span>
			</div>
			<button class="metric-remove-btn" @click="handleRemove" title="Remover métrica">
				×
			</button>
		</div>

		<!-- Fila media: Variable -->
		<div class="metric-variable-section">
			<div class="variable-selector">
				<div class="variable-display" @click.stop="toggleVariablesPanel" v-if="hasMultipleVariables()">
					<span class="variable-text">{{ getCurrentVariable().Name }}<span v-if="normalizationCaption" class="variable-norm">{{ normalizationCaption }}</span></span>
					<span class="variable-arrow">▾</span>
				</div>
				<span v-else class="variable-text-single">{{ getCurrentVariable().Name }}<span v-if="normalizationCaption" class="variable-norm">{{ normalizationCaption }}</span></span>
			</div>

			<!-- Panel de variables (más grande para nombres largos) -->
			<div v-if="showVariablesPanel" class="variables-panel">
				<div class="variables-panel-content">
					<div v-for="(variable, index) in getCurrentLevel().Variables"
							 :key="'variable-' + index"
							 class="variable-option"
							 :class="{ 'active': index === getCurrentLevel().SelectedVariableIndex }"
							 @click="selectVariable(index)">
						{{ variable.Name }}
					</div>
				</div>
			</div>
		</div>

		<!-- Fila inferior: Controles -->
		<div class="metric-footer-space">
			&nbsp;</div>
			<div class="metric-footer">

				<div class="footer-right">

					<!-- Nivel (solo lectura) -->
					<span class="level-display">Nivel: {{ getCurrentLevel().Name }}</span>

					<!-- Selector de versión (single select) -->
					<div class="version-selector" v-if="hasMultipleVersions()">
						<div class="version-label-wrapper" @click.stop="toggleVersionsDropdown">
							<span class="version-text">{{ getCurrentVersion().Version.Name }}</span>
							<span class="version-arrow">▾</span>
						</div>

						<div v-if="showVersionsDropdown" class="version-dropdown">
							<div v-for="(version, index) in metric.properties.Versions"
									 :key="'version-' + index"
									 class="version-option"
									 :class="{ 'active': index === metric.properties.SelectedVersionIndex }"
									 @click="selectVersion(index)">
								{{ version.Version.Name }}
							</div>
						</div>
					</div>
					<span v-else class="version-text-single">{{ getCurrentVersion().Version.Name }}</span>

					<div class="value-selector" @click.stop="cycleSummaryMetric" :title="currentMetric ? currentMetric.Title : ''">
						<span class="value-badge" v-html="valueHeaderHtml"></span>
					</div>

				</div>
			</div>
		</div>
</template>

<script>
	import { valueHeader } from './pivotValue.js';
	import h from '@/map/js/helper';

	export default {
		name: 'MetricHeader',

		props: {
			metric: {
				type: Object,
				required: true
			},
			// Dirección de orden de esta columna ('desc' | 'asc' | null), provista por el pivot.
			sortState: {
				type: String,
				default: null
			}
		},

		data() {
			return {
				showVersionsDropdown: false,
				showVariablesPanel: false,
				handleClickOutside: null
			};
		},

		computed: {
			sortTooltip() {
				if (this.sortState === 'desc') return 'Orden de mayor a menor (clic para invertir)';
				if (this.sortState === 'asc') return 'Orden de menor a mayor (clic para quitar)';
				return 'Ordenar de mayor a menor';
			},
			// Métricas de resumen disponibles para ciclar. Se excluyen los modos que
			// dependen de superficie (área, distribución de área, densidad), no
			// calculables hasta que la celda reciba la suma de Km2.
			availableSummaryMetrics() {
				var variable = this.getCurrentVariable();
				var valid = this.metric.getValidMetrics ? this.metric.getValidMetrics(variable) : [];
				var excluded = { K: true, H: true, A: true, D: true };
				return valid.filter(function (m) { return !excluded[m.Key]; });
			},
			// Métrica de resumen actual dentro de las disponibles.
			currentMetric() {
				var list = this.availableSummaryMetrics;
				for (var n = 0; n < list.length; n++) {
					if (list[n].Key === this.metric.properties.SummaryMetric) return list[n];
				}
				return list.length ? list[0] : null;
			},
			// Encabezado del modo actual (N, %, etc.).
			valueHeaderHtml() {
				return valueHeader(this.metric, this.getCurrentVariable());
			},
			// Sufijo de normalización para la descripción (p. ej. "/ km²", "/1M"),
			// solo relevante en modos normalizados.
			normalizationCaption() {
				var sm = this.metric.properties.SummaryMetric;
				if (sm !== 'I') return '';
				var cap = h.ResolveNormalizationCaption(this.getCurrentVariable(), false);
				return (cap && cap !== '%') ? cap : '';
			}
		},

		mounted() {
			if (this.metric.properties.SelectedVersionIndex === undefined ||
				this.metric.properties.SelectedVersionIndex === null) {
				this.metric.properties.SelectedVersionIndex = 0;
			}

			if (this.metric.properties.SelectedVersionIndex >= this.metric.properties.Versions.length) {
				this.metric.properties.SelectedVersionIndex = this.metric.properties.Versions.length - 1;
			}

			if (this.metric.properties.SelectedVersionIndex < 0) {
				this.metric.properties.SelectedVersionIndex = 0;
			}
			if (this.metric.SelectedVariable().IsSimpleCount || this.metric.SelectedVariable().IsCategorical) {
				this.metric.properties.SummaryMetric = 'N';
			}
			// Si el modo de resumen inicial no está entre los disponibles (p. ej.
			// arranca en densidad/área, aún no calculables, o en un código no
			// soportado que se vería como '?'), se usa el primero disponible.
			this.ensureAvailableSummaryMetric();

			var loc = this;
			this.handleClickOutside = function (event) {
				var clickedInside = false;
				var target = event.target;

				while (target) {
					if (target.classList && (
						target.classList.contains('version-selector') ||
						target.classList.contains('variables-panel') ||
						target.classList.contains('variable-display')
					)) {
						clickedInside = true;
						break;
					}
					target = target.parentElement;
				}

				if (!clickedInside) {
					loc.closeAllDropdowns();
				}
			};

			document.addEventListener('click', this.handleClickOutside);
		},

		beforeDestroy() {
			if (this.handleClickOutside) {
				document.removeEventListener('click', this.handleClickOutside);
			}
		},

		methods: {
			closeAllDropdowns() {
				this.showVersionsDropdown = false;
				this.showVariablesPanel = false;
			},

			hasMultipleVersions() {
				return this.metric.properties.Versions && this.metric.properties.Versions.length > 1;
			},

			hasMultipleVariables() {
				var level = this.getCurrentLevel();
				return level && level.Variables && level.Variables.length > 1;
			},

			toggleVersionsDropdown() {
				this.showVersionsDropdown = !this.showVersionsDropdown;
				this.showVariablesPanel = false;
			},

			selectVersion(newIndex) {
				var oldVersion = this.getCurrentVersion();
				var oldLevel = this.getCurrentLevel();
				var oldVariable = this.getCurrentVariable();

				this.metric.properties.SelectedVersionIndex = newIndex;
				var newVersion = this.getCurrentVersion();

				var matchedLevelIndex = this.findLevelByName(newVersion, oldLevel.Name);
				if (matchedLevelIndex !== -1) {
					newVersion.SelectedLevelIndex = matchedLevelIndex;
					var newLevel = newVersion.Levels[matchedLevelIndex];

					var matchedVariableIndex = this.findVariableByName(newLevel, oldVariable.Name);
					if (matchedVariableIndex !== -1) {
						newLevel.SelectedVariableIndex = matchedVariableIndex;
					} else {
						newLevel.SelectedVariableIndex = 0;
					}
				} else {
					newVersion.SelectedLevelIndex = 0;
					newVersion.Levels[0].SelectedVariableIndex = 0;
				}

				this.showVersionsDropdown = false;
				this.emitSelectionChanged('Version');
			},

			findLevelByName(version, levelName) {
				for (var i = 0; i < version.Levels.length; i++) {
					if (version.Levels[i].Name === levelName) {
						return i;
					}
				}
				return -1;
			},

			findVariableByName(level, variableName) {
				for (var i = 0; i < level.Variables.length; i++) {
					if (level.Variables[i].Name === variableName) {
						return i;
					}
				}
				return -1;
			},

			toggleVariablesPanel() {
				this.showVariablesPanel = !this.showVariablesPanel;
				this.showVersionsDropdown = false;
			},

			closeVariablesPanel() {
				this.showVariablesPanel = false;
			},

			selectVariable(index) {
				var currentLevel = this.getCurrentLevel();
				currentLevel.SelectedVariableIndex = index;
				this.showVariablesPanel = false;
				this.emitSelectionChanged('Variable');
			},

			// Clic en el título: cicla el orden de esta columna (lo resuelve el pivot).
			cycleOrder() {
				this.$emit('order-changed', { metric: this.metric });
			},

			getCurrentVersion() {
				var idx = this.metric.properties.SelectedVersionIndex;
				if (idx < 0 || idx >= this.metric.properties.Versions.length) {
					idx = 0;
				}
				return this.metric.properties.Versions[idx];
			},

			getCurrentLevel() {
				var version = this.getCurrentVersion();
				var idx = version.SelectedLevelIndex;
				if (idx === undefined || idx === null || idx < 0 || idx >= version.Levels.length) {
					idx = 0;
				}
				return version.Levels[idx];
			},

			getCurrentVariable() {
				var level = this.getCurrentLevel();
				var idx = level.SelectedVariableIndex;
				if (idx === undefined || idx === null || idx < 0 || idx >= level.Variables.length) {
					idx = 0;
				}
				return level.Variables[idx];
			},

			// Garantiza que el modo de resumen actual sea uno disponible.
			ensureAvailableSummaryMetric() {
				var list = this.availableSummaryMetrics;
				if (!list.length) return;
				var current = this.metric.properties.SummaryMetric;
				var ok = list.some(function (m) { return m.Key === current; });
				if (!ok) this.metric.properties.SummaryMetric = list[0].Key;
			},

			// Cicla el modo de resumen al siguiente disponible (excluye modos de área).
			cycleSummaryMetric() {
				var list = this.availableSummaryMetrics;
				if (!list.length) return;
				var idx = 0;
				for (var n = 0; n < list.length; n++) {
					if (list[n].Key === this.metric.properties.SummaryMetric) { idx = n; break; }
				}
				var next = list[(idx + 1) % list.length];
				this.metric.properties.SummaryMetric = next.Key;
				this.emitSelectionChanged('Value');
			},

			handleRemove() {
				this.$emit('metric-removed', this.metric);
			},

			emitSelectionChanged(type) {
				this.$emit('selection-changed', {
					metric: this.metric,
					changeType: type,
					selectedVersionIndex: this.metric.properties.SelectedVersionIndex,
					selectedLevelIndex: this.getCurrentVersion().SelectedLevelIndex,
					selectedVariableIndex: this.getCurrentLevel().SelectedVariableIndex,
					summaryMetric: this.metric.properties.SummaryMetric
				});
			}
		},

		watch: {
			'metric.properties.Versions': {
				handler() {
					if (this.metric.properties.SelectedVersionIndex >= this.metric.properties.Versions.length) {
						this.metric.properties.SelectedVersionIndex = 0;
					}
				},
				deep: true
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
		padding: 10px 14px;
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
	}

	.variable-selector {
		display: flex;
		align-items: flex-start;
		gap: 8px;
	}

	.variable-label {
		font-size: 12px;
		color: #757575;
		font-weight: 500;
		padding-top: 6px;
		flex-shrink: 0;
	}

	.variable-display {
		flex: 1;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 6px 10px;
		background-color: #f5f5f5;
		border: 1px solid #e0e0e0;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s ease;
		min-height: 32px;
	}

		.variable-display:hover {
			background-color: #eeeeee;
			border-color: #bdbdbd;
		}

	.variable-text {
		font-size: 13px;
		color: #424242;
		flex: 1;
		white-space: normal;
		word-wrap: break-word;
		line-height: 1.3;
	}

	.variable-text-single {
		font-size: 13px;
		color: #424242;
		flex: 1;
		white-space: normal;
		word-wrap: break-word;
		line-height: 1.3;
	}

	.variable-norm {
		color: #9e9e9e;
		font-weight: 400;
		margin-left: 2px;
	}

	.variable-arrow {
		color: #757575;
		font-size: 10px;
		margin-left: 8px;
		margin-top: 2px;
		flex-shrink: 0;
	}

	.variables-panel {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		margin-top: 3px;
		background-color: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 4px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
		z-index: 1000;
	}

	.variables-panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px 12px;
		border-bottom: 1px solid #e0e0e0;
		background-color: #f9f9f9;
		font-size: 13px;
		font-weight: 500;
		color: #424242;
	}

	.panel-close-btn {
		background: none;
		border: none;
		color: #757575;
		font-size: 20px;
		cursor: pointer;
		padding: 0;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: all 0.2s ease;
	}

		.panel-close-btn:hover {
			background-color: #e0e0e0;
			color: #424242;
		}

	.variables-panel-content {
		max-height: 300px;
		overflow-y: auto;
	}

	.variable-option {
		padding: 10px 12px;
		cursor: pointer;
		font-size: 13px;
		color: #424242;
		line-height: 1.4;
		transition: background-color 0.15s ease;
		white-space: normal;
		word-wrap: break-word;
	}

		.variable-option:hover {
			background-color: #f5f5f5;
		}

		.variable-option.active {
			background-color: #e3f2fd;
			color: #1976d2;
			font-weight: 500;
		}
	.metric-footer-space {
	}
	.metric-footer {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 10px;
		position: absolute;
		bottom: 10px;
		right: 0px;
		left: 0px;
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

	.value-selector {
		cursor: pointer;
		transition: transform 0.2s ease;
	}

		.value-selector:hover {
			transform: scale(1.05);
		}

	.value-badge {
		display: inline-block;
		padding: 3px 10px;
		background-color: #2196f3;
		color: white;
		border-radius: 12px;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.5px;
	}

	.version-selector {
		position: relative;
	}

	.version-label-wrapper {
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

		.version-label-wrapper:hover {
			background-color: #eeeeee;
			border-color: #bdbdbd;
		}

	.version-text {
		font-size: 12px;
		color: #424242;
	}

	.version-text-single {
		font-size: 12px;
		color: #424242;
	}

	.version-arrow {
		color: #757575;
		font-size: 10px;
	}

	.version-dropdown {
		position: absolute;
		right: 0;
		margin-bottom: 4px;
		background-color: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 4px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
		z-index: 1000;
		min-width: 100px;
	}

	.version-option {
		padding: 8px 12px;
		cursor: pointer;
		font-size: 12px;
		color: #424242;
		transition: background-color 0.15s ease;
		white-space: nowrap;
	}

		.version-option:hover {
			background-color: #f5f5f5;
		}

		.version-option.active {
			background-color: #e3f2fd;
			color: #1976d2;
			font-weight: 500;
		}

	.level-display {
		font-size: 12px;
		color: #757575;
		white-space: nowrap;
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

	.variables-panel-content::-webkit-scrollbar {
		width: 6px;
	}

	.variables-panel-content::-webkit-scrollbar-track {
		background: #f5f5f5;
	}

	.variables-panel-content::-webkit-scrollbar-thumb {
		background: #bdbdbd;
		border-radius: 3px;
	}

		.variables-panel-content::-webkit-scrollbar-thumb:hover {
			background: #9e9e9e;
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
