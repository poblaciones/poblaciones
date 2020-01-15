<template>
	<div>
		<title-bar title="Atribución" :help="`<p>
			La atribución permite indicar los autores individuales y opcionalmente la atribución institucional de los datos publicados.
		</p><p>
				La información de contacto hace accesible a los usuarios de la información un canal de comunicación con los responsables de los datos para poder realizar consultas o realimentar el proceso de producción de la información.
			</p><p>
				La declaración de licencia permite que quienes descarguen la información tengan un marco explícito del alcance con el que pueden utilizar los datos obtenidos de la plataforma.
			</p>`" />
			<div class="app-container">
			<invoker ref="invoker"></invoker>

			<div class="md-layout md-gutter">
				<div class="md-layout-item md-size-80 md-small-size-100">
					<md-card>
						<md-card-header>
							<div class="md-title">Origen</div>
						</md-card-header>
						<md-card-content>
							<div class="md-layout md-gutter">
								<div class="md-layout-item md-size-100 md-small-size-100">
									<mp-text :canEdit="Work.CanEdit()" label="Autores"
									 :helper="'Indique quiénes ' + (Work.IsPublicData() ? 'procesaron la información' : 'elaboraron la cartografía' ) + '. Ej. Petraqui, María y Herández, José.'"
										@update="Update" :maxlength="200"
									 v-model="metadata.Authors" />
								</div>
								<div class="md-layout-item md-size-85 md-small-size-100">
									<institution-widget @onSelected="Update()" :container="metadata"></institution-widget>
								</div>
							</div>
						</md-card-content>
					</md-card>
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

.md-avatar {
    min-width: 200px;
    min-height: 200px;
    border-radius: 200px;
}

</style>
