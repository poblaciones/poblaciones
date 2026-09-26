<template>
	<nav class="workPanel">
		<div>
			<div v-if="metadata !== null" ref="barBody" class="panel card workPanelBody"
					 :style="'    text-shadow: rgb(118 118 118) 0px 0px 5px;rgba(76, 76, 76, 0.32) 0px 0px 6px 0px inset; background-color: ' + backgroundColor ">
				<div class="floatBox pull-right exp-hiddable-block" style="margin-top: -1px">
					<button type="button" class="btn smallButton" :class="spaceRight" @click="showAddToMap">{{ addToMapLabel }}</button>
					<div style="position: absolute; top: 10px; right: 5px; zoom: 1.22;" v-if="hasOnboarding()">
						<button type="button" class="btn btn-default btn-xs"
										style="border-color: #FFF"
										title="Bienvenida" @click="showOnboarding()">
							<help-circle-icon style="color: #fff" title="Bienvenida" />
						</button>
					</div>
					<div class="metadataInfo" style="position: relative; z-index: 10;" v-if="type === 'W' && hasMetrics" :style="metadataInfoWidthStyle">
						<div class="sourceInfo exp-hiddable-block" :style="getMetadataStyle()">
							<a href="#" :title="'Información de ' + metadata.Name"
								 @click="clickFuente" style="color: #FFF">
								<link-icon />
								Información
							</a>
						</div>
					</div>
				</div>
				<div v-if="institutionsList" class="littleRow preTitleRow">
					{{ institutionsList }}
				</div>
				<div class="h3 title titleRow">
					{{ metadata.Name }}
				</div>
				<div v-if="metadata.Authors" class="littleRow postTitleRow">
					{{ metadata.Authors }}
				</div>
			</div>
		</div>
		<onboarding ref="Onboarding" :backgroundColor='backgroundColor' :work="work" v-if="hasOnboarding()"></onboarding>
	</nav>
</template>

<script>
import LinkIcon from 'vue-material-design-icons/Link.vue';
import Onboarding from '@/map/components/popups/onboarding';
import HelpCircleIcon from 'vue-material-design-icons/HelpCircle.vue';
import dom from '@/common/framework/dom';

