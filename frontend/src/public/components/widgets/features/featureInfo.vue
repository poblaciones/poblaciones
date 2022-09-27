<template>
	<div>
		<div ref="topImage" v-if="featureInfo.Image && isImageUrl(featureInfo.Image)"
				 :style="'background-image:url('
										+ preProcess(featureInfo.Image) + ');'"
				 class="topImage">
		</div>
		<div class='panel card panel-body' :class="(enabled ? '' : 'text-muted')">
			<div @click="doBack" v-if='featureInfo.back' class='hand' style='background-color:pink'>&lt;&lt; Volver al listado</div>
			<mp-close-button v-else @click="doClose" class="exp-hiddable-block" />
			<h5 v-if="hasTitle" class="title"><mp-label :text="'' + title" :clickeable="!!featureInfo.position" @click='focus()' /></h5>
			<div class='stats' style="padding-top: 8px; padding-bottom: 8px;">
				<a href="#" title="Agregar como indicador"
					 @click="addMetricFromKey" style="color: #a7a7a7">
					{{ featureInfo.Type }}
				</a>
				<div style="float: right" class="exp-hiddable-block" v-if="featureInfo.Key && featureInfo.Key.MetricId">
					<button type="button" :disabled="isLast"
									class="close lightButton smallerButton" :title="(isLast ? '' : 'Siguiente' + positionalData)" @click="next()">
						<i class="fas fa-chevron-right" />
					</button>
					<button type="button" :disabled="isFirst" style="margin-right: -2px"
									class="close lightButton smallerButton" :title="(isFirst ? '' : 'Anterior' + positionalData)" @click="previous()">
						<i class="fas fa-chevron-left" />
					</button>
				</div>
			</div>
			<hr class="moderateHr exp-hiddable-visiblity" v-if="hasTitle">
			<div>
				<div style="float: right" class="exp-hiddable-block" v-if="hasPerimeter && usePerimeter">
					<button type="button" class="close lightButton smallerButton" style="border: 1px solid grey; border-radius: 12px; width: 30px;"
									title="Seleccionar el perímetro" @click="selectPerimeter">
						<i class="fas fa-circle-notch" />

					</button>
				</div>
				<div class='item' v-if="featureInfo.Code && featureInfo.Title">
					Código: {{ val }}
				</div>
				<div v-for="(item, index) in featureInfo.Items" class='item' :key="index">
					{{ capitalize(item.Name) }}: <mp-label :text="getValue(item)" />
				</div>
				<div v-if="lat != 0 && lon != 0" class='pos'>Posición: {{ lat }},{{ lon }}.</div>
			</div>
		</div>
	</div>
</template>

<script>
import h from '@/public/js/helper';
import arr from '@/common/framework/arr';

