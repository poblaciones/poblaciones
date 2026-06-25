<template>
	<div class="adminButton">
		<md-button @click="onPublish" v-if="Work.CanEdit() && Work.HasChanges()" class="md-raised">
			<md-icon>public</md-icon> Publicar cambios
		</md-button>
		<md-button @click="goMap" v-if="lastOnline" class="md-raised">
			<md-icon>map</md-icon> Ver en mapa
		</md-button>
		<md-button @click="goTable" v-if="lastOnline && usePivot" class="md-raised">
			<md-icon>map</md-icon> Ver en tablero
		</md-button>
	</div>
</template>

<script>
import str from '@/common/framework/str';

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
		},
		usePivot() {
			return window.Context.Configuration.UsePivot;
		}
	},
	methods: {
		goMap() {
			var url = this.Work.PublicUrl();
			var target = this.Work.PreviewTableTarget();
			window.open(url, target);
		},
		goTable() {
			var url = this.Work.PublicTableUrl();
			var target = this.Work.PreviewTableTarget();
			window.open(url, target);
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
		padding-top: 12px;
		margin-right: 6px;
		margin-top: -12px;
	}
</style>

