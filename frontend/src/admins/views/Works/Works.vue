<template>
	<div class="md-layout">
		<div class="md-layout-item md-size-100">
			<stepper ref="DeleteStepper" @completed="onDeleteComplete">
			</stepper>
			<stepper ref="SaveAsStepper">
			</stepper>
			<stepper ref="stepper">
			</stepper>
			<invoker ref="invoker">
			</invoker>
		</div>
		<md-radio v-model="timeFilter" class="md-primary" @change="refreshWorks" :value="0">Todas</md-radio>
		<md-radio v-model="timeFilter" class="md-primary" @change="refreshWorks" :value="7">Últimos 7 días</md-radio>
		<md-radio v-model="timeFilter" class="md-primary" @change="refreshWorks" :value="30">Últimos 30 días</md-radio>
		<md-radio v-model="timeFilter" class="md-primary" @change="refreshWorks" :value="90">Últimos 90 días</md-radio>
		<md-button @click="calculateUsage" style="margin-left: 60px">
			<md-icon>data_usage</md-icon> Recalcular tamaños
		</md-button>

		<div class="md-layout-item md-size-100" style="position: relative">
			<mp-search @search="applyFilters" v-model="search" style="margin-top: 8px" />

			<md-table style="max-width: 1200px;" v-if="works.length > 0" v-model="worksFiltered" md-sort="Caption" md-sort-order="asc" md-card>
				<md-table-row slot="md-table-row" slot-scope="{ item }">
					<md-table-cell @click.native="select(item)" class="selectable" md-label="Título" md-sort-by="Caption">
						<a :href="getWorkUri(item, true)" class="normalTextLink">{{ item.Caption }}</a>
					</md-table-cell>
					<md-table-cell @click.native="select(item)" class="selectable" md-label="Tamaño" md-sort-by="TotalSizeBytes">
						{{ totalSizeMB(item) }}
						<md-tooltip md-direction="bottom">{{ formatSizes(item) }}</md-tooltip>
					</md-table-cell>
					<md-table-cell @click.native="select(item)" class="selectable" style="width:50px" md-label="Datasets" md-sort-by="DatasetCount">
						{{ item.DatasetCount }}
						<md-tooltip md-direction="bottom">{{ item.DatasetNames }}</md-tooltip>
					</md-table-cell>
					<md-table-cell @click.native="select(item)" class="selectable" md-label="Indicadores" md-sort-by="MetricCount">{{ item.MetricCount }}</md-table-cell>
					<md-table-cell v-if="showIndexingColumn" @click.native="select(item)" class="selectable" md-label="Indexado" md-sort-by="IsIndexed">
						<md-switch class="md-primary" v-model="item.IsIndexed"
											 @change="onIndexedChanged(item)" />
					</md-table-cell>
					<md-table-cell v-if="showIndexingColumn" @click.native="select(item)" class="selectable" md-label="Segmentado" md-sort-by="SegmentedCrawling">
						<md-switch class="md-primary" v-model="item.SegmentedCrawling"
											 @change="onSegmentedCrawlingChanged(item)" :disabled="!item.IsIndexed" />
					</md-table-cell>
					<md-table-cell @click.native="select(item)" class="selectable" md-label="Estado">
						<md-icon :style="'color: ' + status(item).color">
							{{ status(item).icon }}
							<md-tooltip md-direction="bottom">{{ status(item).label }}</md-tooltip>
						</md-icon>
						<div class="extraIconContainer">
							<md-icon v-if="item.IsPrivate" class="extraIcon">
								lock
								<md-tooltip md-direction="bottom">Visiblidad: Privado. Para cambiar la visiblidad, acceda a Editar > Visiblidad.</md-tooltip>
							</md-icon>
							<md-icon v-if="!showIndexingColumn && !item.IsPrivate && !item.IsIndexed && status(item).tag !== 'unpublished'"
											 class="extraIcon">
								error_outline
								<md-tooltip md-direction="bottom">
									No indexada. El buscador de Poblaciones no publica los indicadores de esta cartografía en sus resultados.
									Para que sean incluidos, debe solictar una revisión desde Modificar > Visiblidad > Solicitar revisión.
								</md-tooltip>
							</md-icon>
						</div>
					</md-table-cell>
					<md-table-cell md-label="Acciones">
						<md-button v-if="!canEdit(item)" class="md-icon-button" @click="select(item)">
							<md-icon>remove_red_eye</md-icon>
							<md-tooltip md-direction="bottom">Consultar</md-tooltip>
						</md-button>
						<md-button v-if="canEdit(item) && !publishDisabled(item)" class="md-icon-button" @click="onPublish(item)">
							<md-icon>public</md-icon>
							<md-tooltip md-direction="bottom">Publicar</md-tooltip>
						</md-button>
						<md-button v-if="canEdit(item) && !revokeDisabled(item)" class="md-icon-button" @click="onRevoke(item)">
							<md-icon>pause_circle_filled</md-icon>
							<md-tooltip md-direction="bottom">Revocar publicación</md-tooltip>
						</md-button>
						<md-button v-if="canEdit(item)" class="md-icon-button" @click="select(item)">
							<md-icon>edit</md-icon>
							<md-tooltip md-direction="bottom">Modificar</md-tooltip>
						</md-button>
						<md-button v-if="canEdit(item)" @click="onDuplicate(item)" class="md-icon-button">
							<md-icon>file_copy</md-icon>
							<md-tooltip md-direction="bottom">Duplicar</md-tooltip>
						</md-button>
						<md-button v-if="canEdit(item)" class="md-icon-button" @click="onDelete(item)">
							<md-icon>delete</md-icon>
							<md-tooltip md-direction="bottom">Eliminar</md-tooltip>
						</md-button>
					</md-table-cell>
				</md-table-row>
			</md-table>
		</div>
		<div class="md-layout-item md-size-100">
			<div v-if="showingWelcome" style="margin-top: 20px; margin-left: 40px">
				<div v-if="!canCreate" style="">
					<p>
						No dispone actualmente de {{ entityName.plural }}.
					</p>
				</div>
			</div>
		</div>
		<md-dialog-prompt :md-active.sync="activateSaveAs"
											:md-title="'Duplicar ' + entityName.single"
											v-model="newWorkName"
											md-input-maxlength="100"
											md-input-placeholder="Nombre de la nueva copia..."
											md-confirm-text="Guardar"
											md-cancel-text="Cancelar"
											@md-confirm="onDuplicateStart">
		</md-dialog-prompt>
	</div>
