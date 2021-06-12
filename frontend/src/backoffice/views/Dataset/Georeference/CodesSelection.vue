<template>
	<div class='md-layout md-gutter'>
		<div class='md-layout-item md-size-35 md-small-size-100'>
			<mp-select :canEdit="Work.CanEdit()" :list="Dataset.Columns"
								 :model-key="true" label="Variable" helper="Variable que contiene los códigos geográficos"
								 v-model="value.codes" :render="formatColumn" />
		</div>
		<div class='md-layout-item md-size-35 md-small-size-100'>
			<mp-select :canEdit="Work.CanEdit()" :list="geographies" listGrouping="RootCaption"
								 :model-key="true" label="Geografía" helper="Nivel para georreferenciar"
								 v-model="value.geographyId" :render="formatGeography" />
		</div>
		<div class='md-layout-item md-size-30 md-small-size-100' style="padding-top: 12px;">
			<md-button @click="valuesOnClick(value.geographyId)" :disabled="valuesDisabled(value.geographyId)">
				<md-icon>ballot</md-icon>
				Consultar valores
			</md-button>
		</div>
		<ValuesPopup v-if="valuesPopupReset" ref="valuesPopup"></ValuesPopup>
</div>
</template>
<script>

import ValuesPopup from './../ValuesPopup.vue';
import ErrorsPopup from './ErrorsPopup.vue';
import f from '@/backoffice/classes/Formatter';

export default {
	name: 'CodesSelection',
	components: {
		ValuesPopup,
	},
	computed: {
		Dataset() {
			return window.Context.CurrentDataset;
		},
		Work() {
			return window.Context.CurrentWork;
		},

	},
	mounted() {
		var loc = this;
		window.Context.Geographies.GetAll(function(data) {
			// Los ordena para el combo
			var sorted = loc.ResolveRootCaptions(data);
			loc.geographies = sorted;
			});
	},
	props: {
		value: { type: Object }
	},
	data() {
		return {
			geographies: [],
			valuesPopupReset: false,
		};
	},
	methods: {
		valuesDisabled(geographyId) {
			return geographyId === null;
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
		ResolveRootCaptions(list) {
			var ret = [];
			// MArca a los que tienen padres y etiqueta de root
			for (var n = 0; n < list.length; n++) {
				if (list[n].RootCaption !== null && list[n].ParentId !== null) {
					list[n].ParentId = 0;
				}
			}
			// Pone a los de nivel cero
			for(var n = 0; n < list.length; n++) {
				if (list[n].ParentId === null) {
						this.classifyChildrenRecursive(ret, list[n], list, list[n]);
				}
			}
			// Pone al final a los que tienen padres y etiqueta de root
			for (var n = 0; n < list.length; n++) {
				if (list[n].ParentId === 0) {
					this.classifyChildrenRecursive(ret, list[n], list, list[n]);
				}
			}
			return ret;
		},
		classifyChildrenRecursive(ret, root, list, promotedParent) {
			ret.push(promotedParent);
			for(var n = 0; n < list.length; n++) {
				if (list[n].ParentId === promotedParent.Id) {
					// Se fija si hay un grupo donde ponerse...
					list[n].RootCaption = root.RootCaption;
					this.classifyChildrenRecursive(ret, root, list, list[n]);
				}
			}
		},
		valuesOnClick(geographyId) {
			// abre popup con los valores de esa geografía
			var loc = this;
			// Obtiene los valores
      this.$refs.invoker.do(this.Work,
													this.Work.GetGeographyItems, geographyId).then(
														function(values) {
															loc.valuesPopupReset = true;
															loc.$nextTick(() => {
																loc.$refs.valuesPopup.showGeographyValues(values, loc.destroyCallback);
															});
														});
		},
		destroyCallback() {
			this.valuesPopupReset = false;
		},

	},
};
</script>


<style rel='stylesheet/scss' lang='scss' scoped>

	.mp-subtitle {
		color: #448aff !important;
		-webkit-text-fill-color: #448aff !important;
		padding-bottom: 8px;
		padding-top: 10px;
		border-top: 1px solid #a9c9ff;
		margin-left: 10px !important;
		padding-left: 2px !important;
	}
</style>

