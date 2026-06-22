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

		<!-- Fila media: Variable (sub-control) -->
		<div class="metric-variable-section">
			<variable-selector
				:level="getCurrentLevel()"
				:normalization-caption="normalizationCaption"
				@select="selectVariable"
				@open-change="onChildPanelOpen" />
		</div>

		<!-- Fila inferior: Controles -->
			<div class="metric-footer">

				<div class="footer-right">

					<!-- Nivel (solo lectura) -->
					<span class="level-display">Nivel: {{ currentLevelName }}</span>

					<!-- Selector de versión (sub-control: single/multi) -->
					<version-selector
						:metric="metric"
						@select="selectVersion"
						@toggle-multi="toggleVersionMulti"
						@toggle-mode="toggleMultiVersionMode"
						@open-change="onChildPanelOpen" />

					<!-- Selector de categorías (sub-control: single/multi con cortes) -->
					<categories-selector
						:metric="metric"
						:variable="getCurrentVariable()"
						@toggle-label="toggleLabel"
						@toggle-total="toggleTotalInVersion"
						@toggle-all="toggleAllInVersion"
						@open-change="onChildPanelOpen" />

					<!-- Selector de tipo de métrica (sub-control) -->
					<metric-mode-selector
						:metric="metric"
						:variable="getCurrentVariable()"
						@change="onModeChange"
						@cycle="cycleSummaryMetric"
						@open-change="onChildPanelOpen" />

				</div>
			</div>
		</div>
</template>

