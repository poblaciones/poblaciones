<template>
	<div>
		<title-bar title="Visibilidad" :showReadonlyIndexedWarning="Work.ReadOnlyCausedByIndexing()" :help="`<p>
			La visiblidad establece quiénes pueden ver la información en el mapa y acceder a su descarga una vez publicada.
			</p>` + extraHelp('VisibilitySection')" />
			<div class="app-container">
			<invoker ref="invoker"></invoker>

			<div class="md-layout md-gutter">
				<div class="md-layout-item md-size-80 md-small-size-100">
					<md-card>
						<md-card-header>
							<div class="md-title">
								Acceso
							</div>
						</md-card-header>
						<md-card-content>
							<div class="md-layout md-gutter">
								<div class="md-layout-item md-size-100 md-small-size-100">
									El nivel de acceso define si la cartografía es de acceso público o si solamente pueden consultarla quienes tengan asignados un link o permisos para hacerlo.
									Los cambios en la visibilidad se harán efectivos en forma inmediata, sin necesidad de volver a publicar la cartografía.
								</div>
							</div>
									<div class="floatRadio largeOption largeText">
									<md-radio v-model="visibilityMode" :disabled="!Work.CanEdit()" class="md-primary" @change="UpdateClearLink" :value="1"></md-radio>
								</div>
								<div class="md-layout md-gutter">
									<div class="md-layout-item md-size-100 md-small-size-100 largeOption largeText">
									Público
								</div>
								<div class="md-layout-item md-size-100 md-small-size-100">
									Todos los usuarios que conozcan la ruta estable de la cartografía <span v-html="stableUrlHref"></span> pueden acceder a ella.
								</div>
							</div>

								<template v-if="!Work.properties.IsIndexed">
									<div class="floatRadio largeOption largeText">
										<md-radio v-model="visibilityMode" :disabled="!Work.CanEdit()" class="md-primary" @change="UpdateSetLink" :value="2"></md-radio>
									</div>
									<div class="md-layout md-gutter">
										<div class="md-layout-item md-size-100 md-small-size-100 largeOption largeText">
											Enlace
										</div>
										<div class="md-layout-item md-size-100 md-small-size-100">
											La cartografía será visible a todos los usuarios que dispongan del siguiente enlace:
										</div>
										<div class="md-layout-item md-size-100 md-small-size-100">
											<span v-html="accessLinkUrlHref"></span>
											<a href="#" v-if="visibilityMode == 2 && this.Work.properties.Metadata.Url" v-clipboard="() => accessLinkUrl" @click.prevent="" class="superSmallButton">
												Copiar
											</a>
											<a v-show="visibilityMode == 2 && this.Work.properties.Metadata.Url" href="#" @click.prevent="RegenLink" class="superSmallButton">
												Cambiar enlace
											</a>
										</div>
									</div>
								</template>

							<div class="floatRadio largeOption largeText">
								<md-radio v-model="visibilityMode" :disabled="!Work.CanEdit()" class="md-primary" @change="UpdateClearLink" :value="3"></md-radio>
							</div>
							<div class="md-layout md-gutter">
								<div class="md-layout-item md-size-100 md-small-size-100 largeOption largeText">
									Privado
								</div>
								<div class="md-layout-item md-size-100 md-small-size-100">
									Una cartografía con acceso privado es visible solamente para quien que la creó y para quienes hayan sido agregados en la solapa Permisos.
								</div>
							</div>
						</md-card-content>
					</md-card>
					<md-card>
						<md-card-header>
							<div class="md-title">
								Indexación:
								<md-icon v-if="Work.properties.IsIndexed" style="margin-top: -4px;">check_circle_outline</md-icon>
								<md-icon v-else style="margin-top: -4px;">error_outline</md-icon>
								{{ (Work.properties.IsIndexed ? 'Indexada' : 'No indexada') }}.</div>
						</md-card-header>
						<md-card-content>
							<div class="md-layout md-gutter">
								<div v-if="Work.properties.IsIndexed" class="md-layout-item md-size-100 md-small-size-100">
									Cuando una cartografía se encuentra ‘indexada’ sus indicadores son ofrecidos en el buscador del sitio y es indexada en buscadores externos como Google.
									Mientras esté indexada no es posible hacer modificaciones, por lo que si precisa realizar
									una corrección a la información deberá conctactarse con los administradores del repositorio
									para solicitar el permiso.
								</div>
								<template v-else>
									<div class="md-layout-item md-size-100 md-small-size-100">
										Cuando una cartografía no se encuentra indexada sus indicadores no son ofrecidos en el buscador del sitio y es no indexada en buscadores externos como Google.
									</div>
									<div class="md-layout-item md-size-100 md-small-size-100" style="padding-top: 16px">
										Para que una cartografía sea indexada, se debe solicitar una revisión. Antes de hacerlo, verifique que la misma satisfaga los siguientes criterios:
										<ul>
											<li>La cartografía tiene un título que describe claramente su contenido.</li>
											<li>Estén detallados los autores y la institución originante en la atribución.</li>
											<li>En lo posible hay documentos que explicitan la metodología utilizada, los resultados encontrados o tablas de códigos que permitan interpretar mejor la información en la sección 'Adjuntos'.</li>
											<li>Las fuentes secundarias utilizados (censos, cartografías, etc.) estén apropiadamente indicadas en el apartado 'Fuentes'.</li>
											<li>Los nombres de los datasets, sus variables e indicadores son claros y mantienen coherencia interna.</li>
											<li>Las variables de los datasets poseen etiquetas bien definidas que permiten comprender bien su contenido.</li>
											<li>Los tipos de dato y precisión de las variables de los datasets son los apropiados (ej. no ofrecer decimales en variables de valores enteros).</li>
											<li>La información de contacto de la cartografía ofrece canales válidos para realizar consultas.</li>
										</ul>
									</div>
								</template>
								<div class="md-layout-item md-size-100 md-small-size-100">
									<md-button v-if="Work.CanEdit()" @click="askReview" class="md-raised">
										Solicitar revisión
									</md-button>
									<div style="padding-top: 15px; display: inline-block; padding-left: 10px;" v-if="Work.PendingReviewSince">
										Solicitud enviada el {{ formatDate(Work.PendingReviewSince) }}.
									</div>
								</div>
							</div>
						</md-card-content>
					</md-card>

		</div>

			</div>
		</div>
	</div>
</template>

<script>
import Context from '@/backoffice/classes/Context';
import f from '@/backoffice/classes/Formatter';
import str from '@/common/framework/str';

export default {
	name: 'Visibility',
	data() {
		return {
			visibilityMode: 0
		};
	},
	computed: {
		Work() {
			return window.Context.CurrentWork;
		},
		accessLinkUrl() {
			if (this.Work.properties.Metadata.Url) {
				if (this.Work.properties.AccessLink) {
					return str.AbsoluteUrl(this.Work.properties.Metadata.Url) + '/' + this.Work.properties.AccessLink;
				} else if (this.Work.properties.LastAccessLink) {
					return str.AbsoluteUrl(this.Work.properties.Metadata.Url) + '/' + this.Work.properties.LastAccessLink;
				} else {
					return "(no utilizado)";
				}
			} else {
				return "(será generado al publicarse la cartografía)";
			}
		},
		stableUrlHref() {
			if (this.Work.properties.Metadata.Url) {
				var url = str.AbsoluteUrl(this.Work.properties.Metadata.Url);
				if (this.Work.properties.Metadata.LastOnline) {
					return "(<a href='" + url + "' target='_blank'>" + url + "</a>)";
				} else {
					return "(" + url + ")";
				}
			} else {
				return "(será generada al publicarse la cartografía)";
			}
		},
		accessLinkUrlHref() {
			if (this.Work.properties.Metadata.Url && this.Work.properties.AccessLink) {
				var url = this.accessLinkUrl;
				if (this.Work.properties.Metadata.LastOnline) {
					return "<a href='" + url + "' target='_blank'>" + url + "</a>";
				} else {
					return url;
				}
			} else {
				return this.accessLinkUrl;
			}
		}
	},
	mounted() {
		if (this.Work) {
			this.CalculateMode();
		}
	},
	methods: {
		CalculateMode() {
			if (this.Work.properties.IsPrivate) {
				this.visibilityMode = 3;
				return;
			}
			if (this.Work.properties.AccessLink) {
				this.visibilityMode = 2;
			} else {
				this.visibilityMode = 1;
			}
		},
		extraHelp(section) {
			if (window) {
				return window.Context.HelpLinkSection(window.Context.Configuration.Help[section]);
			} else {
				return '';
			}
		},
		RegenLink() {
			if (!confirm('Al cambiar el enlace quienes posean la ruta actual ya no podrán accederla. \n\n¿Está seguro de que desea hacer esto?')) {
				return;
			}
			this.Work.properties.LastAccessLink = null;
			this.Work.properties.AccessLink = null;
			this.UpdateLink();
		},
		UpdateLink() {
			this.Work.properties.AccessLink = '?';
			return this.doUpdate();
		},
		UpdateClearLink() {
			if (this.Work.properties.AccessLink !== null) {
				this.Work.properties.LastAccessLink = this.Work.properties.AccessLink;
				this.Work.properties.AccessLink = null;
			}
			return this.doUpdate();
		},
		UpdateSetLink() {
			if (!this.Work.properties.AccessLink) {
				if (this.Work.properties.LastAccessLink !== null) {
					this.Work.properties.AccessLink = this.Work.properties.LastAccessLink;
					this.Work.properties.LastAccessLink = null;
				} else {
					this.Work.properties.AccessLink = '?';
				}
			}
			return this.doUpdate();
		},
		formatDate(date) {
			return f.formatDate(date);
		},
		doUpdate() {
			var loc = this;
			this.Work.properties.IsPrivate = this.visibilityMode === 3;
			var receiveLink = (this.Work.properties.AccessLink === '?');
			this.$refs.invoker.doSave(this.Work,
				this.Work.UpdateVisibility).then(function (data) {
					if (receiveLink) {
						loc.Work.properties.AccessLink = data['link'];
					}
				});
			return true;
		},
		askReview() {
			var loc = this;
			this.$refs.invoker.doMessage('Enviando', this.Work,
				this.Work.RequestReview).then(
					function (data) {
						window.alert('Revisión solicitada con éxito.');
						loc.Work.PendingReviewSince = data;
					});
		}
	},
	components: {
	},
	watch: {
		Work() {
			this.CalculateMode();
		}
	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>


</style>
