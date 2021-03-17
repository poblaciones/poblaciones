<template>
  <div>
		<md-dialog :md-active.sync="activateEdit" :md-click-outside-to-close="false">
			<md-dialog-title>Región</md-dialog-title>
			<md-dialog-content v-if="clippingRegion">
				<invoker ref="invoker"></invoker>
				<div class="md-layout md-gutter">
					<div class="md-layout-item md-size-80">
						<mp-simple-text label="Nombre" ref="inputName"
														v-model="clippingRegion.Caption" @enter="save" />
					</div>
					<div class="md-layout-item md-size-40">
						<mp-simple-text label="Menor nivel de zoom"
														v-model="clippingRegion.LabelsMinZoom" @enter="save" />
					</div>
					<div class="md-layout-item md-size-40">
						<mp-simple-text label="Mayor nivel de zoom"
														v-model="clippingRegion.LabelsMaxZoom" @enter="save" />
					</div>
					<div class="md-layout-item md-size-40">
						<mp-simple-text label="Nombre del campo de código"
														v-model="clippingRegion.FieldCodeName" @enter="save" />
					</div>
					<div class="md-layout-item md-size-40">
						<mp-simple-text label="Símbolo"
														v-model="clippingRegion.Symbol" @enter="save" />
					</div>

					<div class="md-layout-item md-size-100">
						<md-switch class="md-primary" v-model="useInSearch">
							Incluirlo en las etiquetas y en el buscador del mapa*
						</md-switch>
					</div>
					<div class="md-layout-item md-size-100">
						<md-switch class="md-primary" v-model="clippingRegion.IsCrawlerIndexer">
							Utilizarlo al segmentar para crawlers*
						</md-switch>
					</div>
					* Si modifica estos valores debe actualizar el caché de regiones utilizando  la opción
					Configuración &gt; Cachés &gt; Regiones y delimitaciones&gt; Actualizar en el módulo
					de 'Logs y Mantenimiento' (sitio/logs).
				</div>
			</md-dialog-content>
			<md-dialog-actions>
				<md-button @click="activateEdit = false">Cancelar</md-button>
				<md-button class="md-primary" @click="save">Guardar</md-button>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>

import arr from '@/common/js/arr';
import f from '@/backoffice/classes/Formatter';

export default {
  name: "ClippingRegionPopup",
  data() {
    return {
			activateEdit: false,
			clippingRegion: null,
			useInSearch: 0,
    };
  },
  computed: {

  },
  methods: {
		show(clippingRegion) {
			this.clippingRegion = f.clone(clippingRegion);
			this.activateEdit = true;
			this.useInSearch = !clippingRegion.NoAutocomplete;
			setTimeout(() => {
				this.$refs.inputName.focus();
			}, 100);
		},
		save() {
			var loc = this;
			this.clippingRegion.NoAutocomplete = !this.useInSearch;

			this.$refs.invoker.do(window.Db, window.Db.UpdateClippingRegion,
							this.clippingRegion, this.password, this.verification).then(function(data) {
								loc.activateEdit = false;
								loc.$emit('completed', loc.clippingRegion);
			});
		}
  },
  components: {

  }
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

</style>
