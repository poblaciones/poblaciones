<template>
	<div>
		<title-bar title="Resumen" help="<p>El resumen permite explicitar información sobre la elaboración de
								los datos publicados, sus motivaciones o hipótesis, así como detalles de su nivel de cobertura,
							 su estructura o consideraciones para su interpretación o uso. </p>
								<p>Esta información es ofrecida a los usuarios dentro del archivo en formato PDF que el
								sitio genera automáticamente con los metadatos de cada conjunto de datos accedido.
								</p>" />
		<div class="app-container">
			<invoker ref="invoker"></invoker>
			<div class="md-layout md-gutter">
				<div class="md-layout-item md-size-80 md-small-size-100">
					<md-card>
						<md-card-content>
							<mp-text :canEdit="Work.CanEdit()" label="Descripción ampliada de la cartografía" :maxlength="20000" :multiline="true"
												 :rows="30"
										helper="Incluya aquí precisiones sobre el contenido o elaboración de la información, tal como detalles sobre las fuentes de información, codificaciones realizadas a los datos, limitaciones existentes o definiciones de los tipos de dato involucrados. Longitud: ilimitada." @update="Update"
										v-model="metadata.AbstractLong" />
						</md-card-content>
					</md-card>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import Context from '@/backoffice/classes/Context';

export default {
name: 'Resumen',
	data() {
		return {
		};
	},
	computed: {
		Work() {
			return window.Context.CurrentWork;
		},
		metadata() {
			return window.Context.CurrentWork.properties.Metadata;
		}
	},
	methods: {
		Update() {
		  this.$refs.invoker.doBackground(this.Work,
														this.Work.UpdateMetadata);
  		return true;
		}
	},
	components: {
	}};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
</style>

