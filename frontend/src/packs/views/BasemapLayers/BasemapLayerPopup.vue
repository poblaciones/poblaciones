<template>
	<div>
		<invoker ref="invoker"></invoker>
		<metric-search-popup ref="metricSearch" @selected="addMetric" />
		<md-dialog v-if="layer" class="mp-dialog-md" :md-active.sync="activateEdit" :md-click-outside-to-close="true">
			<md-dialog-title>Capa base</md-dialog-title>
			<md-dialog-content>
				<md-tabs md-dynamic-height>
					<md-tab id="basemap-tab-general" md-label="General">
						<div class="md-layout md-gutter">
							<div class="md-layout-item md-size-50">
								<mp-simple-text label="Nombre" ref="inputName" :canEdit="canEdit"
																helper="Nombre a mostrar en el panel de capas del mapa"
																v-model="layer.Caption" @enter="save" />
							</div>
							<div class="md-layout-item md-size-50">
								<mp-simple-text label="Ícono" :canEdit="canEdit"
																helper="Clase de Font Awesome, por ejemplo fas fa-road (opcional)"
																v-model="layer.Icon" @enter="save" />
							</div>
							<div class="md-layout-item md-size-50" v-if="hasRouteTag">
								<mp-simple-text label="Identificador en parámetro de la URL" :canEdit="canEdit" :maxlength="1"
																helper="Letra minúscula que identifica la capa en la URL del mapa (única)"
																v-model="layer.RouteTag" @enter="save" />
							</div>
							<div class="md-layout-item md-size-50" v-if="isMetric">
								<md-switch class="md-primary" :disabled="!canEdit" v-model="layer.HasOwnMetadata">Usa metadatos propios</md-switch>
								<div class="mp-label" style="white-space: normal;" v-if="!layer.HasOwnMetadata">
									Se usan los metadatos de la cartografía que publica el indicador.
								</div>
							</div>
							<div class="md-layout-item md-size-100" v-if="isRaster || isLabels">
								<div class="mp-label" style="white-space: normal;">
									Los metadatos de esta capa son propios y se editan desde el listado, con la acción Metadatos.
								</div>
							</div>
							<div class="md-layout-item md-size-100" v-if="isBoundary">
								<div class="mp-label" style="white-space: normal;">
									Se usan los metadatos de la última versión de la delimitación.
								</div>
							</div>

							<div class="md-layout-item md-size-100">
								<div class="full-row-separator">Tipo</div>
							</div>
							<div class="md-layout-item md-size-100" style="display: inline-flex;">
								<md-radio v-for="option in visibleTypeOptions" :key="option.value" v-model="layer.Type" class="md-primary"
													:value="option.value" :disabled="!canEdit">{{ option.caption }}</md-radio>
							</div>

							<template v-if="isMetric">
								<div class="md-layout-item md-size-100">
									<div class="full-row-separator">Indicadores</div>
								</div>
								<div class="md-layout-item md-size-100" v-if="canEdit">
									<md-button @click="openMetricSearch">
										<md-icon>add_circle_outline</md-icon>
										Agregar indicador
									</md-button>
								</div>
								<div class="md-layout-item md-size-100">
									<div v-if="metricItems.length === 0" class="mp-label" style="white-space: normal;">
										Aún no se eligieron indicadores.
									</div>
									<md-list v-else class="items-list">
										<md-list-item v-for="item in metricItems" :key="item.Id">
											<span class="md-list-item-text">{{ item.Caption }}</span>
											<md-button v-if="canEdit" class="md-icon-button md-list-action" @click="removeMetric(item)">
												<md-icon>delete</md-icon>
												<md-tooltip md-direction="left">Quitar indicador</md-tooltip>
											</md-button>
										</md-list-item>
									</md-list>
								</div>
							</template>

							<template v-if="isBoundary">
								<div class="md-layout-item md-size-100">
									<div class="full-row-separator">Delimitación</div>
								</div>
								<div class="md-layout-item md-size-100">
									<md-field>
										<label>Delimitación</label>
										<md-select v-model="boundaryId" :disabled="!canEdit">
											<md-option v-for="boundary in boundaries" :key="boundary.Id" :value="boundary.Id">{{ boundary.Caption }}</md-option>
										</md-select>
									</md-field>
									<div class="mp-label" style="white-space: normal;">
										Siempre se muestra la última versión de la delimitación.
									</div>
								</div>
							</template>
						</div>
					</md-tab>

					<md-tab id="basemap-tab-appearance" md-label="Apariencia">
						<div class="md-layout md-gutter">
							<template v-if="isMetric">
								<div class="md-layout-item md-size-100">
									<div class="full-row-separator">Línea</div>
								</div>
								<div class="md-layout-item md-size-50">
									<mp-simple-text label="Grosor de línea" :canEdit="canEdit" type="number"
																	v-model="layer.LineWidth" @enter="save" />
								</div>
								<div class="md-layout-item md-size-50">
									<md-switch class="md-primary" :disabled="!canEdit" v-model="layer.DynamicWidth">Grosor según el zoom</md-switch>
									<md-switch class="md-primary" :disabled="!canEdit" v-model="layer.DashedLine">Línea punteada</md-switch>
								</div>

								<div class="md-layout-item md-size-100">
									<div class="full-row-separator">Etiquetas</div>
								</div>
								<div class="md-layout-item md-size-100" style="display: inline-flex;">
									<md-radio v-model="layer.LabelsMode" class="md-primary" value="L" :disabled="!canEdit">Color claro</md-radio>
									<md-radio v-model="layer.LabelsMode" class="md-primary" value="S" :disabled="!canEdit">Mismo color</md-radio>
									<md-radio v-model="layer.LabelsMode" class="md-primary" value="N" :disabled="!canEdit">Sin etiquetas</md-radio>
								</div>
								<div class="md-layout-item md-size-100">
									<div class="mp-label" style="white-space: normal;">
										Abreviaturas: reemplazan el texto indicado en las etiquetas de la capa.
									</div>
									<md-table v-if="aliasRows.length > 0" class="aliases-table">
										<md-table-row v-for="(row, index) in aliasRows" :key="index">
											<md-table-cell>
												<md-field>
													<md-input v-model="row.Text" placeholder="Texto" :disabled="!canEdit" />
												</md-field>
											</md-table-cell>
											<md-table-cell>
												<md-field>
													<md-input v-model="row.Alias" placeholder="Abreviatura" :disabled="!canEdit" />
												</md-field>
											</md-table-cell>
											<md-table-cell v-if="canEdit">
												<md-button class="md-icon-button" @click="removeAlias(index)">
													<md-icon>delete</md-icon>
													<md-tooltip md-direction="left">Quitar abreviatura</md-tooltip>
												</md-button>
											</md-table-cell>
										</md-table-row>
									</md-table>
									<md-button v-if="canEdit" @click="addAlias">
										<md-icon>add_circle_outline</md-icon>
										Agregar abreviatura
									</md-button>
								</div>
							</template>

							<template v-if="isRaster">
								<div class="md-layout-item md-size-100">
									<div class="full-row-separator">Raster</div>
								</div>
								<div class="md-layout-item md-size-100">
									<mp-simple-text label="URL de teselas" :canEdit="canEdit" :maxlength="500"
																	helper="Debe incluir los marcadores {z}, {x} e {y}"
																	v-model="layer.RasterUrl" @enter="save" />
								</div>
								<div class="md-layout-item md-size-33">
									<mp-simple-text label="Zoom nativo máximo" :canEdit="canEdit" type="number"
																	v-model="layer.RasterMaxNativeZoom" @enter="save" />
								</div>
								<div class="md-layout-item md-size-33">
									<mp-simple-text label="Zoom máximo" :canEdit="canEdit" type="number"
																	v-model="layer.RasterMaxZoom" @enter="save" />
								</div>
								<div class="md-layout-item md-size-33">
									<mp-simple-text label="Opacidad (0 a 100)" :canEdit="canEdit" type="number"
																	v-model="layer.RasterOpacity" @enter="save" />
								</div>
								<div class="md-layout-item md-size-100">
									<md-switch class="md-primary" :disabled="!canEdit" v-model="layer.RasterTms">Esquema TMS (eje Y invertido)</md-switch>
								</div>
							</template>

							<div class="md-layout-item md-size-100">
								<div class="full-row-separator">Panel de capas</div>
							</div>
							<div class="md-layout-item md-size-100">
								<md-switch class="md-primary" :disabled="!canEdit" v-model="layer.Separator">
									Línea separadora debajo de esta capa
								</md-switch>
								<md-switch v-if="!isLabels" class="md-primary" :disabled="!canEdit" v-model="layer.HideOnSatellite">
									No renderizar sobre el mapa satelital
								</md-switch>
							</div>
						</div>
					</md-tab>
				</md-tabs>
			</md-dialog-content>
			<md-dialog-actions>
				<md-button @click="activateEdit = false">{{ cancelCaption }}</md-button>
				<md-button v-if="canEdit" class="md-primary" @click="save">Guardar</md-button>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>
