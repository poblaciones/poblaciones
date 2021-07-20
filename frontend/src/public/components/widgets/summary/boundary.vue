<template>
	<div class="metricPanel">
		<div class="dragHandle exp-hiddable-block">
			<div style="top: -10px; position: absolute; left: 0; right: 0">
				<drag-horizontal title="Arrastrar para reubicar" />
			</div>
		</div>
		<BoundaryTopButtons :boundary="boundary" :key="boundary.index"
												class="exp-hiddable-block" v-if="!Embedded.Readonly" />
		<div>
			<h4 class="title" v-on:click="changeVisibility()" style="margin-bottom: 6px;cursor: pointer">
				<i v-if="singleLabel.Visible" :style="'border-color: ' + singleLabel.FillColor + '; color: ' + singleLabel.FillColor"
					 class="fa drop fa-tint exp-category-bullets-large smallIcon"></i>
				<i v-else class="fa drop fa-tint exp-category-bullets-large smallIcon action-muted" style="border-color: inherit" />
				{{ boundary.properties.Name }} <span style="font-size: .95em" v-if="boundary.properties.Count">
					({{ h.formatNum(boundary.properties.Count) }})
				</span>
			</h4>
		</div>

		<div class="sourceRow" v-if="!Embedded.Readonly">
			<Source style="float:right" :sourceTitle="boundary.properties.Name"
							@clickDownload="clickDescargar" @clickSource="clickFuente" />

			<div style="clear: both; height: 0px">
			</div>
		</div>
		<div class="exp-showable-block" style="margin-top: -1.25rem" />
	</div>
</template>

<script>
import BoundaryTopButtons from './boundaryTopButtons';
import DragHorizontal from 'vue-material-design-icons/DragHorizontal.vue';
import Helper from '@/public/js/helper';
import Source from './source';

export default {
	name: 'boundary',
	components: {
		BoundaryTopButtons,
		DragHorizontal,
		Source,
	},
	props: [
		'boundary',
		'clipping',
	],
	methods: {
		clickLabel(label) {
			label.Visible = !label.Visible;
			this.boundary.UpdateMap();
		},
		changeVisibility() {
			this.boundary.ChangeVisibility();
		},
		remove(e) {
			e.preventDefault();
			this.boundary.Remove();
		},
		clickDescargar() {
			window.Popups.BoundaryDownload.show(this.boundary);
		},
		clickFuente() {
			window.Popups.ClippingMetadata.show(this.boundary.properties.Metadata, this.boundary.properties.Name);
		},
	},
		computed: {
			Use() {
				return window.Use;
			},
			Embedded() {
				return window.Embedded;
			},
			h() {
				return Helper;
			},
			singleLabel() {
				return { FillColor: this.boundary.color, Visible: this.boundary.visible };
			}
		}
};
</script>

<style scoped>

.metricBlock
{
	padding-top: 1px;
	cursor: default;
}
	.smallIcon {
		font-size: 14px;
		margin-top: 2px
	}
</style>
