<template>
	<div>
		<md-dialog :md-active.sync="open" class="reviewPopup">
			<md-dialog-title>
				Indexación:
				<md-icon v-if="Work.properties.IsIndexed" style="margin-top: -4px;">check_circle_outline</md-icon>
				<md-icon v-else style="margin-top: -4px;">error_outline</md-icon>
				{{ (Work.properties.IsIndexed ? 'Indexada' : 'No indexada') }}.
			</md-dialog-title>
			<invoker ref="invoker"></invoker>
			<md-dialog-content>
				<div class="md-layout md-gutter">
					<div v-if="Work.properties.IsIndexed" class="md-layout-item md-size-100 md-small-size-100">
						Cuando una cartografía se encuentra ‘indexada’ sus indicadores son ofrecidos en el buscador del sitio y es indexada en buscadores externos como Google.
						Mientras esté indexada no es posible hacer modificaciones, por lo que si precisa realizar
						una corrección a la información deberá contactarse con los administradores del repositorio
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
					<div class="md-layout-item md-size-100 md-small-size-100" v-if="Work.PendingReviewSince">
						Solicitud enviada el {{ formatDate(Work.PendingReviewSince) }}.
					</div>
				</div>
			</md-dialog-content>
			<md-dialog-actions>
				<md-button @click="open = false">Cerrar</md-button>
				<md-button v-if="Work.CanEdit() && !Work.properties.IsIndexed" class="md-primary md-raised" @click="askReview">
					Solicitar revisión
				</md-button>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>
import f from '@/backoffice/classes/Formatter';

export default {
	name: 'ReviewPopup',
	data() {
		return {
			open: false
		};
	},
	computed: {
		Work() {
			return window.Context.CurrentWork;
		}
	},
	methods: {
		show() {
			this.open = true;
		},
		formatDate(date) {
			return f.formatDate(date);
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
	}
};
</script>

<!-- El diálogo se monta fuera del componente, por lo que el ancho se fija con estilo global
	   apoyado en la clase del popup. -->
<style rel="stylesheet/scss" lang="scss">
.reviewPopup .md-dialog-container {
	max-width: 620px;
	width: 620px;
}
</style>

