<template>
	<div>
		<md-dialog :md-active.sync="openInstitutions" style="width: 750px">

			<md-dialog-title>
				Seleccionar institución
			</md-dialog-title>
			<md-dialog-content>
			<invoker ref="invoker"></invoker>

			<institution-popup ref="InstitutionPopup" @onSelected="setSelected" :container="container"></institution-popup>
			<div v-if="Work.CanEdit()" class="md-layout">
				<md-button @click="CreateNewInstitution()">
					<md-icon>add_circle_outline</md-icon>
					Crear nueva institución
				</md-button>
			</div>
			<div class="md-layout">
				<div class="md-layout-item">
					<md-table v-model="institutions" md-sort="caption" md-sort-order="asc" md-card="">
						<md-table-row slot="md-table-row" slot-scope="{ item }">
							<md-table-cell @click.native="setSelected(item); "  class="selectable" md-label="Nombre" :md-sort-by="item.Caption">{{ item.Caption }}</md-table-cell>
							<md-table-cell @click.native="setSelected(item)" md-label="País" class="selectable" :md-sort-by="item.Country">{{ item.Country }}</md-table-cell>
						</md-table-row>
					</md-table>
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
  data() {
    return {
      openInstitutions: false,
      institution: null,
			institutions: [],
			selected: null
    };
  },
  computed: {
    Work() {
      return window.Context.CurrentWork;
    },
  },
  methods: {
    CreateNewInstitution(){
			var loc = this;
			window.Context.Factory.GetCopy('Institution', function(data) {
					data.IsEditableByCurrentUser = true;
					loc.openEdition(data);
			});
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
			this.$emit('onSelected', this.selected);
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
	props: {
    container: Object
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
