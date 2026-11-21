<template>
	<div>
		<invoker ref="invoker"></invoker>
		<div class="md-layout md-gutter">
			<div class="md-layout-item md-size-100">
				<md-card>
					<md-card-header>
						<div class="md-title">Capas base predeterminadas</div>
					</md-card-header>
					<md-card-content>
						<div class="md-layout md-gutter">
							<div class="md-layout-item md-size-100">
								Establezca qué capas base deben estar activas (visibles en el mapa) al ingresar a la cartografía.
								Por defecto solo están activas las etiquetas.
							</div>
							<div class="md-layout-item md-size-95 md-small-size-100">
								<md-table v-model="Work.BasemapLayers" md-card="">
									<md-table-row slot="md-table-row" slot-scope="{ item }">
										<md-table-cell md-label="Nombre">{{ item.Caption }}</md-table-cell>
										<md-table-cell md-label="Activa al inicio" class="mpNoWrap">
											<md-switch v-model="item.StartActive" class="md-primary" :disabled="!Work.CanEdit()"
																 @change="value => SetActive(value, item)"></md-switch>
										</md-table-cell>
									</md-table-row>
								</md-table>
							</div>
						</div>
					</md-card-content>
				</md-card>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	name: 'BasemapLayers',
	computed: {
		Work() {
			return window.Context.CurrentWork;
		}
	},
	methods: {
		SetActive(value, layer) {
			this.$refs.invoker.doSave(this.Work,
				this.Work.UpdateBasemapLayerStart, layer);
		}
	}
};
</script>
