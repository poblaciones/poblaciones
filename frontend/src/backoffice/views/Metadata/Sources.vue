<template>
	<div>
		<title-bar :title="'Fuentes' + SecondaryLabel" :help="`
							 <p>
								 La sección de fuentes` + SecondaryLabel + ` permite ofrecer la lista de datos o documentación en la que se apoyó
								 la construcción de la información puesta a disposición.
							 </p><p>
								 De esta forma, pueden consignarse como fuentes secundarias censos, encuestas o
								 cartografías que hayan sido empleadas para el armado de los datos ofrecidos.
							 </p>`" />

		<div class="app-container">
		<invoker ref="invoker"></invoker>

			<pick-source ref="PickSource"></pick-source>

			<source-popup ref="SourcePopup" contact="source"></source-popup>

			<div v-if="Work.CanEdit()" class="md-layout">
				<md-button @click="addSource">
					<md-icon>add_circle_outline</md-icon>
					Agregar fuente
				</md-button>
			</div>
			<div class="md-layout">
				<div class="md-layout-item">
					<md-table v-model="sources" md-sort="caption" md-sort-order="asc" md-card="">
						<md-table-row slot="md-table-row" slot-scope="{ item }">
							<md-table-cell md-label="Nombre">{{ item.Caption }}</md-table-cell>
							<md-table-cell md-label="Edición">{{ item.Version }}</md-table-cell>
							<md-table-cell md-label="Institución">{{ getInstitutionCaption(item) }}</md-table-cell>
							<md-table-cell md-label="Acciones" class="mpNoWrap">
								<div v-if="Work.CanEdit()">
									<md-button v-if="item.IsEditableByCurrentUser" class="md-icon-button" title="Modificar fuente" @click="openEditionWarning(item)">
										<md-icon>edit</md-icon>
									</md-button>
									<md-button v-if="!isFirst(item)" title="Subir una ubicación" class="md-icon-button" @click="up(item)">
										<md-icon>arrow_upward</md-icon>
									</md-button>
									<md-button v-if="!isLast(item)" title="Bajar una ubicación" class="md-icon-button" @click="down(item)">
										<md-icon>arrow_downward</md-icon>
									</md-button>
									<md-button class="md-icon-button" title="Quitar fuente" @click="onDelete(item)">
										<md-icon>delete</md-icon>
									</md-button>
								</div>
								<md-button v-else="" class="md-icon-button" title="Ver fuente" @click="openEdition(item)">
										<md-icon>remove_red_eye</md-icon>
								</md-button>
							</md-table-cell>
						</md-table-row>
					</md-table>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import Context from '@/backoffice/classes/Context';
import f from '@/backoffice/classes/Formatter';
import SourcePopup from '@/backoffice/views/Metadata/SourcePopup';
import PickSource from '@/backoffice/views/Metadata/PickSource';

export default {
  name: 'Fuentes',
  data() {
    return {

    };
  },
  computed: {
    Work() {
      return window.Context.CurrentWork;
    },
		SecondaryLabel() {
			return (this.Work.IsPublicData() ? '' : ' secundarias');
		},
		sources() {
			return this.Work.Sources;
		},
		CanEditStaticLists() {
			return window.Context.CanEditStaticLists();
		}
  },
  methods: {
		getInstitutionCaption(item) {
			if (item.Institution === null) {
				return '';
			} else {
				return item.Institution.Caption;
			}
		},
		isFirst(item) {
			return this.Work.Sources[0] === item;
		},
		isLast(item) {
			return this.Work.Sources[this.Work.Sources.length - 1] === item;
		},
    onDelete(item) {
				this.$refs.invoker.confirmDo('Quitar fuente', 'La fuente será removida de la lista',
						this.Work, this.Work.RemoveSource, item);
    },
		addSource() {
			this.$refs.PickSource.show();
		},
	  up(item) {
      this.$refs.invoker.do(this.Work, this.Work.MoveSourceUp, item);
    },
    down(item) {
      this.$refs.invoker.do(this.Work, this.Work.MoveSourceDown, item);
    },
    openEditionWarning(item) {
			var loc = this;
			if (item.IsGlobal) {
				this.$refs.invoker.confirm('Editar fuente', 'Al editar una fuente, el cambio afectará todas las cartografías o datos públicos que mencionen esta fuente',
					function () {
						loc.openEdition(item);
					});
			} else {
				loc.openEdition(item);
			}
		},
    openEdition(item) {
      var clone = f.clone(item);
      this.$refs.SourcePopup.show(clone);
    }
  },
  components: {
    SourcePopup,
		PickSource
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
