<template>
	<div id="topBarContainer">
		<div id="topBar" class="topbar" :style="(backColor ? 'background-color: ' + backColor : '')">
			<user-info></user-info>
			<admin-links v-if="showAdminButton"></admin-links>
			<div style="padding-top: 2px; font-size: 24px; ">
					{{ welcomeMessage }}
			</div>
		</div>

	</div>
</template>

<script>
import { mapGetters } from 'vuex';
import ActiveWork from '@/backoffice/classes/ActiveWork.js';
import UserInfo from '@/backoffice/components/UserInfo';
import AdminLinks from '@/backoffice/components/AdminLinks';

export default {
	name: 'topBar',
	components: {
		UserInfo,
		AdminLinks
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
	.barIco
	{
	margin-top: -10px;
	}
	.barIco .md-button-content > i
	{
		color: #FFF;
	}
</style>

