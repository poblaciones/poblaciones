<template>
	<div>
		<div v-if="hasSummary && clipping.Region.Summary.Name && clipping.IsUpdating !== '1'" class="clippingBlock cards">
			<button title="Quitar zona seleccionada" type="button" v-on:click="removeRegion" class="close buttonMargin">
				<close-icon title="Quitar"/>
			</button>
			<div class="clippingBlockHeader">{{ clipping.Region.Summary.TypeName }}</div>
			<div class="hand" v-on:click="fitRegion" style="position: relative; margin-right: 20px;" >
				<span style="font-size: 2em;">{{ clipping.Region.Summary.Name }}</span>

			</div>
			<ClippingSource v-if="clipping.Region.Summary.Metadata && clipping.Region.Summary.Metadata.Id"
					 :useIcon="true" :clipping="clipping" :metadata="clipping.Region.Summary.Metadata" />
		</div>
		<div v-if="clipping.Region.Summary && selectedLevel()">
			<h4 class="title">
			<div class="summaryBlock">
				<div class="summaryRow">
					Habitantes <span class="pull-right" :class="getMuted()">
						<animatedNumber v-bind:value="population" /></span>
				</div>
				<div class="summaryRow">
					Hogares <span class="pull-right" :class="getMuted()">
						<animatedNumber v-bind:value="households" /></span>
				</div>
				<div class="summaryRow">
					Área (km<sup>2</sup>) <span class="pull-right" :class="getMuted()">
						<animatedNumber v-bind:value="areaKm2" format="km" /></span>
				</div>
			</div>
			</h4>

			<div class="sourceRow">
				<div class="btn-group">
					<button v-for="(level, index) in clipping.Region.Levels" type="button" :key="level.Id" :id="index" class="btn btn-default btn-xs" :class="getActive(index)" v-on:mouseup="changeClipping(index)" v-on:click="falseChangeClipping(index)">{{ level.Revision }}</button>
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
import ClippingSource from '@/public/components/widgets/clippingSource';
import CloseIcon from 'vue-material-design-icons/close.vue';
import AnimatedNumber from './animatedNumber.vue';

export default {
	name: 'clipping',
	components: {
		ClippingSource,
		CloseIcon,
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
			window.SegMap.Clipping.ClippingChanged();
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
.buttonMargin {
	margin-right: -2px;
}
</style>

