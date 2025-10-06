<template>
	<div>
		<invoker ref="invoker"></invoker>
		<title-bar :title="resolveTitle" :showReadonlyIndexedWarning="readOnlyCausedByIndexing()" :help="`<p>
						Los datos publicados en la plataforma deben poder ser referenciado por quienes hacen
						uso de ellos.
						</p><p>
							Para ello, cada conjunto de datos posee un conjunto de metadatos que
							describe su origen, autores y contenidos. Estos metadatos se organizan para su carga
							en Contenido, Atribución, Resumen, Fuentes y Adjuntos.
						</p>` + extraHelp('MetadataSection')" />

		<div class="app-container">
			<div class="md-layout md-gutter">
				<div class="md-layout-item md-size-100">
					<md-card>
						<md-card-content>

							<div v-if="Metadata">
								<md-tabs :md-sync-route="hasCurrentWork" ref="tabs">
									<template slot="md-tab" slot-scope="{ tab }">
										{{ tab.label }}
										<i class="badge" v-if="tab.data.badge">{{ tab.data.badge }}</i>
										<mp-help :text="tab.data.help" :large="true" />
									</template>
									<md-tab @click="setTab(step)" v-for="step in stepDefinitions" :key="step.Id"
													style='flex: 1 0 100% !important; overflow-x: auto; padding-top: 0px;'
													:id="step.Id" :md-label="step.Label"
													:to="makePath(step.Id)" :md-active="isPath(makePath(step.Id)) || currentTab == step.Id"
													:md-template-data="{ help: step.Helper }">
										<Content v-if="step.Id == 'content'" :canEdit='canEdit' :Metadata="Metadata" />
										<Attribution v-if="step.Id == 'attribution'" :canEdit='canEdit' :Metadata="Metadata" />
										<InstitutionsList v-if="step.Id == 'institutions'" :canEdit='canEdit' :Metadata="Metadata" />
										<Abstract v-if="step.Id == 'abstract'"  :canEdit='canEdit' :useComplexAbstract='false' :Metadata="Metadata" />
										<SourcesList v-if="step.Id == 'sources'" :canEdit='canEdit' :Metadata="Metadata" />
										<Attachments v-if="step.Id == 'attachments'" :canEdit='canEdit' :Metadata="Metadata" />
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
	import InstitutionsList from './Institutions';
	import Abstract from './Abstract';
	import Attachments from './Attachments';
	import SourcesList from './Sources';

export default {
		name: 'metadata',
		components: {
			Content,
			Attribution,
			SourcesList,
			InstitutionsList,
			Abstract,
			Attachments
		},
		props: ['metadataProperty', 'canEditProperty' ],
		created() {
			if (Context.CurrentWork) {
				this.Metadata = Context.CurrentWork.Metadata;
				this.canEdit = Context.CurrentWork.Metadata.Work.CanEdit();
			} else {
				this.Metadata = this.metadataProperty;
				this.canEdit = this.canEditProperty;
			}
		},
		mounted() {
		},
	data() {
		return {
			canEdit: false,
			Metadata: null,
			currentTab: 'institutions',
			stepDefinitions: [{
				Id: 'content', Label: 'Contenido', Helper: `
						<p>
							En la sección de Contenido
							se indica el título del conjunto de datos, un breve resumen de su contenido e información
							sobre su nivel de cobertura.
						</p>` + this.extraHelp('MetadataContentSection') },
				{
					Id: 'attribution', Label: 'Atribución', Helper: `<p>
								La atribución permite indicar los autores individuales, la licencia utilizada y la información de contacto.
							</p><p>
									La información de contacto hace accesible a los usuarios de la información un canal de comunicación con los responsables de los datos para poder realizar consultas o realimentar el proceso de producción de la información.
								</p><p>
									La declaración de licencia permite que quienes descarguen la información tengan un marco explícito del alcance con el que pueden utilizar los datos obtenidos de la plataforma.
								</p>` + this.extraHelp('MetadataAttributionSection') },
					{
						Id: 'institutions', Label: 'Instituciones', Helper: `<p>La sección de instituciones permite indicar qué
								instituciones participaron o dieron apoyo a la producción de la información. </p>
							<p>Para cada una de ellas puede especificarse la información de contacto y opcionalmente una imagen para incorporar al pie de la cartografía.
							</p>`  + this.extraHelp('MetadataInstitutionsSection') },
								{
					Id: 'abstract', Label: 'Resumen', Helper: `<p>El resumen permite explicitar información sobre la elaboración de
								los datos publicados, sus motivaciones o hipótesis, así como detalles de su nivel de cobertura,
							 su estructura o consideraciones para su interpretación o uso. </p>
								<p>Esta información es ofrecida a los usuarios dentro del archivo en formato PDF que el
								sitio genera automáticamente con los metadatos de cada conjunto de datos accedido.
								</p>`  + this.extraHelp('MetadataAbstractSection') },
				{ Id: 'sources', Label: 'Fuentes secundarias', Helper: `
							 <p>
								 La sección de fuentes` + this.SecondaryLabel + ` permite ofrecer la lista de datos o documentación en la que se apoyó
								 la construcción de la información puesta a disposición.
							 </p><p>
								 De esta forma, pueden consignarse como fuentes secundarias censos, encuestas o
								 cartografías que hayan sido empleadas para el armado de los datos ofrecidos.
							 </p>`  + this.extraHelp('MetadataSourcesSection') },
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
					</p>` + this.extraHelp('MetadataAttachmentsSection') }			]
			};
	},
	computed: {
		SecondaryLabel() {
			return (this.useComplexAbstract ? '' : ' secundarias');
		},
		hasCurrentWork() {
			return Context.CurrentWork != null;
		},
		resolveTitle() {
			if (this.hasCurrentWork) {
				return 'Información';
			} else {
				return this.Metadata.properties.Title + ". Id: " + this.Metadata.properties.Id;
			}
		}
	},
		methods: {
			extraHelp(section) {
				if (window && window.Context.HelpLinkSection) {
					return window.Context.HelpLinkSection(window.Context.Configuration.Help[section]);
				} else {
					return '';
				}
			},

			start(metadata, canEdit) {
				this.canEdit = canEdit;
				this.Metadata = metadata;
			},
			readOnlyCausedByIndexing() {
				if (this.Metadata && this.Metadata.Work) {
					return this.Metadata.Work.ReadOnlyCausedByIndexing();
				} else {
					return false;
				}
			},
			setTab(step) {
				if (this.hasCurrentWork) {
					return;
				}
				this.currentTab = step.Id;
				this.$refs.tabs.activeTab = step.Id;
			},
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
			if (! (this.Metadata && this.Metadata.Work)) {
				return '';
			} else {
				return '/cartographies/' + this.Metadata.Work.properties.Id + '/metadata'
					+ (relativePath === '' ? '' : '/') + relativePath;
			}
		},
		Update() {
			this.$refs.invoker.doSave(this.Metadata, this.Metadata.UpdateMetadata);
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

