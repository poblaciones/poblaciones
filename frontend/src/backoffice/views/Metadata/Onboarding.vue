<template>
	<div>
		<invoker ref="invoker"></invoker>
		<title-bar title="Bienvenida" :showReadonlyIndexedWarning="Work.ReadOnlyCausedByIndexing()" help="<p>La sección de bienvenida permite
			definir un asistente de hasta cinco pasos para resumir al visitante el contenido
		de la cartografía.</p>
		<p>
			Si no establece contenidos para el asistente de bienvenida, el mismo no será mostrado
		a los visitantes de la cartografía.
		</p>" />

		<div class="app-container">
			<div class="md-layout md-gutter">
				<div class="md-layout-item md-size-100">
					<md-card>
						<md-card-content>

							<div>
								<md-tabs md-sync-route ref="tabs">
									<md-tab v-for="step, index in stepDefinitions" :key="step.Id" style='flex: 1 0 100% !important;'
													:id="step.Id" :md-label="step.Label"
													:to="makePath(step.Id)" :md-active="isPath(makePath(step.Id))">
										<onboarding-step :stepDefinition="step"
																		 :step="Work.Onboarding.Steps[index]" />
									</md-tab>
								</md-tabs>
							</div>
						</md-card-content>
					</md-card>
				</div>
			</div>
		</div>


	</div>
</template>

<script>
	import OnboardingStep from '@/backoffice/components/OnboardingStep';

export default {
	name: 'onboarding',
	components: {
		OnboardingStep
		},
		mounted() {
			this.checkDefinitions();
	},
	data() {
		return {
			stepDefinitions: [{ Id: 'step1', Label: 'Paso 1', Helper: 'En el primer paso puede ser una buena idea poner en contexto la temática o destacar la importancia del problema que trata la cartografía.' },
				{ Id: 'step2', Label: 'Paso 2', Helper: 'En el segundo paso puede ser útil indicar cómo se abordó el problema (estrategia, proyecto o relevamiento llevado adelante).' },
				{ Id: 'step3', Label: 'Paso 3', Helper: 'Aquí resumir brevemente los resultados alcanzados.' },
				{ Id: 'step4', Label: 'Paso 4', Helper: 'El cuarto paso puede facilitar algún consejo de uso.' },
				{ Id: 'step5', Label: 'Paso 5', Helper: 'Finalmente, se sugiere indicar alguna información de contacto, agradecimiento y/o autoría.' }			]
			};
	},
	computed: {
		Work() {
			return window.Context.CurrentWork;
		},
	},
		methods: {
			checkDefinitions() {
				if (this.stepDefinitions.length < this.Work.Onboarding.Steps.length) {
					while (this.stepDefinitions.length < this.Work.Onboarding.Steps.length) {
						var n = this.stepDefinitions.length + 1;
						var extra = { Id: 'step' + n, Label: 'Paso ' + n, Helper: '' };
						this.stepDefinitions.push(extra);
					}
				}
			},
		isPath(path) {
			if (this.$refs.tabs) {
				for (var n = 1; n <= this.stepDefinitions.length; n++) {
					if (this.$route.path.endsWith('/step' + n)) {
						this.$refs.tabs.activeTab = 'step' + n;
					}
			}
			}
			return this.$route.path === path;
		},
		makePath(relativePath) {
			if (!this.Work) {
				return '';
			} else {
				return '/cartographies/' + this.Work.properties.Id + '/onboarding'
					+ (relativePath === '' ? '' : '/') + relativePath;
			}
		},
		Update() {
      this.$refs.invoker.doSave(this.Work, this.Work.UpdateOnboarding);
		}
	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.md-tab {
	flex: 1 0 101% !important;
	}

.topToolbar {
	position: fixed;
	padding-top: 4px;
	padding-bottom: 1px;
	line-height: 1.25;
	font-size: 25px;
	color: #676767;
	width: 100%;
	margin-top: -3px;
	z-index: 10;
	background-color: #f5f5f5;
	}

.badge {
  padding: 2px 6px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 6px;
  right: 6px;
  background: #b7b7b7;
  border-radius: 6px;
  color: #fff;
  font-size: 10px;
  font-style: normal;
  font-weight: 600;
  letter-spacing: -.05em;
  font-family: 'Roboto Mono', monospace;
}
</style>

