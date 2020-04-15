<template>
	<div v-if="Dataset">
		<invoker ref="invoker"></invoker>
		<stepper ref="stepper" @completed="stepperComplete" title="Georreferenciar"></stepper>
		<ErrorsPopup ref="georeferenceStatusPopup" @georeferenceRequested="startGeoreferencing(0)">
			</ErrorsPopup>
		<ValuesPopup v-if="valuesPopupReset" ref="valuesPopup"></ValuesPopup>

		<div class="dParagrah">
			La georreferenciación permite vincular los registros del dataset con referencias
			espaciales. Para ello, es necesario que seleccione el tipo de contenido y las variables para realizar la relación.
		</div>
		<div v-if="!Dataset.properties.Geocoded" class="dParagrah">
			Estado actual:	<md-icon class="indentedIco warning">error_outline</md-icon> Sin georreferenciar.
		</div>
		<div v-else>
			<div class="dParagrah">
				Estado actual: 	<md-icon class="indentedIco success">check_circle_outline</md-icon> Georreferenciado.
			</div>
			<div class="dParagrah">
				{{ geocodedMessage() }}
			</div>
			<div>
					<md-button @click="toggleForceShow" class="md-raised" v-if="Work.CanEdit()">
						Volver a georreferenciar
							<md-icon v-if="forceShow">keyboard_arrow_left</md-icon>
							<md-icon v-else>keyboard_arrow_right</md-icon>
					</md-button>
			</div>
		</div>
		<div v-if="Work.CanEdit() && (!Dataset.properties.Geocoded || forceShow)" >
			<md-tabs md-sync-route="">
				<md-tab id="tab-location" md-label="Ubicaciones" @click="tab='location'">
					<div class="dParagrah">
						Seleccione las variables que permiten identificar la localización (latitud y longitud) de cada elemento del dataset.
					</div>
					<div class='md-layout'>
						<div class='md-layout-item md-size-35 md-small-size-100'>
							<md-field>
								<label for="state">Latitud</label>
								<md-select v-model="latitude">
									<md-option v-for="column in Dataset.GetNumericColumns()" v-bind:key="column.Id" :value="column.Id">{{ formatColumn(column) }}</md-option>
								</md-select>
							</md-field>
						</div>
						<div class='md-layout-item md-size-50 md-small-size-100'>
						</div>
						<div class='md-layout-item md-size-35 md-small-size-100'>
							<md-field>
							<label for="state">Longitud</label>
							<md-select v-model="longitude">
								<md-option v-for="column in Dataset.GetNumericColumns()" v-bind:key="column.Id" :value="column.Id">{{ formatColumn(column) }}</md-option>
							</md-select>
						</md-field>
					</div>
				</div>
					<div>
						<md-button @click="startGeoreferencing(1)" :disabled="startDisabled" class="md-raised">
							Georreferenciar
						</md-button>
					</div>
				</md-tab>
				<md-tab id="tab-data" md-label="Códigos" @click="tab='code'">
					<div class="dParagrah">
						Seleccione la variable que contiene los códigos de cada elemento del dataset y la geografía a utilizar.
					</div>
					<div class='md-layout'>
						<div class='md-layout-item md-size-35 md-small-size-100'>
							<mp-select :canEdit="Work.CanEdit()" :list="geographies"
												 :model-key="true" label="Geografía" helper="Nivel para georreferenciar"
												 v-model="geographyId" :render="formatGeography" />
							<br />
							<md-button @click="valuesOnClick()" :disabled="valuesDisabled"
													style="margin-top: -10px; margin-left: -5px; margin-bottom: 20px;">
								<md-icon>ballot</md-icon>
								Consultar valores
							</md-button>
						</div>
						<div class='md-layout-item md-size-35 md-small-size-100'>
							<mp-select :canEdit="Work.CanEdit()" :list="Dataset.Columns"
													:model-key="true" label="Variable" helper="Variable que contiene los códigos geográficos"
													v-model="codes" :render="formatColumn"
											/>
						</div>
					</div>
					<div>
						<md-button @click="startGeoreferencing(1)" :disabled="startDisabled" class="md-raised">
							Georreferenciar
						</md-button>
					</div>
				</md-tab>
				<md-tab id="tab-shapes" md-label="Polígonos" @click="tab='shape'">
					<div class="dParagrah">
						Seleccione la variable que contiene el polígono de cada elemento del dataset. El formato de los valores puede ser geoJson o WKT.
					</div>
					<div class='md-layout'>
						<div class='md-layout-item md-size-35 md-small-size-100'>
							<mp-select :canEdit="Work.CanEdit()" :list="Dataset.GetTextColumns()"
						:model-key="true" label="Polígono" helper="Variable que contiene los polígonos"
						v-model="polygon" :render="formatColumn"
											/>
						</div>
					</div>
					<div>
						<md-button @click="startGeoreferencing(1)" :disabled="startDisabled" class="md-raised">
							Georreferenciar
						</md-button>
					</div>
				</md-tab>
			</md-tabs>
		</div>
	</div>
