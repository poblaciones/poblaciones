<template>
	<div>
		<invoker ref="invoker"></invoker>
		<title-bar title="Información" help="<p>
						Los datos publicados en la plataforma deben poder ser referenciado por quienes hacen
						uso de ellos.
						</p><p>
							Para ello, cada conjunto de datos posee un conjunto de metadatos que
							describe su origen, autores y contenidos. Estos metadatos se organizan para su carga
							en Contenido, Atribución, Resumen, Fuentes y Adjuntos.
						</p>" />

		<div class="app-container">
			<div class="md-layout md-gutter">
				<div class="md-layout-item md-size-100">
					<md-card>
						<md-card-content>

							<div>
								<md-tabs md-sync-route ref="tabs">
									<template slot="md-tab" slot-scope="{ tab }">
										{{ tab.label }}
										<i class="badge" v-if="tab.data.badge">{{ tab.data.badge }}</i>
										<mp-help :text="tab.data.help" :large="true" />
									</template>
									<md-tab v-for="step in stepDefinitions" :key="step.Id"
													style='flex: 1 0 100% !important; overflow-x: auto; padding-top: 0px;'
													:id="step.Id" :md-label="step.Label"
													:to="makePath(step.Id)" :md-active="isPath(makePath(step.Id))"
													:md-template-data="{ help: step.Helper }">
										<Content v-if="step.Id == 'content'" />
										<Attribution v-if="step.Id == 'attribution'" />
										<Abstract v-if="step.Id == 'abstract'" />
										<SourcesList v-if="step.Id == 'sources'" />
										<Attachments v-if="step.Id == 'attachments'" />
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
	import Content from './Content';
	import Attribution from './Attribution';
	import Abstract from './Abstract';
	import Attachments from './Attachments';
	import SourcesList from './Sources';

export default {
	name: 'onboarding',
	components: {
		Content,
		Attribution,
		SourcesList,
		Abstract,
		Attachments
		},
		mounted() {
	},
	data() {
		return {
			stepDefinitions: [{
				Id: 'content', Label: 'Contenido', Helper: `
						<p>
							En la sección de Contenido
							se indica el título del conjunto de datos, un breve resumen de su contenido e información
							sobre su nivel de cobertura.
						</p>` },
				{
					Id: 'attribution', Label: 'Atribución', Helper: `<p>
								La atribución permite indicar los autores individuales y opcionalmente la atribución institucional de los datos publicados.
							</p><p>
									La información de contacto hace accesible a los usuarios de la información un canal de comunicación con los responsables de los datos para poder realizar consultas o realimentar el proceso de producción de la información.
								</p><p>
									La declaración de licencia permite que quienes descarguen la información tengan un marco explícito del alcance con el que pueden utilizar los datos obtenidos de la plataforma.
								</p>` },
									{
					Id: 'abstract', Label: 'Resumen', Helper: `<p>El resumen permite explicitar información sobre la elaboración de
								los datos publicados, sus motivaciones o hipótesis, así como detalles de su nivel de cobertura,
							 su estructura o consideraciones para su interpretación o uso. </p>
								<p>Esta información es ofrecida a los usuarios dentro del archivo en formato PDF que el
								sitio genera automáticamente con los metadatos de cada conjunto de datos accedido.
								</p>` },
				{ Id: 'sources', Label: 'Fuentes secundarias', Helper: `
							 <p>
								 La sección de fuentes` + this.SecondaryLabel + ` permite ofrecer la lista de datos o documentación en la que se apoyó
								 la construcción de la información puesta a disposición.
							 </p><p>
								 De esta forma, pueden consignarse como fuentes secundarias censos, encuestas o
								 cartografías que hayan sido empleadas para el armado de los datos ofrecidos.
							 </p>` },
				{
					Id: 'attachments', Label: 'Adjuntos', Helper: `<p>
						La sección de adjuntos permite agregar archivos que complementen la comprensión o descripción
						de los datos puestos a disposición.
						</p><p>Estos pueden incluir artículos publicados en base a los mismos datos, informes del trabajo de
						campo, especificación del muestreo o las herramientas utilizadas para la construcción de la información,
						cuestionarios, tablas detalladas de códigos o descriptores geográficos, entre otros.
						</p><p>No debe incluirse aquí un adjunto con los metadatos generales ni con las listas de variables
						de los datasets ya que dicha información se brinda a los usuarios en forma automática.
						</p><p>El tipo de archivo permitido es Acrobat/PDF.
					</p>` }			]
			};
	},
	computed: {
		Work() {
			return window.Context.CurrentWork;
		},
		SecondaryLabel() {
			return (this.Work.IsPublicData() ? '' : ' secundarias');
		},
	},
		methods: {
		isPath(path) {
			if (this.$refs.tabs) {
				for (var step of this.stepDefinitions) {
					if (this.$route.path.endsWith('/' + step.Id)) {
						this.$refs.tabs.activeTab = step.Id;
						break;
					}
				}
			}
			return this.$route.path === path;
		},
		makePath(relativePath) {
			if (!this.Work) {
				return '';
			} else {
				return '/cartographies/' + this.Work.properties.Id + '/metadata'
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