export default {
	name: 'featureInfo',
	props: [
		'featureInfo',
		'enabled'
	],
	computed: {
		title() {
			if (this.featureInfo.Title) {
				return this.featureInfo.Title;
			} else if (this.featureInfo.Code) {
				return this.featureInfo.Code;
			}
			return '';
		},
		hasTitle() {
			return this.title && this.title.length > 0;
		},
		rows() {
			return window.Panels.Content.FeatureNavigation.Values;
		},
		val() {
			return h.ensureFinalDot(this.isNullDash(this.featureInfo.Code));
		},
		currentPosition() {
			return arr.IndexByProperty(this.rows, 'FID', this.featureInfo.Key.Id);
		},
		usePerimeter() {
			return window.SegMap.Configuration.UsePerimeter;
		},
		hasPerimeter() {
			if (!this.featureInfo.Key || !this.featureInfo.Key.VariableId || !this.lat || !this.lon) {
				return false;
			}
			var variable = window.SegMap.GetVariable(this.featureInfo.Key.MetricId, this.featureInfo.Key.VariableId);
			if (variable) {
				return variable.ShowPerimeter;
			} else {
				return false;
			}
		},
		positionAndSize() {
			var curPos = this.currentPosition;
			if (curPos === -1) {
				return { position: -1, size: 0 };
			}
			var category = this.rows[curPos].ValueId;
			var pos = 0;
			for (var n = curPos - 1; n >= 0; n--) {
				if (this.rows[n].ValueId !== category)
					break;
				pos++;
			}
			var following = 0;
			for (var n = curPos + 1; n < this.rows.length; n++) {
				if (this.rows[n].ValueId !== category)
					break;
				following++;
			}
			return { position: pos, size: pos + following + 1 };
		},
		positionalData() {
			var curPos = this.positionAndSize;
			if (curPos.position === -1) {
				return '';
			}
			return " (" + (curPos.position + 1) + '/' + curPos.size + ")";
		},
		isFirst() {
			var curPos = this.positionAndSize;
			if (curPos.position === -1) {
				return true;
			}
			return curPos.position === 0;
		},
		isLast() {
			var curPos = this.positionAndSize;
			if (curPos.position === -1) {
				return true;
			}
			return curPos.position + 1 === curPos.size;
		},
		lat() {
			if(this.featureInfo.position && this.featureInfo.position.Coordinate && this.featureInfo.position.Coordinate.Lat) {
				return h.trimNumberCoords(this.featureInfo.position.Coordinate.Lat);
			}
			return 0;
		},
		lon() {
			if(this.featureInfo.position && this.featureInfo.position.Coordinate && this.featureInfo.position.Coordinate.Lon) {
				return h.trimNumberCoords(this.featureInfo.position.Coordinate.Lon);
			}
			return 0;
		},
	},
	methods: {
		doBack(e) {
			e.preventDefault();
			this.$emit('clickBack', e);
		},
		doClose(e) {
			window.Panels.Content.FeatureInfoKey = null;
			window.SegMap.MapsApi.ClearSelectedFeature();
			e.preventDefault();
			this.$emit('clickClose', e, this.featureInfo.Key.Id);
		},
		preProcess(imageUrl) {
			if (!imageUrl) {
				return imageUrl;
			}
			// Soporte para imágenes en google drive
			if (imageUrl.startsWith('https://drive.google.com/file/')) {
				var found = imageUrl.match(/d\/([A-Za-z0-9\-]+)/);
				if (found[1].length) {
					return 'https://drive.google.com/uc?export=view&id=' + found[1];
				}
			}
			return imageUrl;
		},
		focus() {
			window.SegMap.InfoWindow.FocusView(this.featureInfo.position, this.featureInfo.Key, this.featureInfo.Title);
		},
		previous() {
			window.SegMap.InfoWindow.Previous();
		},
		next() {
			window.SegMap.InfoWindow.Next();
		},
		selectPerimeter() {
			var variable = window.SegMap.GetVariable(this.featureInfo.Key.MetricId, this.featureInfo.Key.VariableId);
			if (variable && this.lat && this.lon) {
				var radius = variable.Perimeter;
				var pos = { Lat: this.lat, Lon: this.lon };
				window.SegMap.Clipping.SetClippingCircleKms(pos, radius);
			}
		},
		addMetricFromKey() {
			if (this.featureInfo.Key.MetricId) {
				window.SegMap.AddMetricById(this.featureInfo.Key.MetricId);
			} else {
				window.SegMap.AddMetricByFID(this.featureInfo.Key.Id);
			}
		},
		capitalize(name) {
			return h.capitalize(name);
		},
		isImageUrl(image) {
			if (image === null) {
				return false;
			}
			if (image.toLowerCase().startsWith("http") == false) {
				return false;
			}
			if (image.trim().indexOf(" ") !== -1) {
				return false;
			}
			return true;
		},
		isNullDash(str) {
			if (str === undefined || str === '' || str === null) {
				return '-';
			} else {
				return '' + str;
			}
		},
		getValue(item) {
			var val = item.Value;
			if (item.Caption !== null && item.Caption !== undefined) {
				val = item.Caption;
			}
			return this.isNullDash(val);
		},
	},
};
</script>

<style scoped>
.type {
	padding-bottom: 0px;
	padding-top: 2px;
	font-size: 9px;
	text-transform: uppercase;
	text-align: center;
}
.pos {
	padding-top: 11px;
	font-size: 11px;
	text-align: center;
}
.item {
	padding-top: 1px;
	padding-bottom: 10px;
	word-wrap: break-word;
}
	.smallerButton {
		padding: 4px 0px !important;
	}
	.topImage {
		background-position: 50% 50%;
		height: 200px;
		width: 100%;
		background-size: cover;
	}
</style>

