<template>
	<div>
		<div v-if="hasSummaryName" class="clippingBlock cards">
			<div v-if="!Use.UseMultiselect || (clipping.Region.Summary.Regions && clipping.Region.Summary.Regions.length == 1)">
				<div v-for="region in clipping.Region.Summary.Regions" :key="region.Id">
					<mp-close-button @click="removeRegion(region)" title="Quitar zona seleccionada" class="exp-hiddable-block" />

					<div class="clippingBlockHeader" style="font-size: 16px; line-height: 32px; margin-top: -2px;" :class="getColorMuted()">{{ region.TypeName }}</div>
					<div class="hand" :class="getColorMuted()" @click="fitRegion(region)" style="position: relative; line-height: 32px;margin-right: 20px;">
						<span style="font-size: 2em;">{{ region.Name }}</span>
					</div>
					<div class="exp-hiddable-block" style="top: 40px;right: 15px; position: absolute; font-size: 1.75em;">
						<ClippingSelectionSource v-if="region.Metadata && region.Metadata.Id"
																		 :useIcon="true" :region="region" :metadata="region.Metadata" />
					</div>
				</div>
			</div>
			<div v-else style="margin-right: -.32em" :style="'font-size: ' + clippingElementSize">

				<mp-close-button @click="clickQuitar" title="Quitar selección" class="exp-hiddable-block" />

				<button type="button" class="close lightButton exp-hiddable-block"
								title="Zoom a la selección" @click="fitSelection">
					<i class="fas fa-expand-arrows-alt" style="margin-left: 2px; margin-right: 2px;" />
				</button>

				<div v-for="region in clipping.Region.Summary.Regions" :key="region.Id" :class="getColorMuted()" class="clippingElement">
					<div style="position: relative; padding-right: 15px; ">
						<div @click="fitRegion(region)" v-if="clipping.Region.Summary.Regions.length < 8" class="clippingBlockHeader hand">{{ region.TypeName }}</div>
						<div @click="fitRegion(region)" class="hand">{{ region.Name }}</div>
						<mp-close-button @click="removeRegion(region)" title="Quitar zona seleccionada"
														 style="float: none; top: 0; margin-top: -2px; position: absolute; right: -2px; font-size: .75em" class="exp-hiddable-block" />
						<ClippingSelectionSource v-if="region.Metadata && region.Metadata.Id && !Embedded.Readonly" style="position: absolute;
										    bottom: -.4em; right: -1px" :region="region" :metadata="region.Metadata" />
					</div>
				</div>
			</div>
		</div>
		<div v-if="clipping.Region.Summary && selectedLevel()">
			<h3 class="title">
				<div class="summaryBlock">
					<div class="summaryRow">
						Habitantes <span class="pull-right" :class="getMuted()">
							<animatedNumber :value="population" />
						</span>
					</div>
					<div class="summaryRow">
						Hogares <span class="pull-right" :class="getMuted()">
							<animatedNumber :value="households" />
						</span>
					</div>
					<div class="summaryRow">
						Área (km<sup>2</sup>) <span class="pull-right" :class="getMuted()">
							<animatedNumber :value="areaKm2" format="km" />
						</span>
					</div>
				</div>
			</h3>

			<div class="sourceRow" style="padding-bottom: 0.6rem;">
				<div class="btn-group" style=" z-index: 100; background-color: white;">
					<button v-for="(level, index) in clipping.Region.Levels" type="button" :key="level.Id" :id="index"
									class="btn btn-default btn-xs exp-serie-item" :class="getActive(index)" @mouseup="changeClipping(index)"
									@click="falseChangeClipping(index)">
						{{ level.Revision }}
					</button>
				</div>
				<transition
										enter-active-class="animated quick zoomIn"
										leave-active-class="animated quick zoomOut">
					<div v-if="ShowMultiselectInfo" class="infoBoxHolder">
						<div class="infoBox">
							<mp-close-button title="Cerrar mensaje" @click="closeMultiselectInfo"
															 style="float: none; top: 0; margin-top: 0px;
																		position: absolute; right: 5px; font-size: 1.1em;" class="exp-hiddable-block" />

							Utilice CTRL+click para seleccionar varias zonas
						</div>
					</div>
				</transition>
				<ClippingSource :metadata="selectedLevel().Metadata" v-if="!Embedded.Readonly" />
			</div>
			<div class="coverageBox" v-if="selectedLevel().PartialCoverage">
				Cobertura: {{ selectedLevel().PartialCoverage }}.
			</div>
		</div>
	</div>
</template>

<script>
import ClippingSource from './clippingSource';
import ClippingSelectionSource from './clippingSelectionSource';
import AnimatedNumber from '@/public/components/controls/animatedNumber.vue';
import Cookies from 'js-cookie';

