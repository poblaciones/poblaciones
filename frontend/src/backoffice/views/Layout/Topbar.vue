<template>
	<div id="topBarContainer">
		<div id="topBar" class="topbar">
			<user-info></user-info>
			<backoffice-links></backoffice-links>
			<div style="float: left">
				<router-link :to="getBackRoute">
					<BackIcon class="icon" style="font-size: 28px; color: #fff" />
				</router-link>
			</div>
			<div class="titleLine">
				<div class="md-layout md-gutter" style="margin-top: -21px">
					<div class="md-layout-item md-size-100">
						<mp-text id="whiteId" :canEdit="Work.CanEdit()" label="t" :largeFont="true" :maxlength="150" class="fieldWhite"
										 :required="true" @update="UpdateTitle"
										 v-model="Work.properties.Metadata.Title" />
					</div>
				</div>
			</div>
		</div>
		<invoker ref="invoker"></invoker>
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
		UpdateTitle() {
			var loc = this;
			this.$refs.invoker.do(this.Work,
				this.Work.UpdateMetadata).then(function () {
					window.Db.RenameWork(loc.Work.properties.Id, loc.Work.properties.Metadata.Title);
				});
			return true;
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

.fieldWhite {
	-webkit-text-fill-color: white!important;
	font-size: 24px!important;
}

.fieldWhite .md-input {
	-webkit-text-fill-color: white!important;
}

.titleLine {
	margin-left: 38px;
	color: white;
	white-space: nowrap;
	text-overflow: ellipsis;
	font-size: 24px;
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

