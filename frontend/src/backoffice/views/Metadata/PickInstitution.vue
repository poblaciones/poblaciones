<template>
	<div>
		<md-dialog :md-active.sync="openInstitutions">

			<md-dialog-title>
				Seleccionar institución
			</md-dialog-title>

			<md-dialog-content>
			<invoker ref="invoker"></invoker>

			<institution-popup ref="InstitutionPopup" @onSelected="setSelected" :Metadata="Metadata" :canEdit="canEdit" :container="container"></institution-popup>

				<div v-if="canEdit" class="md-layout">
				<md-button @click="CreateNewInstitution()">
					<md-icon>add_circle_outline</md-icon>
					Crear nueva institución
				</md-button>
			</div>
			<div class="md-layout">
				<div class="md-layout-item">
					<mp-grid
						compact
						:pageSize="10"
						:items="institutions"
						:columns="gridColumns"
						:rowClick="onRowClick" />
				</div>
			</div>
		</md-dialog-content>
		<md-dialog-actions>
				<md-button @click="openInstitutions = false">Cancelar</md-button>
				<md-button class="md-primary" @click="save()">Seleccionar</md-button>
		</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>
import Context from '@/backoffice/classes/Context';
import InstitutionPopup from '@/backoffice/views/Metadata/InstitutionPopup';

export default {
		name: 'Fuentes',
		props: {
			container: Object,
			canEdit: Boolean,
			Metadata: Object
		},
  data() {
    return {
      openInstitutions: false,
      institution: null,
			institutions: [],
			selected: null
    };
  },
  computed: {
    gridColumns() {
			return [
				{ property: 'Caption', size: 7, caption: 'Nombre' },
				{ property: 'Country', size: 3, caption: 'País' },
			];
		}
  },
  methods: {
    CreateNewInstitution() {
			var loc = this;
			window.Context.Factory.GetCopy('Institution', function(data) {
					data.IsEditableByCurrentUser = true;
					loc.openEdition(data);
			});
    },
		onRowClick(grid, item) {
			this.setSelected(item);
		},
		setSelected(item) {
			this.selected = item;
			this.save();
		},
    save() {
			if (this.selected === null) {
				alert('No ha seleccionado ninguna institución.');
				return;
			}
			this.$emit('onSelected', this.selected, this.selected);
			this.openInstitutions = false;
    },
    show() {
			var loc = this;
			window.Context.Institutions.GetAll(function(data) {
				loc.institutions = data;
				loc.openInstitutions = true;
			});
    },
    openEdition(item) {
      this.$refs.InstitutionPopup.show(item, this.closeParentCallback);
		},
		closeParentCallback() {
			this.openInstitutions = false;
		}
  },
  components: {
    InstitutionPopup
  }
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

.md-dialog-actions {
  padding: 8px 20px 8px 24px !important;
}

.close-button {
    min-width: unset;
    height: unset;
    margin: unset;
    float: right;
}

</style>
