<template>
	<div id="topBarContainer">
		<div id="topBar" class="topbar">
			<user-info></user-info>
			<div style="padding-top: 2px; font-size: 24px; ">
					Bienvenido a Poblaciones
			</div>
		</div>

	</div>
</template>

<script>
import { mapGetters } from 'vuex';
import ActiveWork from '@/backoffice/classes/ActiveWork.js';
import UserInfo from './UserInfo';

export default {
	name: 'topBar',
	components: {
		UserInfo
	},
	data() {
		return {
			newName: '',
			};
	},
	computed: {
		...mapGetters([
		'sidebar',
		'avatar'
		])
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