<script>
	import h from '@/map/js/helper';
	import MetricModeSelector from '@/table/components/MetricModeSelector.vue';
	import VariableSelector from '@/table/components/VariableSelector.vue';
	import VersionSelector from '@/table/components/VersionSelector.vue';
	import CategoriesSelector from '@/table/components/CategoriesSelector.vue';

	export default {
		name: 'MetricHeader',
		components: { MetricModeSelector, VariableSelector, VersionSelector, CategoriesSelector },

		props: {
			metric: {
				type: Object,
				required: true
			},
			// Si true, una métrica nueva normalizable arranca en modo 'I' (incidencia)
			// aunque el backend haya traído 'N'. Se aplica una sola vez por métrica.
			preferIncidenceMode: {
				type: Boolean,
				default: true
			}
		},

		data() {
			return {
				// Cantidad de sub-controles (hijos) con su panel abierto.
				childPanelsOpen: 0
			};
		},

		watch: {
			// Avisa al contenedor cuando se abre/cierra cualquier dropdown, para que
			// pueda liberar el overflow del scroll mientras el panel flota.
			anyPanelOpen(open) {
				this.$emit('panel-open', open);
			}
		},

		computed: {
			// True si cualquier dropdown del header (propio o de un sub-control) está abierto.
			anyPanelOpen() {
				return this.childPanelsOpen > 0;
			},
			// Métricas de resumen disponibles para ciclar. getValidMetrics ya
			// contempla HasArea del nivel seleccionado y devuelve la lista
			// que corresponde al indicador y la variable.
			availableSummaryMetrics() {
				var variable = this.getCurrentVariable();
				return this.metric.getValidMetrics ? this.metric.getValidMetrics(variable) : [];
			},
			// Sufijo de normalización para la descripción (p. ej. "/ km²", "/1M"),
			// solo relevante en modos normalizados.
			normalizationCaption() {
				var sm = this.metric.properties.SummaryMetric;
				if (sm !== 'I') return '';
				var cap = h.ResolveNormalizationCaption(this.getCurrentVariable(), false);
				return (cap && cap !== '%') ? cap : '';
			},
			// Estado multi-versión.
			isMultiVersion() {
				return !!this.metric.properties.MultiVersion;
			},
			currentLevelName() {
				var l = this.getCurrentLevel();
				return l ? l.Name : '—';
			},
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
			// El modo inicial se fija una sola vez por métrica (el header puede
			// remontarse en cada re-render del thead; sin esta guarda pisaría la
			// elección del usuario en cada remonte).
			if (!this.metric.properties._summaryInitialized) {
				if (this.metric.SelectedVariable().IsSimpleCount || this.metric.SelectedVariable().IsCategorical) {
					this.metric.properties.SummaryMetric = 'N';
				} else if (this.preferIncidenceMode) {
					// Para variables normalizables conviene arrancar mostrando el valor
					// normalizado (incidencia: %, /1k, etc.) y no el conteo crudo, aun
					// cuando el backend haya traído 'N'. Solo si 'I' es un modo válido.
					var hasIncidence = this.availableSummaryMetrics.some(function (m) { return m.Key === 'I'; });
					if (hasIncidence) this.metric.properties.SummaryMetric = 'I';
				}
				this.metric.properties._summaryInitialized = true;
			}
			// Si el modo de resumen inicial no está entre los disponibles (p. ej.
			// arranca en densidad/área, aún no calculables, o en un código no
			// soportado que se vería como '?'), se usa el primero disponible.
			this.ensureAvailableSummaryMetric();
		},

		beforeDestroy() {
			// Si el header se destruye con un panel (de un hijo) abierto, avisa el
			// cierre para que el contenedor no quede con el overflow liberado de más.
			if (this.anyPanelOpen) {
				this.$emit('panel-open', false);
			}
		},

		methods: {
			// Un sub-control (hijo) abrió o cerró su panel.
			onChildPanelOpen(open) {
				this.childPanelsOpen += open ? 1 : -1;
				if (this.childPanelsOpen < 0) this.childPanelsOpen = 0;
			},

			// El sub-control de modo eligió un modo: se aplica y se notifica.
			onModeChange(key) {
				this.metric.properties.SummaryMetric = key;
				this.emitSelectionChanged('Value');
			},

			// Cambia a single-versión (vieja semántica). Mantiene categorías por nombre.
			selectVersion(newIndex) {
				var oldVersion = this.getCurrentVersion();
				var oldVersionId = oldVersion.Version.Id;
				var oldLevel = this.getCurrentLevel();
				var oldVariable = this.getCurrentVariable();

				this.metric.properties.SelectedVersionIndex = newIndex;
				this.metric.properties.SelectedVersionIndices = [newIndex];
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

				// Rematch de categorías por nombre desde la versión anterior.
				var newVersionId = this.getCurrentVersion().Version.Id;
				if (this.metric.RematchSelectedLabelsByName && newVersionId !== oldVersionId) {
					this.metric.RematchSelectedLabelsByName(oldVersionId, newVersionId);
				}

				this.emitSelectionChanged('Version');
			},

			// Toggle del switch "Elegir varios": pasa entre single y multi-versión.
			toggleMultiVersionMode() {
				var props = this.metric.properties;
				if (props.MultiVersion) {
					// Volver a single: deja activa solo la primera de las múltiples.
					var idxs = props.SelectedVersionIndices || [props.SelectedVersionIndex];
					props.MultiVersion = false;
					props.SelectedVersionIndex = idxs[0];
					props.SelectedVersionIndices = [idxs[0]];
				} else {
					// Pasar a multi: arranca con la versión actual seleccionada.
					props.MultiVersion = true;
					props.SelectedVersionIndices = [props.SelectedVersionIndex];
				}
				// Asegura entradas de SelectedLabelIds para cada versión activa.
				this._ensureLabelsForActiveVersions();
				this.emitSelectionChanged('MultiVersion');
			},

			// Toggle de una versión específica en modo multi.
			toggleVersionMulti(index) {
				var props = this.metric.properties;
				if (!props.MultiVersion) return;
				var idxs = (props.SelectedVersionIndices || []).slice();
				var pos = idxs.indexOf(index);
				if (pos >= 0) {
					idxs.splice(pos, 1);   // se permite quedar sin ninguna activa
				} else {
					idxs.push(index);
					idxs.sort(function (a, b) { return a - b; });
					// Al activar una versión nueva, invalida los datos cacheados de su
					// nivel para forzar una carga fresca. Sin esto, un Items residual de
					// un estado previo hace que la columna aparezca con guiones hasta
					// desmarcar y volver a marcar.
					this._invalidateVersionData(index);
				}
				props.SelectedVersionIndices = idxs;
				// La "principal" es la primera de las activas; si no hay ninguna, se
				// conserva un índice válido (0) para que getCurrentVersion no falle,
				// aunque no se generen columnas.
				props.SelectedVersionIndex = idxs.length ? idxs[0] : 0;
				this._ensureLabelsForActiveVersions();
				this.emitSelectionChanged('Version');
			},

			// Limpia el cache de datos (Items) de todos los niveles de una versión,
			// para que el próximo refresh vuelva a pedirlos al servidor.
			_invalidateVersionData(versionIndex) {
				var v = this.metric.properties.Versions[versionIndex];
				if (!v || !v.Levels) return;
				for (var i = 0; i < v.Levels.length; i++) {
					if (v.Levels[i]) v.Levels[i].Items = null;
				}
			},

			// Para cada versión activa, garantiza que SelectedLabelIds tenga una
			// entrada. El nivel y variable de la versión activa se rematchean por
			// nombre desde la principal. Las categorías también se rematchean por
			// nombre desde la versión principal, para que al activar una nueva
			// edición no aparezca vacía si comparte cortes con la principal.
			_ensureLabelsForActiveVersions() {
				var props = this.metric.properties;
				props.SelectedLabelIds = props.SelectedLabelIds || {};
				var mainVersion = props.Versions[props.SelectedVersionIndex];
				if (!mainVersion) return;
				var mainVersionId = mainVersion.Version.Id;
				var mainLevel = mainVersion.Levels[mainVersion.SelectedLevelIndex];
				var mainVariable = mainLevel ? mainLevel.Variables[mainLevel.SelectedVariableIndex] : null;
				var idxs = props.SelectedVersionIndices || [];
				for (var i = 0; i < idxs.length; i++) {
					var v = props.Versions[idxs[i]];
					if (!v) continue;
					// Rematch nivel y variable por nombre.
					if (mainLevel) {
						var li = this.findLevelByName(v, mainLevel.Name);
						if (li !== -1) v.SelectedLevelIndex = li;
					}
					var lvl = v.Levels[v.SelectedLevelIndex];
					if (lvl && mainVariable) {
						var ai = this.findVariableByName(lvl, mainVariable.Name);
						if (ai !== -1) lvl.SelectedVariableIndex = ai;
					}
					var vId = v.Version.Id;
					if (!props.SelectedLabelIds[vId]) {
						// Sin entrada previa: rematchea por nombre desde la principal
						// si es otra versión; si es la principal, default solo Total.
						if (vId !== mainVersionId && this.metric.RematchSelectedLabelsByName) {
							this.metric.RematchSelectedLabelsByName(mainVersionId, vId);
						}
						if (!props.SelectedLabelIds[vId]) {
							props.SelectedLabelIds[vId] = { labels: [], includeTotal: true };
						}
					}
				}
			},

			// ── Categorías (mutaciones; las consultas de lectura viven en el sub-control) ──

			isVersionAllSelected(versionId) {
				var version = this._findVersionById(versionId);
				if (!version) return false;
				var level = version.Levels[version.SelectedLevelIndex];
				if (!level) return false;
				var variable = level.Variables[level.SelectedVariableIndex];
				if (!variable) return false;
				var labels = (variable.ValueLabels || []).filter(function (l) { return l.Visible; });
				var sel = (this.metric.properties.SelectedLabelIds || {})[versionId];
				if (!sel) return false;
				if (!sel.includeTotal) return false;
				for (var i = 0; i < labels.length; i++) {
					if (sel.labels.indexOf(labels[i].Id) === -1) return false;
				}
				return labels.length > 0;
			},

			toggleLabel(versionId, labelId) {
				var props = this.metric.properties;
				props.SelectedLabelIds = props.SelectedLabelIds || {};
				if (!props.SelectedLabelIds[versionId]) {
					props.SelectedLabelIds[versionId] = { labels: [], includeTotal: true };
				}
				var sel = props.SelectedLabelIds[versionId];
				var labels = (sel.labels || []).slice();
				var pos = labels.indexOf(labelId);
				if (pos >= 0) labels.splice(pos, 1);
				else labels.push(labelId);
				sel.labels = labels;
				// Vue 2 reactividad: forzar la asignación del objeto entero.
				this.$set(props.SelectedLabelIds, versionId, { labels: sel.labels, includeTotal: sel.includeTotal });
				this.emitSelectionChanged('Categories');
			},

			toggleTotalInVersion(versionId) {
				var props = this.metric.properties;
				props.SelectedLabelIds = props.SelectedLabelIds || {};
				if (!props.SelectedLabelIds[versionId]) {
					props.SelectedLabelIds[versionId] = { labels: [], includeTotal: true };
				}
				var sel = props.SelectedLabelIds[versionId];
				this.$set(props.SelectedLabelIds, versionId, { labels: sel.labels || [], includeTotal: !(sel.includeTotal !== false) });
				this.emitSelectionChanged('Categories');
			},

			// Toggle todas las categorías de una versión + total.
			toggleAllInVersion(versionId) {
				var props = this.metric.properties;
				var version = this._findVersionById(versionId);
				if (!version) return;
				var level = version.Levels[version.SelectedLevelIndex];
				if (!level) return;
				var variable = level.Variables[level.SelectedVariableIndex];
				if (!variable) return;
				var labels = (variable.ValueLabels || []).filter(function (l) { return l.Visible; });
				var allSelected = this.isVersionAllSelected(versionId);
				props.SelectedLabelIds = props.SelectedLabelIds || {};
				if (allSelected) {
					this.$set(props.SelectedLabelIds, versionId, { labels: [], includeTotal: true });
				} else {
					this.$set(props.SelectedLabelIds, versionId, {
						labels: labels.map(function (l) { return l.Id; }),
						includeTotal: true
					});
				}
				this.emitSelectionChanged('Categories');
			},

			_findVersionById(versionId) {
				var versions = this.metric.properties.Versions || [];
				for (var i = 0; i < versions.length; i++) {
					if (versions[i].Version.Id === versionId) return versions[i];
				}
				return null;
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

			selectVariable(index) {
				var currentLevel = this.getCurrentLevel();
				if (!currentLevel) return;
				currentLevel.SelectedVariableIndex = index;
				// Si hay multi-versión, propagar por nombre a las otras activas.
				if (this.isMultiVersion) {
					var name = currentLevel.Variables[index].Name;
					var props = this.metric.properties;
					var idxs = props.SelectedVersionIndices || [];
					for (var i = 0; i < idxs.length; i++) {
						var v = props.Versions[idxs[i]];
						if (!v || v === this.getCurrentVersion()) continue;
						var lvl = v.Levels[v.SelectedLevelIndex];
						if (!lvl) continue;
						var ai = this.findVariableByName(lvl, name);
						if (ai !== -1) lvl.SelectedVariableIndex = ai;
					}
				}
				this.emitSelectionChanged('Variable');
			},

			getCurrentVersion() {
				var versions = this.metric.properties.Versions || [];
				if (!versions.length) return null;
				var idx = this.metric.properties.SelectedVersionIndex;
				if (idx == null || idx < 0 || idx >= versions.length) {
					idx = 0;
				}
				return versions[idx] || null;
			},

			getCurrentLevel() {
				var version = this.getCurrentVersion();
				if (!version || !version.Levels || !version.Levels.length) return null;
				var idx = version.SelectedLevelIndex;
				if (idx === undefined || idx === null || idx < 0 || idx >= version.Levels.length) {
					idx = 0;
				}
				return version.Levels[idx] || null;
			},

			getCurrentVariable() {
				var level = this.getCurrentLevel();
				if (!level || !level.Variables || !level.Variables.length) return null;
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

			// Cicla el modo de resumen al siguiente disponible.
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
				var ver = this.getCurrentVersion();
				var lvl = this.getCurrentLevel();
				this.$emit('selection-changed', {
					metric: this.metric,
					changeType: type,
					selectedVersionIndex: this.metric.properties.SelectedVersionIndex,
					selectedLevelIndex: ver ? ver.SelectedLevelIndex : 0,
					selectedVariableIndex: lvl ? lvl.SelectedVariableIndex : 0,
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
