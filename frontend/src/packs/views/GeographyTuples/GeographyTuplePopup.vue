<template>
  <div>
		<invoker ref="invoker"></invoker>
		<md-dialog v-if="geographyTuple" class="wide-dialog" :md-active.sync="activateEdit" :md-click-outside-to-close="true">
			<md-dialog-title>Equivalencia entre geografías</md-dialog-title>
			<md-dialog-content>
				<div class="md-layout md-gutter">
					<div class="md-layout-item md-size-100">
						<mp-select :list="geographies" listGrouping="RootCaption" :canEdit="canEdit"
											 :model-key="false" label="Geografía"
											 :render="formatGeography"
											 v-model="geographyTuple.Geography" />
					</div>
					<div class="md-layout-item md-size-100">
						<mp-select :list="geographies" listGrouping="RootCaption" :canEdit="canEdit"
											 :model-key="false" label="Geografía anterior equivalente"
											 :render="formatGeography"
											 v-model="geographyTuple.PreviousGeography" />
					</div>
					<div class="md-layout-item md-size-100" v-if="!isNew">
						<div class="helper">
							Si modifica estas geografías, los ítems ya calculados quedan desactualizados: use la
							acción 'Calcular' del listado para regenerarlos.
						</div>
					</div>
				</div>
			</md-dialog-content>
			<md-dialog-actions>
				<md-button @click="activateEdit = false">{{ cancelCaption }}</md-button>
				<md-button v-if="canEdit" class="md-primary" @click="save">Guardar</md-button>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>

import f from '@/backoffice/classes/Formatter';
import GeographySelectHelper from '@/packs/classes/GeographySelectHelper';

export default {
  name: "GeographyTuplePopup",
  data() {
    return {
			activateEdit: false,
			geographyTuple: null,
			geographies: [],
    };
  },
  computed: {
		canEdit() {
			return window.Context.IsAdmin();
		},
		cancelCaption() {
			if (this.canEdit) {
				return 'Cancelar';
			}
			return 'Cerrar';
		},
		isNew() {
			return !this.geographyTuple.Id;
		},
  },
	created() {
		// Se carga una sola vez, al montar el componente: si se cargara
		// recién en show(), los tres mp-select (con listGrouping) podrían
		// montarse con la lista todavía vacía y fallar al intentar ubicar
		// el valor actual entre las opciones.
		var loc = this;
		window.Context.Geographies.GetAll(function (data) {
			loc.geographies = GeographySelectHelper.ResolveRootCaptions(data);
		});
	},
  methods: {
		show(geographyTuple) {
			this.geographyTuple = f.clone(geographyTuple);
			this.activateEdit = true;
		},
		formatGeography(geography) {
			if (!geography) {
				return '[Sin elegir]';
			}
			if (geography.Revision) {
				return geography.Caption + ' (' + geography.Revision + ')';
			}
			return geography.Caption;
		},
		save() {
			if (!this.geographyTuple.Geography || !this.geographyTuple.PreviousGeography) {
				alert('Debe indicar la geografía y su equivalente anterior.');
				return;
			}
			var loc = this;
			this.$refs.invoker.doSave(window.Db, window.Db.UpdateGeographyTuple,
							this.geographyTuple).then(function(data) {
								loc.activateEdit = false;
								loc.$emit('completed', loc.geographyTuple);
			});
		}
  },
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

</style>