// Zócalo superior con los metadatos de la cartografía (work) o delimitación
// (boundary) activa. Resuelve el 100% de la parte visual para ambos casos;
// workPanel.vue y boundaryPanel.vue son wrappers finos que arman las props
// genéricas (metadata, addToMapItems) a partir del work/boundary activo y
// delegan acá el resto.
export default {
	name: 'topPanel',
	props: [
		// 'W' (work) o 'B' (delimitación). Decide qué funcionalidad exclusiva
		// de work se habilita: el link de metadatos y el onboarding.
		'type',
		// El Metadata de la cartografía o de la versión de la delimitación
		// (Name/Authors/Institutions o Institution). null: panel cerrado.
		'metadata',
		// Lista para el popup selector (AddMetric): los indicadores del work,
		// o la delimitación activa con sus versiones.
		'addToMapItems',
		// Id opcional a asociar en el popup selector (workId, para asociar la
		// variante de indicador elegida a ese work). No aplica a boundary.
		'addToMapId',
		// Objeto { Current } del work activo, solo para las dos
		// funcionalidades exclusivas de work: onboarding y popup de metadatos.
		'work',
		'backgroundColor'
	],
	components: {
		LinkIcon,
		Onboarding,
		HelpCircleIcon
	},
	computed: {
		spaceRight() {
			if (this.hasOnboarding()) {
				return 'spaceNextOb';
			} else {
				return 'spaceNext';
			}
		},
		addToMapLabel() {
			if (this.type === 'B') {
				return 'Delimitaciones';
			} else {
				return 'Agregar indicador';
			}
		},
		metadataInfoWidthStyle() {
			if (this.showButtonsInSingleRow()) {
				return 'width: 1px';
			} else {
				return '';
			}
		},
		institutionsList() {
			if (!this.metadata) {
				return null;
			}
			var institutions = this.metadata.Institutions;
			if (institutions && institutions.length > 0) {
				var ret = institutions[0].Name;
				for (var n = 1; n < institutions.length; n++) {
					ret += " – " + institutions[n].Name;
				}
				return ret;
			}
			if (this.metadata.Institution) {
				return this.metadata.Institution;
			}
			return null;
		},
		hasMetrics() {
			if (!this.addToMapItems) {
				return false;
			}
			for (var item of this.addToMapItems) {
				var versions = item.Versions;
				if (item.LocalVersions) {
					versions = item.LocalVersions;
				}
				if (versions && versions.length > 0 && versions[0].Name != '') {
					return true;
				}
			}
			return false;
		}
	},
	methods: {
		showAddToMap() {
			window.Popups.AddMetric.show(this.addToMapItems, this.addToMapId, this.addToMapLabel);
		},
		onResize() {
			var visible = (this.metadata !== null);
			if (visible) {
				this.updateWork();
			}
		},
		clickFuente(e) {
			e.preventDefault();
			window.Popups.WorkMetadata.show(this.work.Current);
		},
		showButtonsInSingleRow() {
			return this.titleRowsCount() === 1;
		},
		showButtonsInDoubleRow() {
			return this.titleRowsCount() === 2;
		},
		titleRowsCount() {
			if (!this.metadata) {
				return 0;
			}
			var ret = 0;
			if (this.metadata.Name) {
				ret++;
			}
			if (this.institutionsList) {
				ret++;
			}
			if (this.metadata.Authors) {
				ret++;
			}
			return ret;
		},
		hasOnboarding() {
			if (this.type !== 'W' || !this.work || !this.work.Current) {
				return false;
			}
			return this.work.Current.Onboarding.Enabled;
		},
		showOnboarding() {
			this.$refs.Onboarding.toggleModal();
		},
		getMetadataStyle() {
			if (this.showButtonsInSingleRow()) {
				return 'margin-top: -24px; margin-left: -90px;';
			} else if (this.showButtonsInDoubleRow()) {
				return 'margin-top: 3px';
			} else {
				return 'margin-top: 8px';
			}
		},
		removeFromRoute() {
			if (this.type === 'W') {
				window.SegMap.SaveRoute.RemoveWork();
			} else {
				window.SegMap.SaveRoute.RemoveBoundary();
			}
		},
		updateWork() {
			var visible = (this.metadata !== null);
			var bar = this.$el;
			var currentVisible = bar.style.display === 'block';
			var barBody = this.$refs.barBody;
			var calculatedHeight = '0px';
			if (barBody) {
				calculatedHeight = barBody.offsetHeight + 'px';
			}
			var currentHeight = bar.style.height;
			if (visible !== currentVisible || (visible && currentHeight !== calculatedHeight)) {
				if (visible) {
					bar.style.height = calculatedHeight;
					bar.style.display = 'block';
					var holder = document.querySelector('#holder');
					holder.style.height = `calc(100% - ${calculatedHeight})`;
					holder.style.top = calculatedHeight;

					var offsetCss = dom.getCssRule(document, '.work-offsetY');
					if (offsetCss) {
						offsetCss.style.maxHeight = '80vh;';
					}
					if (window.SegMap) {
						window.SegMap.TriggerResize();
					}
				} else {
					bar.style.display = 'none';
					var holder = document.querySelector('#holder');
					holder.style.height = '100%';
					holder.style.top = '0px';

					var offsetCss = dom.getCssRule(document, '.work-offsetY');
					if (offsetCss) {
						offsetCss.style.maxHeight = '90vh;';
					}
					if (window.SegMap) {
						this.removeFromRoute();
						window.SegMap.TriggerResize();
					}
				}
			}
		},
	},
	watch: {
		metadata() {
			var loc = this;
			setTimeout(function () {
				loc.updateWork();
				// hack por problemas en chrome y firefox con navbar-fixed-top en la inicialización
				var height = 0;
				if (loc.metadata && loc.$refs.barBody) {
					height = loc.$refs.barBody.offsetHeight;
				}
				var holder = document.querySelector('#holder');
				holder.style.height = `calc(100% - ${height}px)`;
				holder.style.offsetHeight = `calc(100% - ${height}px)`;
				holder.style.top = height + 'px';
			}, 50);
		}
	}
};
</script>

<style scoped>

.workPanel {
	display: none;
	background-color: white;
	z-index: 1;
	position: initial;
	width: 100%;
}
.littleRow {
	width: 100%;
	text-overflow: ellipsis;
	color: white;
	margin-left: 1px;
	font-size: 1.1rem;
}
.sourceInfo
{
	margin-left: 30px;
	font-size: 1.30rem;
	margin-top: 8px;
}
.preTitleRow {
	text-transform: uppercase;
	margin-bottom: 3px;
	margin-top: -4px;
}
.postTitleRow {
	margin-bottom: -2px;
	margin-top: 5px;
}
@media screen and (max-width: 600px) {
	.titleRow {
		font-size: 1.75rem!important;
	}
	.floatBox {
		float: none !important;
		margin-bottom: 6px;
	}
	.preTitleRow {
		display: none;
	}
	.postTitleRow {
		display: none;
	}
	.metadataInfo {
		display: inline-block;
	}
}
.titleRow {
	line-height: 1.1em;
	margin-top: 0px;
	width: 100%;
	text-overflow: ellipsis;
	color: white;
	font-size: 2.7rem;
}
.infoRow {
	padding: 7px 0px 0px 0px;
	position: relative;
}
.smallButton {
	color: white;
	padding: 4px 14px;
	border-color: white;
}
.spaceNext {
	margin-right: 8px;
	margin-left: 8px
}
	.spaceNextOb {
		margin-right: 41px;
	}
	.workPanelBody {
		background-color: #00A0D2;
		color: #fff !important;
		border-radius: 1px;
		min-height: 70px;
		padding: 12px 2px 6px 12px;
		box-shadow: 0 1px 4px 0 rgba(90,90,90,.32);
	}
</style>
