<template>
	<div>
			<invoker ref="invoker"></invoker>

			<div class="md-layout md-gutter" style="margin-bottom: 10px;">
				<div class="md-layout-item md-size-80 md-small-size-100">
							<div class="md-layout md-gutter">
								<div class="md-layout-item md-size-100 md-small-size-100">
									<mp-text :canEdit="Work.CanEdit()" label="Autores"
									 :helper="'Indique quiénes elaboraron la cartografía. Ej. Petraqui, María y Herández, José.'"
										@update="Update" :maxlength="250"
									 v-model="metadata.Authors" />
								</div>
								<div class="md-layout-item md-size-85 md-small-size-100">
									<institution-widget @onSelected="Update()" :container="metadata"></institution-widget>
								</div>
							</div>
				</div>

				<div class="md-layout-item md-size-80 md-small-size-100">
					<md-card>
						<md-card-header>
							<div class="md-title">
								Licencia
								<mp-help :text="`<p><b>¿Qué son las licencias Creative Commons?</b></p><p>Creative Commons es una organización sin fines de lucro, que brinda un conjunto
																			de licencias legales abiertas estandarizadas.</p><p>Estas licencias se basan en el derecho de autor y sirven para llevar la postura extrema de “Todos los derechos reservados” hacia una más flexible, de “Algunos derechos reservados” o, en algunos casos, “Sin derechos reservados”.</p>
																			</p>Se pueden utilizar en cualquier obra creativa siempre que la misma se encuentre bajo derecho de autor y conexos, y pueden utilizarla tanto personas como instituciones.</p>`" />
								</div>
						</md-card-header>
						<md-card-content>
							<mp-license :canEdit="Work.CanEdit()" v-model="metadata.License" @update="Update"></mp-license>
						</md-card-content>
					</md-card>
				</div>

				<div class="md-layout-item md-size-80 md-small-size-100">
					<md-card>
						<md-card-header>
							<div class="md-title">Contacto</div>
						</md-card-header>
						<md-card-content>
							<contact-form></contact-form>
						</md-card-content>
					</md-card>

			</div>
		</div>
	</div>
</template>

<script>
	import Context from '@/backoffice/classes/Context';
	import InstitutionWidget from '@/backoffice/views/Metadata/InstitutionWidget';
	import ContactForm from '@/backoffice/views/Metadata/ContactForm';
	import MpLicense from '@/backoffice/components/MpLicense';

	export default {
	name: 'Atribucion',
	data() {
		return {

		};
	},
	computed: {
		Work() {
			return window.Context.CurrentWork;
		},
		metadata () {
			return window.Context.CurrentWork.properties.Metadata;
		},
	},
	methods: {
		Update() {
			this.$refs.invoker.doBackground(this.Work,
					this.Work.UpdateMetadata);
			return true;
		},
	},
	components: {
		InstitutionWidget,
		ContactForm,
		MpLicense
	}
};

					</script>

<style rel="stylesheet/scss" lang="scss" scoped>



</style>
