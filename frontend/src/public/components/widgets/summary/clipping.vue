<template>
	<div>
		<div v-if="hasSummary && clipping.Region.Summary.Name && clipping.IsUpdating !== '1'" class="clippingBlock cards">
			<mp-close-button v-on:click="removeRegion" title="Quitar zona seleccionada" class="exp-hiddable-block" />

			<div class="clippingBlockHeader">{{ clipping.Region.Summary.TypeName }}</div>
			<div class="hand" v-on:click="fitRegion" style="position: relative; margin-right: 20px;">
				<span style="font-size: 2em;">{{ clipping.Region.Summary.Name }}</span>

			</div>
			<ClippingSource v-if="clipping.Region.Summary.Metadata && clipping.Region.Summary.Metadata.Id"
											:useIcon="true" :clipping="clipping" :metadata="clipping.Region.Summary.Metadata" />
		</div>
		<div v-if="clipping.Region.Summary && selectedLevel()">
			<h3 class="title">
			<div class="summaryBlock">
				<div class="summaryRow">
					Habitantes <span class="pull-right" :class="getMuted()">
						<animatedNumber :value="population" /></span>
				</div>
				<div class="summaryRow">
					Hogares <span class="pull-right" :class="getMuted()">
						<animatedNumber :value="households" /></span>
				</div>
				<div class="summaryRow">
					Área (km<sup>2</sup>) <span class="pull-right" :class="getMuted()">
						<animatedNumber :value="areaKm2" format="km" /></span>
				</div>
			</div>
			</h3>

			<div class="sourceRow">
				<div class="btn-group">
					<button v-for="(level, index) in clipping.Region.Levels" type="button" :key="level.Id" :id="index" class="btn btn-default btn-xs exp-serie-item" :class="getActive(index)" v-on:mouseup="changeClipping(index)" v-on:click="falseChangeClipping(index)">{{ level.Revision }}</button>
				</div>
				<ClippingSource :metadata="selectedLevel().Metadata" />
			</div>

			<div class="coverageBox" v-if="selectedLevel().PartialCoverage">
				Cobertura: {{ selectedLevel().PartialCoverage }}.
			</div>
		</div>
	</div>
</template>

<script>
import ClippingSource from './clippingSource';
import AnimatedNumber from '@/public/components/controls/animatedNumber.vue';

export default {
	name: 'clipping',
	components: {
		ClippingSource,
		AnimatedNumber
	},
	props: [
		'clipping',
		'frame'
	],
	data() {
		return {

		};
	},
	computed: {
		hasSummary() {
			return this.clipping && this.clipping.Region && this.clipping.Region.Summary;
		},
		population() {
			if(this.hasSummary) {
				return this.clipping.Region.Summary.Population;
			} else {
				return 0;
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
		getMuted() {
			if (this.clipping.IsUpdating === '1') {
				return ' text-muted';
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
		removeRegion(e) {
			e.preventDefault();
			if (window.SegMap.Clipping.FrameHasClippingCircle()) {
				window.SegMap.Clipping.ResetClippingCircle();
			} else {
				window.SegMap.Clipping.ResetClippingRegion();
			}
		},
		fitRegion(e) {
			e.preventDefault();
			window.SegMap.Clipping.FitCurrentRegion();
		},
	},
};
</script>

<style scoped>

.clippingBlock
{
	color: #444;
	padding-top: 0px;
}
.clippingBlockHeader
{
	font-size: 16px;
	line-height: 1.8em;
}
</style>

