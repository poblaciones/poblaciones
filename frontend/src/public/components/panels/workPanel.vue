<template>
	<div>
		<div style="position: absolute; z-index: 10">
			<Modal class="panel card" title="Agregar indicador" ref="metrics" :showCancel="false"
		 :showOk="false">
				<addMetric v-if="work.Current" ref="addMetric" :list="work.Current.Metrics" v-on:selectedItem="metricSelected" />
			</Modal>
			<div class="panel card">
				<WorkMetricMetadata ref="showFuente" :work="work.Current" />
			</div>
		</div>
		<nav id="workPanel" class="navbar-fixed-top workPanel">
			<div v-if="work.Current !== null" class="panel card workPanelBody" id="barBody">
				<!--button title="Cerrar" type="button" v-on:click="work.Current = null" class="close">
					<span aria-hidden="true">&times;</span>
				</button -->
				<div class="title pull-right" style="margin-top: -1px">
						<button type="button" class="btn smallButton spaceNext" @click="showMetrics">Indicadores</button>
						<button v-show="false" type="button" class="btn smallButton" @click="showZones = true">Zonas destacadas</button>
						<button type="button" v-show="false" class="btn smallButton" @click="showPresentation = true">Presentación</button>
					<div style="position: relative; z-index: 10">

						<div class="sourceInfo" :style="getMetadataStyle()">
							<a href="#" :title="'Metadatos de ' + work.Current.Name"
									v-on:click="clickFuente" style="color: #FFF">
								<link-icon />
								Metadatos
							</a>
						</div>
					
					</div>
				</div>
				<div v-if="work.Current.Institution" class="littleRow preTitleRow">
					{{ work.Current.Institution }}
				</div>
				<div class="h3 title titleRow">
					{{ work.Current.Name }}
				</div>
				<div v-if="work.Current.Authors" class="littleRow postTitleRow">
					{{ work.Current.Authors }}
				</div>
			</div>
		</nav>
	</div>
</template>

<script>
import Modal from '@/public/components/popups/modal';
import addMetric from '@/public/components/popups/addMetric';
import WorkMetricMetadata from '@/public/components/popups/workMetricMetadata';
import LinkIcon from 'vue-material-design-icons/Link.vue';

export default {
	name: 'workPanel',
	props: [
		'work',
	],
	components: {
		Modal,
		addMetric,
		WorkMetricMetadata,
		LinkIcon,
	},
	data() {
		return {
			showZones: false,
			showPresentation: false,
		};
	},
	methods: {
		showMetrics() {
			this.$refs.metrics.show();
		},
		onResize() {
			var visible = (this.work.Current !== null);
			if (visible) {
				this.updateWork();
			}
		},
		clickFuente(e) {
			e.preventDefault();
			this.$refs.showFuente.show();
		},
		getMetadataStyle() {
			if (this.work.Current.Institution) {
				return '';
			} else {
				if (this.work.Current.Authors) {
					return 'margin-top: 3px';
				} else {
				return 'margin-top: -24px; margin-left: -90px;';
				}
			}
		},
		metricSelected() {
			var metric = this.$refs.addMetric.selected;
			this.$refs.metrics.hide();
			window.SegMap.AddMetricByIdAndWork(metric.Id, this.work.Current.Id);
		},
		updateWork() {
			var visible = (this.work.Current !== null);
			var bar = document.getElementById('workPanel');
			var currentVisible = bar.style.display === 'block';
			var workPanelBody = document.getElementById('barBody');
			var calculatedHeight = 0;
			if (workPanelBody) {
				calculatedHeight = workPanelBody.offsetHeight + 'px';
			}
			var currentHeight = bar.style.height;

			if (visible !== currentVisible || (visible && currentHeight !== calculatedHeight)) {
				if (visible) {
					bar.style.height = calculatedHeight;
					bar.style.display = 'block';
					document.body.style.paddingTop = calculatedHeight;
					if (window.SegMap) {
						window.SegMap.TriggerResize();
					}
				} else {
					bar.style.display = 'none';
					document.body.style.paddingTop = '0px';
					this.work.Current = null;
					if (window.SegMap) {
						window.SegMap.SaveRoute.RemoveWork();
						window.SegMap.TriggerResize();
					}
				}
			}
		},
	},
	watch: {
		'work.Current'() {
			var loc = this;
			setInterval(function () { loc.updateWork(); }, 50);
		}
	}
};
</script>

<style scoped>

.workPanel {
	display: none;
	background-color: white;
	z-index: 1;
}
.littleRow {
	width: 100%;
  text-overflow: ellipsis;
  color: white;
  margin-left: 1px;
	font-size: 11px;
}
.sourceInfo
{
	margin-left: 10px;
  font-size: 12.5px;
  margin-top: 9px;
}
.preTitleRow {
  text-transform: uppercase;
  margin-bottom: 3px;
  margin-top: -4px;
}
.postTitleRow {
  margin-bottom: -2px;
  margin-top: -2px;
}

.titleRow {
	line-height: 1.1em;
	padding-bottom: 7px;
	margin-top: 0px;
	width: 100%;
	text-overflow: ellipsis;
	color: white;
	font-size: 27px;
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
}

.workPanelBody {
	background-color: #00A0D2;
  color: #fff!important;
	border-radius: 1px;
  padding: 12px 15px 6px 15px;
	box-shadow: 0 1px 4px 0 rgba(90,90,90,.32);
}

</style>
