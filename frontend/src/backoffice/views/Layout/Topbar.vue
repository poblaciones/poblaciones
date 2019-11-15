<template>
	<div id="topBarContainer">
		<div id="topBar" class="topbar">
			<user-info></user-info>
			<backoffice-links ></backoffice-links>
			<div style="float: left">
				<router-link :to="getBackRoute">
					<BackIcon class="icon" style="font-size: 28px; color: #fff" />
				</router-link>
			</div>
			<div class="titleLine">
				<span>
					{{ this.Work.properties.Metadata.Title }}
				</span>
			</div>
		</div>

		<stepper ref="TestStepper" title="Asistente de prueba">
		</stepper>
	</div>
</template>

<script>
import { mapGetters } from 'vuex';
import Context from '@/backoffice/classes/Context';
import BackIcon from '@/common/assets/back.svg';
import UserInfo from '@/backoffice/components/UserInfo';
import BackofficeLinks from '@/backoffice/components/BackofficeLinks.vue';

export default {
	name: 'topBar',
	components: {
		BackIcon,
		BackofficeLinks,
		UserInfo
	},
	computed: {
		Work() { return window.Context.CurrentWork; },
		getBackRoute() {
			if (this.Work.properties.Type == 'P') {
				return '/public';
			} else 	if (this.Work.properties.Type == 'R') {
				return '/';
			} else {
				throw new Error('Tipo de obra no reconocida para getBackRoute.');
			}
		}
	},
	mounted() {
		window.addEventListener('resize', this.handleResize);
		this.handleResize();
	},
	beforeDestroy() {
		window.removeEventListener('resize', this.handleResize);
	},
	data() {
		return {
			};
	},
	methods: {
		handleResize() {
			var parentwidth = document.getElementById('topBarContainer').offsetWidth;
			document.getElementById('topBar').style.width = parentwidth + 'px';
		},
		beginTest() {
			this.$refs.TestStepper.startUrl = this.Work.GetStartWorkTestUrl();
			this.$refs.TestStepper.stepUrl = this.Work.GetStepWorkTestUrl();
			this.$refs.TestStepper.Start();
		},
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

.titleLine {
	margin-left: 38px;
	color: white;
	white-space: nowrap;
	text-overflow: ellipsis;
	font-size: 24px;
	height: 1.14em;
	line-height: 1.2em;
	overflow: hidden;
}

#topBarContainer {
	position: fixed;
  top: 0px;
  left: 0px;
  width: 100%;
  z-index: 1002;
}
</style>