export default {
	name: 'clipping',
	components: {
		ClippingSource,
		ClippingSelectionSource,
		AnimatedNumber
	},
	props: [
		'clipping',
		'frame'
	],
	data() {
		return {
			hideMultiselectMsg: false
		};
	},
	computed: {
		hasSummary() {
			return this.clipping && this.clipping.Region && this.clipping.Region.Summary;
		},
		hasSummaryName() {
			return this.hasSummary && this.clipping.Region.Summary.Regions &&
				this.clipping.Region.Summary.Regions.length > 0 && this.clipping.Region.Summary.Regions[0].Name;
		},
		population() {
			if(this.hasSummary) {
				return this.clipping.Region.Summary.Population;
			} else {
				return 0;
			}
		},
		Use() {
			return window.Use;
		},
		Embedded() {
			return window.Embedded;
		},
		ShowMultiselectInfo() {
			var ret = Cookies.get('hideMultiselectMsg');
			if (this.hideMultiselectMsg || ret) {
				return false;
			}
			if (!Use.UseMultiselect) {
				return false;
			}
			if (window.innerWidth < 1600) {
				return false;
			}
			// muestra si hay una seleccionada
			return this.clipping.Region.Summary.Regions && this.clipping.Region.Summary.Regions.length == 1
				&& this.clipping.Region.Summary.Regions[0].Name;
		},
		clippingElementSize() {
			if (this.clipping.Region.Summary.Regions.length === 3) {
				return '2rem';
			} else if (this.clipping.Region.Summary.Regions.length > 3) {
				return '1.75rem';
			} else {
				return '2.5rem';
			}
		},
		households() {
			if(this.hasSummary) {
				return this.clipping.Region.Summary.Households;
			} else {
				return 0;
			}
		},
		areaKm2() {
			if(this.hasSummary) {
				return this.clipping.Region.Summary.AreaKm2;
			} else {
				return 0;
			}
		},
	},
		methods: {
		closeMultiselectInfo() {
				Cookies.set('hideMultiselectMsg', 1);
				this.hideMultiselectMsg = true;
		},
		getMuted() {
			if (this.clipping.IsUpdating === '1') {
				return ' text-muted';
			} else {
				return '';
			}
		},
		getColorMuted() {
			if (this.clipping.IsUpdating === '1') {
				return ' color-muted';
			} else {
				return '';
			}
		},
		getActive(index) {
			return {
				'active': this.clipping.Region.SelectedLevelIndex === index,
			};
		},
		selectedLevel() {
			return this.clipping.Region.Levels[this.clipping.Region.SelectedLevelIndex];
		},
		changeClipping(index) {
			this.clipping.Region.SelectedLevelIndex = index;
			window.SegMap.Clipping.ClippingChanged(true);
			window.SegMap.SaveRoute.UpdateRoute();
		},
		falseChangeClipping(index) {
			this.clipping.Region.SelectedLevelIndex = index;
		},
		clickQuitar() {
			if (window.SegMap.Clipping.FrameHasClippingCircle()) {
				window.SegMap.Clipping.ResetClippingCircle();
			} else {
				window.SegMap.Clipping.ResetClippingRegion();
			}
		},
		fitSelection() {
			window.SegMap.Clipping.FitEnvelope(this.clipping.Region.Envelope);
		},
		removeRegion(region) {
			if (window.SegMap.Clipping.FrameHasClippingCircle()) {
				window.SegMap.Clipping.ResetClippingCircle();
			} else {
				window.SegMap.Clipping.ResetClippingRegion(region.Id);
			}
		},
		fitRegion(region) {
			window.SegMap.Clipping.FitEnvelope(region.Envelope);
		},
	},
};
</script>

<style scoped>
	.clippingElement {
		display: inline-block;
		margin-right: .32em;
		margin-bottom: .32em;
		border: 1px solid #bbbbbb;
		box-shadow: 0 0 2px 0 #cbcbcb;
		min-width: 5em;
		line-height: 1.4em;
		color: #444444;
		border-radius: .2em;
		padding: .32em .32em .16em .32em;
		position: relative
	}

.clippingBlock
{
	color: #444;
	padding-top: 0px;
}
.clippingBlockHeader
{
	line-height: 1.2em;
	font-size: .52em;
}
	.infoBox {
		background-color: #eee;
		padding-top: 4px;
		padding-bottom: 4px;
		padding-right: 10px;
		padding-left: 2px;
		border-radius: 6px;
	}
	.infoBoxHolder {
		max-width: 40%;
		position: absolute;
		left: 100px;
		margin-left: auto;
		margin-right: auto;
		font-size: 12px;
		bottom: 2px;
		text-align: center;
		right: 0;
		z-index: 10;
		border-radius: 6px;
		padding: 0px;
	}
</style>

