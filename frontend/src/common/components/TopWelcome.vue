<template>
	<div id="topBarContainer">
		<div id="topBar" class="topbar" :style="(backColor ? 'background-color: ' + backColor : '')">
			<div class="topRight">
				<admin-links v-if="showAdminButton"></admin-links>
				<profile-menu></profile-menu>
			</div>
			<div style="padding-top: 4px; font-size: 1.5em;">
				{{ welcomeMessage }}
			</div>
		</div>
	</div>
</template>

<script>
import { mapGetters } from 'vuex';
import ActiveWork from '@/backoffice/classes/ActiveWork.js';
import AdminLinks from './AdminLinks';
import ProfileMenu from '@/backoffice/views/Account/ProfileMenu.vue';

export default {
	name: 'topBar',
	components: {
		AdminLinks,
		ProfileMenu
	},
	data() {
		return {
			newName: ''
		};
	},
	computed: {
		...mapGetters([
			'sidebar',
			'avatar'
		]),
		user() {
			return window.Context.User;
		},
		showAdminButton() {
			return this.user && this.offerAdminLink && window.Context.CanAccessAdminSite();
		},
	},
	props: {
		welcomeMessage: { type: String, default: 'Bienvenido a Poblaciones' },
		offerAdminLink: { type: Boolean, default: false },
		backColor: { type: String, default: null }
	},
	mounted() {
		window.addEventListener('resize', this.handleResize);
		this.handleResize();
	},
	beforeDestroy() {
		window.removeEventListener('resize', this.handleResize);
	},
	methods: {
		handleResize() {
			var parentwidth = document.getElementById('topBarContainer').offsetWidth;
			document.getElementById('topBar').style.width = parentwidth + 'px';
		}
	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.barIco {
	margin-top: -10px;
}
.barIco .md-button-content > i {
	color: #FFF;
}
/* La zona derecha es absoluta igual que en Topbar.vue,
   para no desplazar el mensaje de bienvenida. */
.topRight {
	position: absolute;
	top: -2px;
	right: 10px;
	display: flex;
	flex-direction: row;
	align-items: center;
	height: 55px;
	z-index: 1;
}
</style>
