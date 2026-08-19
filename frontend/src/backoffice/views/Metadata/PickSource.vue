<template>
	<div>
		<md-dialog :md-active.sync="openSources" class="content-sized-dialog">

			<md-dialog-title>
				Agregar fuente
			</md-dialog-title>
			<md-dialog-content>

			<invoker ref="invoker"></invoker>

			<source-popup ref="SourcePopup" :Metadata="Metadata" :canEdit="canEdit" ></source-popup>
			<div v-if="canEdit" class="md-layout">
				<md-button @click="CreateNewSource()">
					<md-icon>add_circle_outline</md-icon>
					Crear nueva fuente
				</md-button>
			</div>
			<div class="md-layout">
				<div class="md-layout-item">
					<mp-grid
						compact
						:pageSize="10"
						:items="sources"
						:columns="gridColumns"
						:rowClick="onRowClick" />
				</div>
			</div>
		</md-dialog-content>
		<md-dialog-actions>
				<md-button @click="openSources = false">Cancelar</md-button>
				<md-button class="md-primary" @click="save()">Seleccionar</md-button>
		</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>
import Context from '@/backoffice/classes/Context';
import SourcePopup from '@/backoffice/views/Metadata/SourcePopup';

export default {
		name: 'Fuentes',
		props: [
			'canEdit',
			'Metadata'
		],
  data() {
    return {
      openSources: false,
      source: null,
			sources: [],
			selected: null
    };
  },
  computed: {
    SecondaryLabel() {
			return (this.Metadata.Work && this.Metadata.Work.IsPublicData() ? '' : ' secundarias');
		},
		gridColumns() {
			var loc = this;
			return [
				{ property: 'Caption', size: 7, caption: 'Nombre' },
				{ property: 'Version', caption: 'Edición' },
				{
					property: 'Institution.Caption', caption: 'Institución', size: 5,
					value: function (item) { return loc.getInstitutionCaption(item); },
				},
			];
		}
  },
  methods: {
    CreateNewSource() {
			var loc = this;
			window.Context.Factory.GetCopy('Source', function(data) {
					data.IsEditableByCurrentUser = true;
					loc.openEdition(data);
			});
    },
		getInstitutionCaption(item) {
			if (item.Institution === null) {
				return '';
			} else {
				return item.Institution.Caption;
			}
		},
		onRowClick(grid, item) {
			this.selected = item;
			this.save();
		},
    save() {
			if (this.selected === null) {
				alert('No ha seleccionado ninguna fuente.');
				return;
			}
			if (this.Metadata.ContainsSource(this.selected)) {
				alert('Se ha seleccionada una fuente que ya es parte de la lista.');
				return;
			}
			var loc = this;
			this.$refs.invoker.doSave(this.Metadata, this.Metadata.AddSource, this.selected).then(function() {
				loc.openSources = false;
				});
    },
    show() {
			var loc = this;
			window.Context.Sources.GetAll(function(data) {
				loc.sources = data;
				loc.openSources = true;
			});
    },
    openEdition(item) {
      this.$refs.SourcePopup.show(item, this.closeParentCallback);
		},
		closeParentCallback() {
			this.openSources = false;
		}
  },
  components: {
    SourcePopup
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
