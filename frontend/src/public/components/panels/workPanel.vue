<template>
	<nav id="workPanel" class="workPanel">
		<div>
			<div v-if="work.Current !== null" ref="barBody" class="panel card workPanelBody" id="barBody" :style="'background-color: ' + backgroundColor">
				<!--button title="Cerrar" type="button" v-on:click="work.Current = null" class="close">
					<span aria-hidden="true">&times;</span>
				</button -->
				<div class="title pull-right exp-hiddable-block" style="margin-top: -1px">
					<button type="button" class="btn smallButton spaceNext" @click="showMetrics">Agregar indicador</button>
					<button v-show="false" type="button" class="btn smallButton" @click="showZones = true">Zonas destacadas</button>
					<button type="button" v-show="false" class="btn smallButton" @click="showPresentation = true">Presentación</button>
					<div style="position: relative; z-index: 10;" :style="(showButtonsInSingleRow() ? 'width: 1px' : '')">
						<div class="sourceInfo exp-hiddable-block" :style="getMetadataStyle()">
							<a href="#" :title="'Metadatos de ' + work.Current.Name"
								 v-on:click="clickFuente" style="color: #FFF">
								<link-icon />
								Metadatos
							</a>
						</div>

					</div>
				</div>
				<div v-if="work.Current.Institution.Name" class="littleRow preTitleRow">
					{{ work.Current.Institution.Name }}
				</div>
				<div class="h3 title titleRow">
					{{ work.Current.Name }}
				</div>
				<div v-if="work.Current.Authors" class="littleRow postTitleRow">
					{{ work.Current.Authors }}
				</div>
			</div>
		</div>
	</nav>
</template>

<script>
import LinkIcon from 'vue-material-design-icons/Link.vue';

export default {
	name: 'workPanel',
	props: [
		'work',
		'backgroundColor'
	],
	components: {
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
			window.Popups.AddMetric.show(this.work.Current.Metrics, this.work.Current.Id);
		},
		onResize() {
			var visible = (this.work.Current !== null);
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
			if (!this.work.Current) {
				return 0;
			}
			var ret = (this.work.Current.Name ? 1 : 0) + (this.work.Current.Institution.Name ? 1 : 0)
				+ (this.work.Current.Authors ? 1 : 0);
			return ret;
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
					var holder = document.querySelector('#holder');
					holder.style.height = `calc(100% - ${calculatedHeight}px)`;
					holder.style.top = calculatedHeight + 'px';
					if (window.SegMap) {
						window.SegMap.TriggerResize();
					}
				} else {
					bar.style.display = 'none';
					var holder = document.querySelector('#holder');
					holder.style.height = '100%';
					holder.style.top = '0px';
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
			setTimeout(function () {
				loc.updateWork();
				// hack por problemas en chrome y firefox con navbar-fixed-top en la inicialización
				var height = (loc.work.Current && loc.$refs.barBody ? loc.$refs.barBody.offsetHeight : 0);
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
	margin-left: 13px;
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
	margin-top: -2px;
}
.titleRow {
	line-height: 1.1em;
	padding-bottom: 7px;
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
}
.workPanelBody {
	background-color: #00A0D2;
	color: #fff!important;
	border-radius: 1px;
	padding: 12px 2px 6px 12px;
	box-shadow: 0 1px 4px 0 rgba(90,90,90,.32);
}
</style>