</template>

<script>
import ActiveWork from '@/backoffice/classes/ActiveWork';
import arr from '@/common/framework/arr';

export default {
	name: 'works',
	components: {

	},
	data() {
		return {
			activateNewWork: false,
			newWorkName: '',
			timeFilter: 0,
			works: [],
			search: '',
			worksFiltered: [],
			activateSaveAs: false,
		};
	},
	props: {
		filter: String
	},
	computed: {
		showingWelcome() {
			return window.Context.CartographiesStarted && this.works && this.works.length === 0;
		},
		showIndexingColumn() {
			return this.user.Privileges === 'A';
		},
		isDataAdmin() {
			return window.Context.IsDataAdmin();
		},
		user() {
			return window.Context.User;
		},
		entityName() {
			if (this.filter === 'P') {
				return { single: 'datos públicos', plural: 'datos públicos', one: '', article: 'los' };
			} else if (this.filter === 'R') {
				return { single: 'cartografía', plural: 'cartografías', one: 'una', article: 'la' };
			} else {
				throw '(entidad desconocida: ' + this.Filter + ')';
			}
		},
		newLabel() {
			if (this.filter === 'P') {
				return 'Nuevos datos públicos';
			} else if (this.filter === 'R') {
				return 'Nueva cartografía';
			} else {
				return '(entidad desconocida)';
			}
		},
	},
		mounted() {
			if (this.filter === 'P') {
				this.refreshWorks();
			}
		},
	methods: {
		getWorkUri(element, absoluteUrl) {
			var pre = '';
			if (absoluteUrl) {
				pre ='/users/#';
			}
			return pre + '/cartographies/' + element.Id + '/content';
		},
		totalSizeMB(item) {
			return this.formatMB(item.TotalSizeBytes);
		},
		formatSizes(item) {
			var ret = "";
			if (item.DraftDataBytes + item.DraftIndexBytes + item.DraftAttachmentBytes > 0)
				ret += "BORRADOR\n";
			if (item.DraftDataBytes + item.DraftIndexBytes  > 0)
				ret += "Datos: " + this.formatMB(item.DraftDataBytes + item.DraftIndexBytes) + "\n";
			if (item.DraftAttachmentBytes > 0)
				ret += "Adjuntos: " + this.formatMB(item.DraftAttachmentBytes) + "\n";

			if (item.DataBytes + item.IndexBytes + item.AttachmentBytes > 0)
				ret += "PUBLICADOS\n";
			if (item.DataBytes + item.IndexBytes > 0)
				ret += "Datos: " + this.formatMB(item.DataBytes + item.IndexBytes) + "\n";
			if (item.AttachmentBytes > 0)
				ret += "Adjuntos: " + this.formatMB(item.AttachmentBytes);
			return ret;
		},
		formatMB(n) {
			return (n / 1024 / 1024).toFixed(2) + "MB";
		},
		select(element) {
			window.open(this.getWorkUri(element, true), '_blank');
		},
		loadData() {
			if (this.works.length == 0) {
				this.refreshWorks();
			}
		},
		refreshWorks() {
			var loc = this;
			this.$refs.invoker.doMessage('Obteniendo cartografías', window.Db,
					window.Db.GetWorks, this.filter, this.timeFilter).then(function(data) {
						arr.Fill(loc.works, data);
						loc.applyFilters();
						});
		},
		applyFilters() {
			this.worksFiltered = arr.SearchByCaption(this.works, this.search);
		},
		calculateUsage() {
			var loc = this;
			this.$refs.invoker.doMessage('Calculando espacio', window.Db,
				window.Db.CalculateSpaceUsage).then(function (data) {
					loc.refreshWorks();
				});
		},
		publishDisabled(item) {
			return !(item.MetadataLastOnline === null || item.HasChanges !== 0);
		},
		revokeDisabled(item) {
			return (item.MetadataLastOnline === null);
		},
		status(item) {
			return ActiveWork.CalculateListItemStatus(item);
		},
		canEdit(item) {
			if (window.Context.User.Privileges === 'A') {
				return true;
			}
			return (window.Context.User.Privileges === 'E');
		},
		onDelete(item) {
			var loc = this;
			this.source = item;
			this.$refs.invoker.confirm('Eliminar ' + this.entityName.single,
				'Los datasets, indicadores y metadatos correspondientes a \'' + item.Caption + '\' serán eliminados',
					function() {
						loc.$refs.DeleteStepper.startUrl = window.Db.GetStartWorkDeleteUrl(item.Id);
						loc.$refs.DeleteStepper.stepUrl = window.Db.GetStepWorkDeleteUrl();
						loc.$refs.DeleteStepper.setTitle('Eliminando ' + loc.entityName.single);
						loc.$refs.DeleteStepper.Start();
			});
		},
		onDeleteComplete() {
			arr.Remove(this.works, this.source);
		},
		onDuplicate(item) {
			this.source = item;
			this.newWorkName = '';
			this.activateSaveAs = true;
		},
		onPublish(item) {
			if (item.DatasetCount > item.GeorreferencedCount) {
				alert('Todos los datasets deben estar georreferenciados para poder realizarse la publicación.');
				return;
			}
			this.$refs.stepper.startUrl = window.Db.GetStartWorkPublishUrl(item.Id);
			this.$refs.stepper.stepUrl = window.Db.GetStepWorkPublishUrl();
			this.$refs.stepper.setTitle('Publicando ' + this.entityName.single);
			this.$refs.stepper.Start().then(function () {
						item.HasChanges = 0;
						item.MetadataLastOnline = new Date();
						item.PreviewId = null;
						});
		},
		onIndexedChanged(item) {
			this.$refs.invoker.doSave(window.Db,
														window.Db.UpdateWorkIndexing, item);
		},
		onSegmentedCrawlingChanged(item) {
			this.$refs.invoker.doSave(window.Db,
				window.Db.UpdateWorkSegmentedCrawling, item);
		},
		onRevoke(item) {
			this.$refs.stepper.startUrl = window.Db.GetStartWorkRevokeUrl(item.Id);
			this.$refs.stepper.stepUrl = window.Db.GetStepWorkRevokeUrl();
			this.$refs.stepper.setTitle('Revocando publicación');
			this.$refs.stepper.Start().then(function () {
					item.MetadataLastOnline = null;
					item.PreviewId = null;
					});
		},
		onDuplicateStart() {
			var loc = this;
			if (this.newWorkName.trim().length === 0) {
				alert('Debe indicar un nombre.');
				this.$nextTick(() => {
					loc.activateSaveAs = true;
				});
				return;
			}
			this.$refs.stepper.startUrl = window.Db.GetStartWorkCloneUrl(this.source.Id, this.newWorkName);
			this.$refs.stepper.stepUrl = window.Db.GetStepWorkCloneUrl();
			this.$refs.stepper.setTitle('Duplicando ' + this.entityName.single);
			this.$refs.stepper.Start().then(function() {
						loc.refreshWorks(); });
		},
	},
		watch: {
			'works'() {
				this.search = '';
				this.applyFilters();
			},
		}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

.dashboard {
	&-container {
		margin: 30px;
	}
	&-text {
		font-size: 20px;
		line-height: 30px;
	}
}

.extraIconContainer {
  position: absolute;
  right: calc(28%);
  bottom: 16px;
  width: 13px;
  border-radius: 10px;
  overflow: hidden;
  height: 13px;

}
.extraIcon {
	 background-color: white;
  font-size: 15px !important;
  color: #868686;
  margin-left: -5px;
  margin-top: -6px;
}
</style>
