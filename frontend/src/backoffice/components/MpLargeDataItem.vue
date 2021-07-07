<template>
	<md-button class="largeitem md-raised" @click="onClick">
		<div class="iconContainer">
			<i data-v-10cdbda8="" class="largeIco md-icon md-icon-font md-theme-default">{{ icon }}</i>
		</div>
		<div class="textbox">
			<div class="text" :title="(text.length > 40 ? text : '')">
				{{ text }}
			</div>
			<div class="edited" :title="logLegend">{{ logLegend }}</div>
		</div>
	</md-button>
</template>

<script>

import speech from '@/common/js/speech';

export default {
	name: 'MpLargeDataItem',
	components: {
		},
		data() {
			return {
				toggled: Boolean
			};
		},
		computed: {
			icon() {
				return (this.item.MetadataLastOnline === null ? 'edit' : 'public');
			},
			text() {
				return this.item.Caption;
			},
			logLegend() {
				return speech.FormatWorkInfo(this.item);
			}
		},
	methods: {
		onClick(e) {
			this.$emit('click', this.item);
		},
	},
  props: {
    item: Object,
	},
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

	.largeitem {
		width: 220px;
		height: 150px;
		white-space: normal;
		margin-left: 0px;
		margin-right: 15px;
	}
	.largeIco {
		font-size: 50px !important;
		margin-top: 18px;
	}
	.text {
		text-align: left;
		line-height: 1.15rem;
		font-size: 13px;
		height: 34px;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.edited {
		font-size: 12px;
		margin-top: 8px;
		color: #aaa;
		text-align: left;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.iconContainer {
		width: 190px;
		background-color: #d0cdcd40;
		margin-top: -60px;
		height: 65px;
		border-radius: 4px;
	}
	.textbox {
		position: absolute;
		margin-top: 6px;
		width: 180px;
	}

	.largeitem.md-button:not([disabled]).md-focused:before, .md-button:not([disabled]):active:before, .md-button:not([disabled]):hover:before {
		background-color: #e0e0e0;
		opacity: .2;
	}
</style>