import f from '@/backoffice/classes/Formatter';
import MetricSearchPopup from './MetricSearchPopup.vue';

const TYPE_OPTIONS = [
	{ value: 'M', caption: 'Indicador' },
	{ value: 'B', caption: 'Delimitación' },
	{ value: 'R', caption: 'Raster' },
	{ value: 'L', caption: 'Etiquetas' },
];

export default {
	name: 'BasemapLayerPopup',
	components: {
		MetricSearchPopup,
	},
	data() {
		return {
			activateEdit: false,
			layer: null,
			layers: [],
			boundaries: [],
			boundaryId: null,
			metricItems: [],
			aliasRows: [],
			typeOptions: TYPE_OPTIONS,
		};
	},
	computed: {
		canEdit() {
			return window.Context.IsAdmin();
		},
		cancelCaption() {
			if (this.canEdit) {
				return 'Cancelar';
			}
			return 'Cerrar';
		},
		isMetric() {
			return this.layer.Type === 'M';
		},
		isBoundary() {
			return this.layer.Type === 'B';
		},
		isRaster() {
			return this.layer.Type === 'R';
		},
		isLabels() {
			return this.layer.Type === 'L';
		},
		hasRouteTag() {
			return this.layer.Type !== 'L';
		},
		labelsLayerTaken() {
			var currentId = this.layer.Id;
			return this.layers.some(function (item) {
				return item.Type === 'L' && item.Id !== currentId;
			});
		},
		// Solo puede haber una capa de etiquetas: si ya existe otra, la opción no se ofrece.
		visibleTypeOptions() {
			var loc = this;
			return this.typeOptions.filter(function (option) {
				if (option.value === 'L') {
					return !loc.labelsLayerTaken;
				}
				return true;
			});
		},
	},
	methods: {
		show(layer, layers) {
			this.layers = layers;
			this.layer = f.clone(layer);
			this.$set(this.layer, 'HasOwnMetadata', !!layer.MetadataId);
			this.metricItems = this.buildMetricItems(layer);
			this.boundaryId = this.parseBoundaryId(layer);
			this.aliasRows = this.parseAliases(layer.Aliases);
			this.activateEdit = true;
			this.loadBoundaries();
			var loc = this;
			setTimeout(() => {
				loc.$refs.inputName.focus();
			}, 100);
		},
		loadBoundaries() {
			var loc = this;
			window.Db.GetBoundaries().then(function (data) {
				loc.boundaries = data.filter(function (item) { return item.Level === 0; });
			});
		},
		parseIds(csv) {
			var ret = [];
			if (!csv) {
				return ret;
			}
			csv.split(',').forEach(function (part) {
				var id = parseInt(part.trim(), 10);
				if (!isNaN(id)) {
					ret.push(id);
				}
			});
			return ret;
		},
		parseBoundaryId(layer) {
			var ids = this.parseIds(layer.ItemIds);
			if (layer.Type === 'B' && ids.length > 0) {
				return ids[0];
			}
			return null;
		},
		// ItemsSummary lista los nombres en el mismo orden que ItemIds.
		buildMetricItems(layer) {
			if (layer.Type !== 'M') {
				return [];
			}
			var ids = this.parseIds(layer.ItemIds);
			var captions = [];
			if (layer.ItemsSummary) {
				captions = layer.ItemsSummary.split('; ');
			}
			var ret = [];
			for (var n = 0; n < ids.length; n++) {
				var caption = '#' + ids[n];
				if (captions.length === ids.length) {
					caption = captions[n];
				}
				ret.push({ Id: ids[n], Caption: caption });
			}
			return ret;
		},
		openMetricSearch() {
			this.$refs.metricSearch.show();
		},
		addMetric(result) {
			var id = parseInt(result.Id, 10);
			var exists = this.metricItems.some(function (item) { return item.Id === id; });
			if (exists === false) {
				this.metricItems.push({ Id: id, Caption: result.Caption });
			}
		},
		removeMetric(item) {
			var index = this.metricItems.indexOf(item);
			if (index !== -1) {
				this.metricItems.splice(index, 1);
			}
		},
		// Las abreviaturas se guardan como un objeto JSON {"Texto": "Abreviatura"}.
		parseAliases(json) {
			var ret = [];
			if (!json) {
				return ret;
			}
			var aliases = JSON.parse(json);
			Object.keys(aliases).forEach(function (text) {
				ret.push({ Text: text, Alias: aliases[text] });
			});
			return ret;
		},
		addAlias() {
			this.aliasRows.push({ Text: '', Alias: '' });
		},
		removeAlias(index) {
			this.aliasRows.splice(index, 1);
		},
		filledAliasRows() {
			return this.aliasRows.filter(function (row) {
				return row.Text.trim() !== '' || row.Alias.trim() !== '';
			});
		},
		buildAliases() {
			var rows = this.filledAliasRows();
			if (rows.length === 0) {
				return null;
			}
			var aliases = {};
			rows.forEach(function (row) {
				aliases[row.Text.trim()] = row.Alias.trim();
			});
			return JSON.stringify(aliases);
		},
		validateAliases() {
			var seen = [];
			var rows = this.filledAliasRows();
			for (var row of rows) {
				if (row.Text.trim() === '' || row.Alias.trim() === '') {
					alert('Cada abreviatura debe tener el texto y su reemplazo.');
					return false;
				}
				if (seen.includes(row.Text.trim())) {
					alert('El texto \'' + row.Text.trim() + '\' figura más de una vez en las abreviaturas.');
					return false;
				}
				seen.push(row.Text.trim());
			}
			return true;
		},
		toNullableNumber(value) {
			if (value === null || value === undefined || value === '') {
				return null;
			}
			return Number(value);
		},
		resolveItemIds() {
			if (this.layer.Type === 'M') {
				return this.metricItems.map(function (item) { return item.Id; }).join(',');
			}
			if (this.layer.Type === 'B' && this.boundaryId !== null) {
				return String(this.boundaryId);
			}
			return null;
		},
		validate() {
			if (!this.layer.Caption || this.layer.Caption.trim() === '') {
				alert('Debe indicar un valor para \'Nombre\'.');
				return false;
			}
			if (this.layer.Type !== 'L' && !this.layer.RouteTag) {
				alert('Debe indicar la letra del vínculo.');
				return false;
			}
			if (this.layer.Type === 'M' && !this.resolveItemIds()) {
				alert('Debe agregar al menos un indicador.');
				return false;
			}
			if (this.layer.Type === 'B' && !this.resolveItemIds()) {
				alert('Debe elegir la delimitación.');
				return false;
			}
			if (this.layer.Type === 'R' && !this.layer.RasterUrl) {
				alert('Debe indicar la URL de teselas.');
				return false;
			}
			if (this.layer.Type === 'M' && !this.validateAliases()) {
				return false;
			}
			return true;
		},
		save() {
			if (this.validate() === false) {
				return;
			}
			this.layer.ItemIds = this.resolveItemIds();
			this.layer.Aliases = null;
			if (this.layer.Type === 'M') {
				this.layer.Aliases = this.buildAliases();
			}
			this.layer.LineWidth = this.toNullableNumber(this.layer.LineWidth);
			this.layer.RasterMaxNativeZoom = this.toNullableNumber(this.layer.RasterMaxNativeZoom);
			this.layer.RasterMaxZoom = this.toNullableNumber(this.layer.RasterMaxZoom);
			this.layer.RasterOpacity = this.toNullableNumber(this.layer.RasterOpacity);
			var loc = this;
			this.$refs.invoker.doSave(window.Db, window.Db.UpdateBasemapLayer, this.layer).then(function () {
				loc.activateEdit = false;
				loc.$emit('completed', loc.layer);
			});
		},
	},
};
</script>

<style scoped>
.items-list {
	max-height: 180px;
	overflow-y: auto;
	padding: 0;
	border: 1px solid rgba(0, 0, 0, .12);
}

.items-list .md-list-item {
	border-bottom: 1px solid rgba(0, 0, 0, .12);
}

.aliases-table {
	max-height: 220px;
	overflow-y: auto;
}
</style>
