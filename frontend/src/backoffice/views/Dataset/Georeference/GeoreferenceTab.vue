<template>
	<div v-if="Dataset">
		<invoker ref="invoker"></invoker>
		<stepper ref="stepper" @completed="stepperComplete" title="Georreferenciar"></stepper>
		<ErrorsPopup ref="georeferenceStatusPopup" @georeferenceRequested="startGeoreferencing(0)"
								 :georeferenceParameters="{ type: tab, start: start, end: end, polygon: polygon}">
			</ErrorsPopup>

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
			<md-tabs>
				<md-tab id="tab-location" md-label="Ubicaciones" @click="tab='location'">
					<div class="dParagrah">
						Seleccione las variables que permiten identificar la localización (latitud y longitud) de cada elemento del dataset.
					</div>
					<div class='md-layout md-gutter'>
						<div class='md-layout-item md-size-50 md-small-size-100'>
							<div class='mp-label mp-subtitle' v-if="mapSegmentsLatLon">
								Inicio del segmento
							</div>
							<lat-long-selection v-model="start" />
						</div>
						<div v-if="mapSegmentsLatLon" class="md-layout-item md-size-50 md-small-size-100">
							<div class='md-layout-item md-size-100 mp-label mp-subtitle'>
								Fin del segmento
							</div>
							<lat-long-selection v-model="end" />
						</div>
					</div>
					<div class="marginTop">
						<md-button @click="startGeoreferencing(1)" :disabled="startDisabled" class="md-raised">
							Georreferenciar
						</md-button>
					</div>
					<div>
						<md-switch class="md-primary" v-model="mapSegmentsLatLon">
							Georreferenciar segmentos
						</md-switch>
					</div>
				</md-tab>
				<md-tab id="tab-data" md-label="Códigos" @click="tab='code'">
					<div class="dParagrah">
						Seleccione la variable que contiene los códigos de cada elemento del dataset y la geografía a utilizar.
					</div>
					<div class='mp-label mp-subtitle' v-if="mapSegmentsCodes">
						Inicio del segmento
					</div>
					<codes-selection v-model="start" />
					<div v-if="mapSegmentsCodes">
						<div class='mp-label mp-subtitle'>
							Fin del segmento
						</div>
						<codes-selection v-model="end" />
					</div>
					<div class="marginTop">
						<md-button @click="startGeoreferencing(1)" :disabled="startDisabled" class="md-raised">
							Georreferenciar
						</md-button>
					</div>
					<div>
						<md-switch class="md-primary" v-model="mapSegmentsCodes">
							Georreferenciar segmentos
						</md-switch>
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
												 v-model="polygon" :render="formatColumn" />
						</div>
					</div>
					<div class="marginTop">
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

import CodesSelection from './CodesSelection';
import LatLongSelection from './LatLongSelection';
import ErrorsPopup from './ErrorsPopup';
import f from '@/backoffice/classes/Formatter';

export default {
	name: 'georreferenceTab',
	components: {
		CodesSelection,
		LatLongSelection,
		ErrorsPopup
	},
	computed: {
		Dataset() {
			return window.Context.CurrentDataset;
		},
		Work() {
			return window.Context.CurrentWork;
		},
		startDisabled() {
			if (this.tab === 'location') {
				return (this.start.longitude === null || this.start.latitude === null) ||
					(this.mapSegmentsLatLon && (this.end.latitude === null || this.end.longitude === null));
			} else if (this.tab === 'code') {
					return (this.start.codes === null || this.start.geographyId === null) ||
						(this.mapSegmentsCodes && (this.end.codes === null || this.end.geographyId === null));
			} else if (this.tab === 'shape') {
				return this.polygon === null;
			} else {
				return true;
			}
		},
	},
	mounted() {

	},
	data() {
		return {
			polygon: null,
			start: {
				latitude: null,
				longitude: null,
				codes: null,
				geographyId: null,
			},
			end: {
				latitude: null,
				longitude: null,
				codes: null,
				geographyId: null,
			},
			mapSegmentsLatLon: false,
			mapSegmentsCodes: false,
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
			this.start.codes = null;
			this.start.geographyId = null;
			this.start.latitude = this.trySelect(numericColumns, ['lat', 'latitud', 'latitude', 'y']);
			this.start.longitude = this.trySelect(numericColumns, ['lon', 'ln', 'long', 'longitud', 'longitude', 'x']);
			this.end.codes = null;
			this.end.geographyId = null;
			this.end.latitude = null;
			this.end.longitude = null;
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
					this.$refs.georeferenceStatusPopup.show();
					break;
				}
				case STEP_UPDATING:
					stepper.error = 'Falló en actualización de datos.';
					break;
				case STEP_END:
					this.Dataset.properties.Geocoded = true;
					if (this.tab === 'location') {
						this.Dataset.properties.Type = 'L';
						this.Dataset.properties.AreSegments = this.mapSegmentsLatLon;
					} else if (this.tab === 'code') {
						this.Dataset.properties.Type = 'D';
						this.Dataset.properties.AreSegments = this.mapSegmentsCodes;
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
									'startLat': this.start.latitude,
									'startLon': this.start.longitude,
									'endLat': this.end.latitude,
									'endLon': this.end.longitude,
									's': (this.mapSegmentsLatLon ? '1' : '0')
									};
			} else if (this.tab === 'code') {
				return { 'k': this.Dataset.properties.Id,
									'startA': this.start.geographyId,
									'startC': this.start.codes,
									'endA': this.end.geographyId,
									'endC': this.end.codes,
									's': (this.mapSegmentsCodes ? '1' : '0') };
			} else if (this.tab === 'shape') {
				return { 'k': this.Dataset.properties.Id,
									'a': window.Context.GetTrackingLevelGeography().Id,
									'c': this.polygon,
									'p': true };
			}
		},
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

	.mp-subtitle {
		color: #448aff !important;
		-webkit-text-fill-color: #448aff !important;
		padding-bottom: 8px;
		padding-top: 10px;
		margin-left: -2px !important;
		padding-left: 2px !important;
	}

	.marginTop {
		margin-top: 20px;
	}
</style>

