<template>
	<div class="adminButton">
		<md-button @click="onPublish" v-if="Work.CanEdit() && Work.HasChanges()" class="md-raised">
			<md-icon>public</md-icon> Publicar cambios
		</md-button>
		<md-button @click="goMap" v-if="url" class="md-raised">
			<md-icon>map</md-icon> Visitar mapa {{ (Work.HasChanges() ? 'actual' : '') }}
		</md-button>
	</div>
</template>

<script>
import str from '@/common/js/str';

export default {
	name: 'backofficeLinks',
	components: {
	},
	data() {
		return {	};
	},
	computed: {
		Work() { return window.Context.CurrentWork; },
		url() {
			var ret = this.Work.properties.Metadata.Url;
			if (this.Work.properties.AccessLink) {
				ret += '/' + this.Work.properties.AccessLink;
			}
			return ret;
		},
		Keys() {
			return window.Context.Keys;
		}
	},
	methods: {
		absoluteMap(url) {
			return str.AbsoluteUrl(url);
		},
		goMap() {
				var url = this.url;
				window.open(url, '_blank');
		},
		onPublish() {
			window.openPublish();
		},
	},
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.adminButton {
	float: right;
	font-size: 12px;
	margin-right: 6px;
	margin-top: -12px;
}
</style>

