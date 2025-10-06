<template>
	<div>
		<invoker ref="invoker"></invoker>

		<pick-institution @onSelected="selected" :container="container" ref="PickInstitution" :Metadata="Metadata" :canEdit="canEdit" ></pick-institution>
		<institution-popup ref="InstitutionPopup" @onSelected="selected" :container="container" :canEdit="canEdit" :Metadata="Metadata" ></institution-popup>

		<div v-if="canEdit" class="md-layout">
			<md-button @click="addInstitution">
				<md-icon>add_circle_outline</md-icon>
				Agregar institución
			</md-button>
		</div>
		<div class="md-layout">
			<div class="md-layout-item">
				<md-table v-model="institutions" md-sort="caption" md-sort-order="asc" md-card="">
					<md-table-row slot="md-table-row" slot-scope="{ item }">
						<md-table-cell md-label="Nombre">{{ item.Caption }}</md-table-cell>
						<md-table-cell md-label="Acciones" class="mpNoWrap">
							<div v-if="canEdit">
								<md-button v-if="item.IsEditableByCurrentUser" class="md-icon-button" @click="openEditionWarning(item)">
									<md-icon>edit</md-icon>
									<md-tooltip md-direction="bottom">Modificar institución</md-tooltip>
								</md-button>
								<md-button v-if="!isFirst(item)" class="md-icon-button" @click="up(item)">
									<md-icon>arrow_upward</md-icon>
									<md-tooltip md-direction="bottom">Subir una ubicación</md-tooltip>
								</md-button>
								<md-button v-if="!isLast(item)" class="md-icon-button" @click="down(item)">
									<md-icon>arrow_downward</md-icon>
									<md-tooltip md-direction="bottom">Bajar una ubicación</md-tooltip>
								</md-button>
								<md-button class="md-icon-button" @click="onDelete(item)">
									<md-icon>delete</md-icon>
									<md-tooltip md-direction="bottom">Quitar institución</md-tooltip>
								</md-button>
							</div>
							<md-button v-else="" class="md-icon-button" @click="openEdition(item)">
								<md-icon>remove_red_eye</md-icon>
								<md-tooltip md-direction="bottom">Ver institución</md-tooltip>
							</md-button>
						</md-table-cell>
					</md-table-row>
				</md-table>
			</div>
		</div>
	</div>
</template>

<script>
import Context from '@/backoffice/classes/Context';
import f from '@/backoffice/classes/Formatter';
import InstitutionPopup from '@/backoffice/views/Metadata/InstitutionPopup';
import PickInstitution from '@/backoffice/views/Metadata/PickInstitution';

export default {
		name: 'Instituciones',
		props: [
			'canEdit',
			'Metadata'
		],
  data() {
    return {
			institutions: [],
			container: {},
    };
	},
	mounted() {
		this.institutions = this.Metadata.Institutions;
	},
  computed: {
    CanEditStaticLists() {
			return window.Context.CanEditStaticLists();
		}
  },
		methods: {
		selected(oldItem, item) {
				this.container.Institution = item;
				var loc = this;
				this.$refs.invoker.doSave(this.Metadata, this.Metadata.UpdateMetadataInstitution, item).then(function (savedInstitution) {
					for (var n = 0; n < loc.Metadata.Institutions.length; n++) {
						if (loc.Metadata.Institutions[n].Id === savedInstitution.Id) {
							loc.Metadata.Institutions[n] = savedInstitution;
							return;
						}
					}
					loc.Metadata.Institutions.push(savedInstitution);
				});
		},
		isFirst(item) {
			return this.Metadata.Institutions[0] === item;
		},
		isLast(item) {
			return this.Metadata.Institutions[this.Metadata.Institutions.length - 1] === item;
		},
		onDelete(item) {
			this.$refs.invoker.message = 'Quitando institución...';
			this.$refs.invoker.confirmDo('Quitar institución', 'La institución será removida de la lista',
				this.Metadata, this.Metadata.RemoveInstitution, item);
    },
		addInstitution() {
			this.$refs.PickInstitution.show();
		},
	  up(item) {
			this.$refs.invoker.doSave(this.Metadata, this.Metadata.MoveInstitutionUp, item);
    },
    down(item) {
			this.$refs.invoker.doSave(this.Metadata, this.Metadata.MoveInstitutionDown, item);
    },
    openEditionWarning(item) {
			var loc = this;
			if (item.IsGlobal) {
				this.$refs.invoker.confirm('Editar institución', 'Al editar una institución, el cambio afectará todas las cartografías o datos públicos que mencionen esta institución',
					function () {
						loc.openEdition(item);
					});
			} else {
				loc.openEdition(item);
			}
		},
    openEdition(item) {
      var clone = f.clone(item);
      this.$refs.InstitutionPopup.show(clone);
    }
  },
  components: {
    InstitutionPopup,
		PickInstitution
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
