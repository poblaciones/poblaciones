<template>
	<div v-if="dt">
		<feature-info :dt='detail' v-if='showDetail' @clickBack='doCloseInfo' />
		<div class='mp-surface mp-surface--padded' :class="(enabled ? '' : 'mp-dimmed')" v-else>

			<div class='stats' style="padding-top: 8px">{{ dt.Type }}</div>
			<div class='titleDialog'>
				<mp-close-button @click="doClose" class="exp-hiddable-block" />
				<mp-label :text="'' + title" />
			</div>
			<div v-for="(item, index) in dt.Items" :key="item.Name">
				<div @click="doCloseItem(index)" class='fa fa-times hand' style='float:right;margin:5px'></div>
				<div class='item hand' @click='openDetail(item)'>
					{{ item.Name }}
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import FeatureInfo from './featureInfo';
import h from '@/map/js/helper';

export default {
	name: 'featureList',
	props: [
		'dt',
		'enabled'
	],
	components: {
		FeatureInfo,
	},
	data() {
		return {
			showDetail: false,
			detail: {},
		};
	},
	// created () { },
	// beforeDestroy () { },
	mounted() {
		this.startWithDetail();
	},
	computed: {
		title() {
			if (this.dt.Title) {
				return this.dt.Title;
			} else if (this.dt.Code) {
				return this.dt.Code;
			}
			return '';
		},
	},
	methods: {
		doClose(e) {
			e.preventDefault();
			this.$emit('clickClose', e, this.dt.fid);
		},
		doCloseItem(index) {
			this.dt.Items.splice(index, 1);
		},
		doCloseInfo(e) {
			this.showDetail = false;
			this.detail = {};
		},
		openDetail(item) {
			this.showDetail = true;
			item.dt.back = true;
			this.detail = item.dt;
		},
		startWithDetail() {
			if(this.dt !== null
				&& this.dt.detailIndex != null) {
				this.openDetail(this.dt.Items[this.dt.detailIndex]);
				this.dt.detailIndex = null;
			}
		},
	},
	watch: {
		dt() {
			this.startWithDetail();
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
.item {
	padding-top: 1px;
	padding-bottom: 10px
}
</style>

