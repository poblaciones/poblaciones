<template>
	<div v-if="dt">
		<feature-info :dt='detail' v-if='showDetail' @clickBack='doCloseInfo' />
		<div class='info' v-else>
			<mp-close-button v-on:click="doClose" />

			<div class='type'>{{ dt.Type }}</div>
			<div class='title'>{{ title }}</div>
			<div v-for="(item, index) in dt.Items" :key="item.Name">
				<div v-on:click="doCloseItem(index)" class='fa fa-times hand' style='float:right;margin:5px'></div>
				<div class='item hand' v-on:click='openDetail(item)'>
					{{ item.Name }}
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import FeatureInfo from './featureInfo';
import h from '@/public/js/helper';

export default {
	name: 'featureList',
	props: [
		'dt',
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
			console.log('llego');
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
.info {
	border-radius: 6px;
	border: solid 1px;
	margin:4px;
	overflow-y:auto;
}
.type {
	padding-bottom: 0px;
	padding-top: 2px;
	font-size: 9px;
	text-transform: uppercase;
	text-align: center;
}
.title {
	padding-bottom: 3px;
	padding-top: 2px;
	font-size: 15px;
	font-weight: 500;
	text-align: center;
	font-weight: bold;
}
.item {
	margin-left: 10px;
	padding-top: 4px;
	border-radius: 6px;
	border: solid 1px;
	margin:4px;
}
</style>

