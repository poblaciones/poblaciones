<template>
	<div>
		<img style="display: none" ref="imageItem" src="../assets/finished.gif" >
		<md-dialog  :md-active.sync="showDialog" :md-click-outside-to-close="completed" @md-closed="OnClosed"
							 style="z-index: 10000!important">
			<md-dialog-title v-if="realTitle !== '' && realTitle !== null">{{ realTitle }}</md-dialog-title>
			<md-dialog-content style="height: 14.25rem;">
				<div class="md-layout">
					<div class="md-layout-item md-small-hide">
						<div style="width: 450px; height: 1px"></div>
					</div>
				</div>
				<center>
					<div v-if="error === '' && complete === false" v-show="hideProgress === false"
							 style="margin-top: 30px">

						<p>
							<md-progress-spinner v-if='totalSteps > 0' md-mode="determinate" :md-value="stepsPercentage"></md-progress-spinner>
							<md-progress-spinner v-else md-mode="indeterminate"></md-progress-spinner>
						</p>
						<p v-if='totalSteps > 0' style='font-size: 16px; font-weight: 600'>
							{{ Math.round(stepsPercentage) }}%
						</p>
					<p style='font-size: 16px;'>
							{{ status }}
						</p>
					</div>

					<div v-if="completed">
						<div style="height: 155px">
							<div v-if="error" style="max-width: 450px">
								<p>{{ error }}</p>
								<p>{{ errorDetail }}</p>
							</div>
							<div v-else="">
								<img style="width: 120px; margin-top: 16px" :src="imageSrc" alt="Listo">
							</div>
						</div>
						<div>
							<md-button v-if="visitUrl" class="md-raised" :href="visitUrl" target="_blank" @click="Close()">{{ visitCaption }}</md-button>
							<md-button v-else class="md-raised" v-show="useClose" @click="Close()">Continuar</md-button>
						</div>
					</div>
				</center>
			</md-dialog-content>
		</md-dialog>
	</div>
</template>

<script>

import axios from 'axios';
import err from '@/common/framework/err';
// util: https://ezgif.com/loop-count
// eventos: completed, closed

export default {
  name: 'stepper',
		data() {
			return {
				totalSteps: 0,
				step: 0,
				totalSlices: 0,
				slice: 0,
				titleByMethod: null,
				startUrl: '',
				stepUrl: '',
				args: [],
				errorDetail: '',
				status: '',
				imageSrc: '',
				clientSteps: [],
				visitCaption: '',
				visitUrl: '',
				url: '',
				key: '',
				error: '',
				result: null,
				completedPromise: null,
				complete: false,
				showDialog: false,
				hideProgress: false
			};
		},
		props: {
			title: String,
			useClose: { type: Boolean, default: true },
		},
	  methods: {
		Start(startupState) {
			// Se pone visible
			this.Reset(startupState);
			this.complete = false;
			this.result = null;
			this.showDialog = true;
			var loc = this;
			loc.completedPromise = null;
			// Inicia la nevagación
			var ret = new Promise(function (success, reject) {
				loc.Navigate(loc.startUrl, loc.args);
				loc.completedPromise = success;
			});
			return ret;
		},
		Close() {
			this.showDialog = false;
			this.Reset();
		},
		Reset(startupState) {
			this.totalSteps = 1;
			this.step = 0;
			this.totalSlices = 0;
			this.slice = 0;
			if (startupState) {
				this.status = startupState;
			} else {
				this.status = 'Iniciando';
			}
			this.url = '';
			this.imageSrc = '';
			this.key = '';
			this.visitUrl = '';
			this.visitCaption = '';
			this.error = '';
			this.hideProgress = false;
		},
		ShowCompleted() {
			this.hideProgress = true;
			this.complete = true;
			this.imageSrc = this.$refs.imageItem.src;
			this.OnCompleted();
		},
		ShowError(errMessage) {
			this.hideProgress = true;
			this.error = 'El proceso no ha podido ser completado.';
			this.errorDetail = errMessage;
		},
		OnClosed() {
			this.$emit('closed', this.complete);
		},
		OnCompleted() {
			if (this.completedPromise !== null) {
				this.completedPromise();
			}
			this.$emit('completed');
		},
		setTitle(title) {
			this.titleByMethod = title;
		},
		formatError(error) {
			var ret = error.message;
			if (error.response && error.response.data) {
				var msgtext = error.response.data.trim();
				if (msgtext.startsWith('[PE-E]:')) {
					ret = msgtext.substr(7).trim();
				}
			}
			if (ret == 'Request failed with status code 500') {
				ret = 'Si el problema persiste, escriba a contacto@poblaciones.org para recibir ayuda para resolver el incidente.';
			}
			return ret;
		},
		Navigate(url, args2) {
			let loc = this;
			axios.get(url, {
				params: args2,
				headers: { 'Full-Url': document.location.href }
			}).then(function (res) {
				if (res.data.visitUrl) {
					loc.visitUrl = res.data.visitUrl;
					loc.visitCaption = res.data.visitCaption;
				}
				if (res.data.stepperResult) {
					loc.result = res.data.stepperResult;
				}
				if (res.data.done) {
					loc.IterateLocalSteps().then(function () {
						loc.ShowCompleted();
					}).catch(function (error) {
						var errorText = loc.formatError(error);
						loc.ShowError(errorText);
						err.err('Stepper', error);
					});
				} else {
					loc.totalSteps = res.data.totalSteps;
					loc.totalSlices = res.data.totalSlices;
					loc.step = res.data.step;
					loc.slice = res.data.slice;
					loc.status = res.data.status;
					loc.key = res.data.key;

					let newUrl = loc.stepUrl + '?k=' + loc.key;
					loc.Navigate(newUrl, null);
				}
			}).catch(function (error) {
				var errorText = loc.formatError(error);
				loc.ShowError(errorText);
				err.err('Stepper', error);
			});
		},
		async IterateLocalSteps() {
			this.totalSlices = this.clientSteps.length;
			this.slice = 0;
			for (var step of this.clientSteps) {
				this.status = step.status;
				await step.do.apply(step.container);
				this.slice++;
			}
		}
  },
	computed: {
		completed() {
			return this.error !== '' || (!!this.complete);
		},
		realTitle() {
			return (this.titleByMethod !== null ? this.titleByMethod : this.title);
		},
		stepsPercentage() {
			if (this.totalSteps === 0) {
				return 0;
			}
			var ret = this.step;
			// Con los slices completa la proporción del paso actual que está completa.
			if (this.totalSlices > 0) {
				ret += this.slice / this.totalSlices;
			}
			return ret / this.totalSteps * 100;
		}
	},
};
</script>

<style lang="scss" scoped="">
	.md-dialog-container {

	}
</style>
