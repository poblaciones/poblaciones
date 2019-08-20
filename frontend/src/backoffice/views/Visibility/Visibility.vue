<template>
	<div>
		<title-bar title="Visibilidad" :help="`<p>
			La visiblidad establece quiénes pueden ver la información en el mapa y acceder a su descarga una vez publicada.
			</p>`" />
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
									El nivel de acceso define si la cartografía es de acceso público o si solamente pueden consultarla quienes tengan asignados permisos para hacerlo.
									Los cambios en la visibilidad se harán efectivos en forma inmediata, sin necesidad de volver a publicar la cartografía.
								</div>
							</div>
									<div class="floatRadio largeOption">
									<md-radio v-model="Work.properties.IsPrivate" :disabled="!Work.CanEdit()" class="md-primary" @change="Update" :value="false"></md-radio>
								</div>
								<div class="md-layout md-gutter">
									<div class="md-layout-item md-size-100 md-small-size-100 largeOption">
									Pública
								</div>
								<div class="md-layout-item md-size-100 md-small-size-100">
									Todos los usuarios que conozcan la ruta estable de la cartografía <span v-html="stableUrl"></span> pueden acceder a ella.
								</div>
							</div>
							
							<div class="floatRadio largeOption">
								<md-radio v-model="Work.properties.IsPrivate" :disabled="!Work.CanEdit()" class="md-primary" @change="Update" :value="true"></md-radio>
							</div>
							<div class="md-layout md-gutter">
								<div class="md-layout-item md-size-100 md-small-size-100 largeOption">
									Privada
								</div>
								<div class="md-layout-item md-size-100 md-small-size-100">
									Una cartografía privada es visible solamente para quien que la creó y para quienes hayan sido agregados en la solapa Permisos.
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
								<div class="md-layout-item md-size-100 md-small-size-100">
									Cuando una cartografía se encuentra ‘indexada’ sus indicadores son ofrecidos en el buscador del sitio y es indexada en buscadores externos como Google.
								</div>		
								<div v-if="!Work.properties.IsIndexed" class="md-layout-item md-size-100 md-small-size-100" style="padding-top: 16px">
									Para que la cartografía sea indexada, se debe antes solicitar una revisión. Antes de hacerlo, verifique que satisfaga los siguientes criterios:
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
								<div class="md-layout-item md-size-100 md-small-size-100">
									<md-button v-if="Work.CanEdit()" @click="askReview" class="md-raised">
										Solicitar revisión
									</md-button>
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

export default {
	name: 'Visibility',
	data() {
		return {

		};
	},
	computed: {
		Work() {
			return window.Context.CurrentWork;
		},
		stableUrl() {
			if (this.Work.properties.Metadata.Url) {
				var url = f.absoluteUrl(this.Work.properties.Metadata.Url);
				return "(<a href='" + url + "' target='_blank'>" + url + "</a>)";
			} else {
				return "que será generada al publicar se la cartografía";
			}
		}
	},
	methods: {
		Update() {
			this.$refs.invoker.do(this.Work,
					this.Work.UpdateVisibility);
			return true;
		},
		askReview() {
			this.$refs.invoker.do(this.Work,
					this.Work.RequestReview).then(
		function () {
			window.alert('Revisión solicitada con éxito.');
		});
		}
	},
	components: {
	}
};

</script>

<style rel="stylesheet/scss" lang="scss" scoped>

.md-layout-item .md-size-15 {
    padding: 0 !important;
}

.md-layout-item .md-size-25 {
    padding: 0 !important;
}

.md-layout-item .md-size-20 {
    padding: 0 !important;
}

.md-layout-item .md-size-10 {
    padding: 0 !important;
}

.floatRadio {
	float: left;
  padding-top: 3px!important;
}

.largeOption {
	font-size: 18px;
  padding: 18px 0px 6px 12px;
}

</style>
