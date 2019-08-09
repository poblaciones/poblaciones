<template>
	<div id="topBarContainer">
		<div id="topBar" class="topbar">
			<div v-if="this.user" class="userInfo">
        <div>Usuario: {{ user.user }}</div>
				<div><a class="whiteLink" @click="logoff">Cerrar sesión</a></div>
      </div>
			<div style="padding-top: 2px; font-size: 24px; ">
					Bienvenido a Poblaciones
			</div>
		</div>

	</div>
</template>

<script>
import { mapGetters } from 'vuex';
import ActiveWork from '@/backoffice/classes/ActiveWork.js';

export default {
	name: 'topBar',
	components: {
	},
	data() {
		return {
			newName: '',
			};
	},
	computed: {
		user() {
			return window.Context.User;
		},
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
		},
		logoff() {
			var url = window.host + '/authenticate/logoff';
			document.location = url;
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