</template>

<script>

import ValuesPopup from './ValuesPopup.vue';
import ErrorsPopup from './ErrorsPopup.vue';
import f from '@/backoffice/classes/Formatter';

export default {
	name: 'georreferenceTab',
	components: {
		ValuesPopup,
		ErrorsPopup
	},
	computed: {
		Dataset() {
			return window.Context.CurrentDataset;
		},
		Work() {
			return window.Context.CurrentWork;
		},
		valuesDisabled() {
			return this.geographyId === null;
		},
		startDisabled() {
			if (this.tab === 'location') {
				return this.longitude === null || this.latitude === null;
			} else if (this.tab === 'code') {
				return this.codes === null || this.geographyId === null;
			} else if (this.tab === 'shape') {
				return this.polygon === null;
			} else {
				return true;
			}
		},
	},
	mounted() {
		var loc = this;
		window.Context.Geographies.GetAll(function(data) {
			loc.geographies = data;
			});
	},
	data() {
		return {
			latitude: null,
			longitude: null,
			polygon: null,
			valuesPopupReset: false,
			geographyId: null,
			geographies: [],
			codes: null,
			forceShow: false,
			tab: 'location'
		};
	},
	methods: {
		toggleForceShow() {
			this.forceShow = !this.forceShow;
		},
		formatColumn(column) {
			return f.formatColumn(column);
		},
		formatGeography(geography) {
			if (geography === null) {
				return '';
			} else {
				return geography.Caption + ' (' + geography.Revision + ')';
			}
		},
		geocodedMessage() {
			if (this.Dataset.properties.GeoreferenceAttributes) {
				var attrs = JSON.parse(this.Dataset.properties.GeoreferenceAttributes);
				if (attrs.ommited !== undefined) {
					var ret = 'Filas georreferenciadas: ' + (attrs.rowCount - attrs.ommited) + '. ';
					if (parseInt(attrs.ommited) !== 0) {
						ret += 'Filas omitidas: ' + attrs.ommited + '.';
					}
					return ret;
				}
			} else {
				return '';
			}
		},
		setDefaults() {
			// busca defaults posibles para latitude, longitude y polygon
			var numericColumns = this.Dataset.GetNumericColumns();
			var textColumns = this.Dataset.GetTextColumns();
			this.forceShow = false;
			this.codes = null;
			this.geographyId = null;
			this.latitude = this.trySelect(numericColumns, ['lat', 'latitud', 'latitude', 'y']);
			this.longitude = this.trySelect(numericColumns, ['lon', 'ln', 'long', 'longitud', 'longitude', 'x']);
			this.polygon = this.trySelect(textColumns, ['polygon', 'poly', 'shape', 'geojson', 'wkt', 'polígono', 'poligono']);
		},
		trySelect(list, values) {
			for(var n = 0; n < values.length; n++) {
				for(var i = 0; i < list.length; i++) {
					if (list[i].Variable.toLowerCase() === values[n]) {
						return list[i].Id;
					}
				}
			}
			return null;
		},
		startGeoreferencing(reset) {
			var startUrl = this.resolveStartUrl();
			var args = this.resolveStartArgs();
			var stepUrl = this.Dataset.GetStepMultiGeoreferenceUrl();
			var stepper = this.$refs.stepper;
			stepper.startUrl = startUrl;
			stepper.stepUrl = stepUrl;
			args.r = reset;
			stepper.args = args;

			var georeferenceStatusPopup = this.$refs.georeferenceStatusPopup;
			georeferenceStatusPopup.args = args;

			this.Dataset.properties.Geocoded = false;
			if (reset) {
				stepper.Start();
			} else {
				stepper.Start('Reanudando');
			}
		},
		stepperComplete() {
			const STEP_BEGIN = 0;
			const STEP_RESETTING = 1;
			const STEP_VALIDATING = 2;
			const STEP_GEOREFERENCING = 3;
			const STEP_UPDATING = 4;
			const STEP_ATTRIBUTES = 5;
			const STEP_END = 6;

			var stepper = this.$refs.stepper;
			switch (stepper.step)
			{
				case STEP_VALIDATING:
				case STEP_GEOREFERENCING:
				{
					stepper.Close();
					var georeferenceStatusPopup = this.$refs.georeferenceStatusPopup;
					georeferenceStatusPopup.show();
					break;
				}
				case STEP_UPDATING:
					stepper.error = 'Falló en actualización de datos.';
					break;
				case STEP_END:
					this.Dataset.properties.Geocoded = true;
					if (this.tab === 'location') {
						this.Dataset.properties.Type = 'L';
					} else if (this.tab === 'code') {
						this.Dataset.properties.Type = 'D';
					} else if (this.tab === 'shape') {
						this.Dataset.properties.Type = 'S';
					}
					this.Work.UpdateDatasetGeorreferencedCount();
					this.Dataset.ScaleGenerator.RegenAndSaveAllVariables();
					stepper.complete = 'Georeferenciación exitosa.';
					break;
				default:
					stepper.error = 'Paso desconocido.';
					break;
			}
		},
		resolveStartUrl() {
			if (this.tab === 'location') {
				return this.Dataset.GetMultiGeoreferenceByLatLongUrl();
			} else if (this.tab === 'code') {
				return this.Dataset.GetMultiGeoreferenceByCodesUrl();
			} else if (this.tab === 'shape') {
				return this.Dataset.GetMultiGeoreferenceByShapesUrl();
			}
		},
		resolveStartArgs() {
			if (this.tab === 'location') {
				return { 'k': this.Dataset.properties.Id,
									'a': window.Context.GetTrackingLevelGeography().Id,
									'lat': this.latitude,
									'lon': this.longitude };
			} else if (this.tab === 'code') {
				return { 'k': this.Dataset.properties.Id,
									'a': this.geographyId,
									'c': this.codes };
			} else if (this.tab === 'shape') {
				return { 'k': this.Dataset.properties.Id,
									'a': window.Context.GetTrackingLevelGeography().Id,
									'c': this.polygon,
									'p': true };
			}
		},
		destroyCallback() {
			this.valuesPopupReset = false;
		},
		valuesOnClick() {
			// abre popup con los valores de esa geografía
			var loc = this;
			// Obtiene los valores
      this.$refs.invoker.do(this.Work,
													this.Work.GetGeographyItems, this.geographyId).then(
														function(values) {
															loc.valuesPopupReset = true;
															loc.$nextTick(() => {
																loc.$refs.valuesPopup.showGeographyValues(values, loc.destroyCallback);
															});
														});
		}
	},
	watch: {
		Dataset() {
			this.setDefaults();
		},
		'Dataset.Columns' (columns) {
			this.setDefaults();
		}
	}
};
</script>


<style rel='stylesheet/scss' lang='scss' scoped>
.indentedIco {
	margin-left: 30px;
  font-size: 1.5em!important;
}
.warning {
  color: #dc113a!important;
}
.success {
	color: #11af11!important;
}
</style>

