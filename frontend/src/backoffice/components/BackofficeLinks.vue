<template>
	<div class="adminButton">
		<md-button @click="onPublish" v-if="Work.CanEdit() && Work.HasChanges()" class="md-raised">
			<md-icon>public</md-icon> Publicar cambios
		</md-button>
		<md-button @click="goMap" v-if="lastOnline" class="md-raised">
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
		lastOnline() { return this.Work.properties.Metadata.LastOnline !== null; },
		Work() { return window.Context.CurrentWork; },
		Keys() {
			return window.Context.Keys;
		}
	},
	methods: {
		goMap() {
			var url = this.Work.PublicUrl();
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

