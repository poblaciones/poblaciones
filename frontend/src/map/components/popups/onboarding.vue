<template>
	<content-wizard
		ref="wizard"
		:steps="onboarding.Steps"
		:background-color="backgroundColor"
		next-label="SIGUIENTE"
		back-label="ANTERIOR"
		finish-label="FINALIZAR"
		@close="onWizardClose"
	/>
</template>

<script>
import ContentWizard from '@/common/components/ContentWizard';

export default {
	name: 'onboarding',
	components: { ContentWizard },
	props: ['work', 'backgroundColor'],
	data() {
		return {
			totalImagesRequested: 0
		};
	},
	computed: {
		onboarding() {
			return this.work.Current.Onboarding;
		}
	},
	mounted() {
		var loc = this;
		for (var step of this.onboarding.Steps) {
			if (step.ImageId) {
				this.totalImagesRequested++;
				this.getStepImage(step).then(function () {
					loc.totalImagesRequested--;
					loc.checkOpenTutorial();
				});
			}
		}
		loc.checkOpenTutorial();
	},
	methods: {
		getStepImage(step) {
			var loc = this;
			return window.SegMap.GetOnboardingStepImage(this.work.Current, step.ImageId).then(
				function (dataUrl) {
					step.previewImage = dataUrl.data;
				}
			);
		},
		checkOpenTutorial() {
			if (this.totalImagesRequested === 0) {
				if (this.work.Current.Tutorial.CheckOpenTutorial()) {
					this.$refs.wizard.show();
				}
			}
		},
		// Se llama al cerrar el asistente por cualquier medio (X, ESC, clic
		// fuera o Finalizar). "finished" indica que el cierre ocurrió estando
		// en el último paso, replicando el comportamiento original: el
		// tutorial se da por completado sin importar cómo se cerró, siempre
		// que ya se haya llegado al final.
		onWizardClose(event) {
			if (event && event.finished) {
				this.work.Current.Tutorial.DoneWithTutorial();
			}
		}
	}
};
</script>
