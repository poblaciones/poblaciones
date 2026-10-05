<template>
	<div id="topBarContainer">
		<div id="topBar" class="topbar welcome-topbar">
			<topbar-logo />
			<div class="welcome-actions">
				<admin-links v-if="showAdminButton" :current="current"></admin-links>
				<home-menu></home-menu>
				<profile-menu></profile-menu>
			</div>
		</div>
	</div>
</template>

<script>
import { mapGetters } from 'vuex';
import ActiveWork from '@/backoffice/classes/ActiveWork.js';
import AdminLinks from './AdminLinks';
import ProfileMenu from '@/backoffice/views/Account/ProfileMenu.vue';
import HomeMenu from '@/backoffice/views/Account/HomeMenu.vue';
import TopbarLogo from '@/backoffice/components/TopbarLogo.vue';

export default {
	name: 'topBar',
	components: {
		AdminLinks,
		ProfileMenu,
		HomeMenu,
		TopbarLogo
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
		current: { type: String, default: '' },
		offerAdminLink: { type: Boolean, default: false }
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
.welcome-topbar {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 0 20px;
}

.welcome-actions {
	display: flex;
	flex: 0 0 auto;
	margin-left: auto;
	align-items: center;
	white-space: nowrap;
}
</style>
