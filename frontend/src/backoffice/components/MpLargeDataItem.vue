<template>
	<md-button class="largeitem md-raised" @click="onClick" :style="(!showEdited ? 'height: 180px' : '')">
		<div class="iconContainer" :id="idContainer">
			<img :src="previewData" class="previewBox" v-if="isPublished && item.PreviewId && previewData" />
			<iframe v-if="isPublished && !failedLoading && !item.PreviewId" :id="frameId" frameborder="0" @load="checkLoaded"
							 :src="frameUrl"
							 class="previewBox"></iframe>
			<i v-else data-v-10cdbda8="" class="largeIco md-icon md-icon-font md-theme-default">{{ icon }}</i>
		</div>
		<div class="textbox">
			<div class="text" :title="(text.length > 40 ? text : '')">
				{{ text }}
			</div>
			<div class="edited" v-if="showEdited">
				{{ logLegend }}
				<md-tooltip md-direction="bottom">
					{{ logLegend }}
				</md-tooltip>
			</div>
		</div>
	</md-button>
</template>
<script>
import speech from '@/common/js/speech';
import html2canvas from 'html2canvas';

export default {
	name: 'MpLargeDataItem',
	components: {
		},
		data() {
			return {
				toggled: Boolean,
				failedLoading: false,
				previewData: null,
			};
		},
		mounted() {
			var loc = this;
			if (this.item.PreviewId) {
				if (this.item.previewData) {
					this.previewData = this.item.previewData;
				} else {
					window.Db.GetWorkPreview(this.item.Id).then(function (data) {
						if (data.DataUrl) {
							loc.previewData = data.DataUrl;
							loc.item.previewData = loc.previewData;
						}
					});
				}
			}
		},
		computed: {
			idContainer() {
				return this._uid + "_container";
			},
			Work() { return window.Context.CurrentWork; },
			frameId() {
				return this._uid + "_frame";
			},
			frameUrl() {
				var url = '/map/' + this.item.Id + '01/';
				if (this.item.AccessLink) {
					url += this.item.AccessLink;
				}
				url += '?emb=1&pv=1#/';
				return url;
			},
			isPublished() {
				return this.item.MetadataLastOnline !== null;
			},
			icon() {
				return (!this.isPublished ? 'edit' : 'public');
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
		checkLoaded() {
			var frame = document.getElementById(this.frameId);
			if (frame) {
				var title = frame.contentDocument.title;
				if (title === 'Poblaciones - Atención') {
					this.failedLoading = true;
				}
			}
		}
	},
  props: {
		item: Object,
		showEdited: { type: Boolean, default: true },
	},
};
</script>
<style rel="stylesheet/scss" lang="scss" scoped>
	.largeitem {
		width: 220px;
		height: 202px;
		white-space: normal;
		margin-left: 0px;
		margin-right: 15px;
	}
	.largeIco {
		font-size: 50px !important;
		margin-top: 38px;
		color: #a2a2a2;
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
		line-height: 1.15rem;
		margin-top: 8px;
		color: #aaa;
		text-align: left;
		overflow: hidden;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}
	.iconContainer {
		width: 220px;
		background-color: #d0cdcd40;
		margin-top: -98px;
		height: 105px;
		overflow: hidden;
		border-radius: 4px 4px 0px 0px;
	}
	.textbox {
		position: absolute;
		padding: 10px 15px ;
	}
	.largeitem:hover {
		box-shadow: 0 3px 3px -2px rgba(0, 0, 0, .20), 0 3px 4px 0 rgba(0, 0, 0, .14), 0 1px 8px 0 rgba(0, 0, 0, .12);
	}

	.largeitem.md-button:not([disabled]).md-focused:before, .md-button:not([disabled]):active:before, .md-button:not([disabled]):hover:before {
		background-color: #d0d0d0;
		opacity: .15;
	}

	.previewBox {
		height: 260px;
		width: 380px;
		pointer-events: none;
		margin-top: -70px;
	}
</style>
