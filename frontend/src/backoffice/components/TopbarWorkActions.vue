<template>
	<div class="cartographyActions">
		<md-button v-if="Work.CanEdit()" class="md-icon-button actionIcon" @click="openCustomize">
			<md-icon>tune</md-icon>
			<md-tooltip md-direction="bottom">Personalizar</md-tooltip>
		</md-button>
		<md-button class="md-icon-button actionIcon" @click="openStats">
			<md-icon>bar_chart</md-icon>
			<md-tooltip md-direction="bottom">Estadísticas</md-tooltip>
		</md-button>
		<md-button v-if="Work.CanAdmin()" class="md-icon-button actionIcon" @click="openShare">
			<md-icon>person_add</md-icon>
			<md-tooltip md-direction="bottom">Compartir</md-tooltip>
		</md-button>
		<share-popup ref="sharePopup"></share-popup>
		<statistics-popup ref="statisticsPopup"></statistics-popup>
		<customize-popup ref="customizePopup"></customize-popup>
	</div>
</template>

<script>
import SharePopup from '@/backoffice/views/Permissions/SharePopup.vue';
import StatisticsPopup from '@/backoffice/views/Statistics/StatisticsPopup.vue';
import CustomizePopup from '@/backoffice/views/Customize/CustomizePopup.vue';

export default {
	name: 'TopbarWorkActions',
	components: {
		SharePopup,
		StatisticsPopup,
		CustomizePopup
	},
	computed: {
		Work() { return window.Context.CurrentWork; }
	},
	methods: {
		openCustomize() { this.$refs.customizePopup.show(); },
		openStats() { this.$refs.statisticsPopup.show(); },
		openShare() { this.$refs.sharePopup.show(); }
	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.cartographyActions {
	display: flex;
	align-items: center;
	margin-right: 6px;
}
.actionIcon { margin: 0 2px; }
.actionIcon .md-icon { color: #fff !important; }
</style>
