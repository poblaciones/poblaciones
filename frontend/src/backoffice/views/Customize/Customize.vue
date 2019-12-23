<template>
	<div>
		<title-bar title="Personalizar" :help="`<p>En esta sección se indican opciones que modifican la vista personalizada que se genera para la cartografía
			</p>`" />
			<div class="app-container">
			<invoker ref="invoker"></invoker>

			<div class="md-layout md-gutter">
				<div class="md-layout-item md-size-80 md-small-size-100">
					<md-card>
						<md-card-header>
							<div class="md-title">
								Inicio
							</div>
						</md-card-header>
						<md-card-content>
							<div class="md-layout md-gutter">
								<div class="md-layout-item md-size-100 md-small-size-100">
									Permite indicar dónde se sitúa el mapa al ingresar a la cartografía.

									Los cambios se harán efectivos al publicar la cartografía.
								</div>
							</div>
									<div class="floatRadio largeOption">
									<md-radio v-model="Work.properties.IsPrivate" :disabled="!Work.CanEdit()" class="md-primary" @change="Update" :value="false"></md-radio>
								</div>
								<div class="md-layout md-gutter">
									<div class="md-layout-item md-size-100 md-small-size-100 largeOption">
									Dinámico
								</div>
								<div class="md-layout-item md-size-100 md-small-size-100">
									Al ingresar a la cartografía el mapa se ubicará en la zona del país en que se encuentre el visitante, determinado a partir de su dirección IP.
								</div>
							</div>

							<div class="floatRadio largeOption">
								<md-radio v-model="Work.properties.IsPrivate" :disabled="!Work.CanEdit()" class="md-primary" @change="Update" :value="true"></md-radio>
							</div>
							<div class="md-layout md-gutter">
								<div class="md-layout-item md-size-100 md-small-size-100 largeOption">
									Región
								</div>
								<div class="md-layout-item md-size-100 md-small-size-100">
									Define una zona en la cual iniciar la visualización a partir de una región conocida (ej. Provincia de Salta).
								</div>
								<div class="md-layout-item md-size-100 md-small-size-100">
									<md-switch v-model="Work.properties.StartClippingRegionSelected" :disabled="!Work.CanEdit" class="md-primary" @change="Update">
										Utilizar la región como selección activa.
									</md-switch>
								</div>
							</div>

							<div class="floatRadio largeOption">
								<md-radio v-model="Work.properties.IsPrivate" :disabled="!Work.CanEdit()" class="md-primary" @change="Update" :value="true"></md-radio>
							</div>
							<div class="md-layout md-gutter">
								<div class="md-layout-item md-size-100 md-small-size-100 largeOption">
									Ubicación
								</div>
								<div class="md-layout-item md-size-100 md-small-size-100">
									Inicia la cartografía en una ubicación fija, determinada por latitud, longitud y zoom.
								</div>
							</div>
						</md-card-content>
					</md-card>
					<md-card>
						<md-card-header>
							<div class="md-title">Indicadores
							</div>
						</md-card-header>
						<md-card-content>
							<div class="md-layout md-gutter">
								<div class="md-layout-item md-size-100 md-small-size-100">
									Seleccione los indicadores que deben estar activos en el visor al ingresar a la cartografía. Adicionalmente, puede agregar indicadores de otras cartografías al listado de indicadores.
								</div>
								<div class="md-layout-item md-size-100 md-small-size-100">
									<md-button v-if="Work.CanEdit()" @click="askReview" class="md-raised">
										Agregar
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
import str from '@/common/js/str';

export default {
	name: 'Customize',
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
				var url = str.AbsoluteUrl(this.Work.properties.Metadata.Url);
				return "(<a href='" + url + "' target='_blank'>" + url + "</a>)";
			} else {
				return "(que será generada al publicarse la cartografía)";
			}
		}
	},
	methods: {
		Update() {
			this.$refs.invoker.do(this.Work,
					this.Work.Update);
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
