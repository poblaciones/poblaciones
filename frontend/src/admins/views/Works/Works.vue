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
		<md-radio v-model="timeFilter" class="md-primary" @change="onTimeFilterChanged" :value="0">Todas</md-radio>
		<md-radio v-model="timeFilter" class="md-primary" @change="onTimeFilterChanged" :value="7">Últimos 7 días</md-radio>
		<md-radio v-model="timeFilter" class="md-primary" @change="onTimeFilterChanged" :value="30">Últimos 30 días</md-radio>
		<md-radio v-model="timeFilter" class="md-primary" @change="onTimeFilterChanged" :value="90">Últimos 90 días</md-radio>
		<md-button @click="calculateUsage" style="margin-left: 60px">
			<md-icon>data_usage</md-icon> Recalcular tamaños
		</md-button>

		<div class="md-layout-item md-size-100" style="position: relative">
			<mp-grid
				:items="works"
				:columns="gridColumns"
				:actions="gridActions"
				:rowClick="onRowClick"
				:emptyMessage="emptyMessage"
				canDelete
				:isItemDeleteEnabled="canEdit"
				:entityName="entityName.single"
				:deleteConfirmMessage="deleteConfirmMessage"
				@itemDelete="onItemDelete" />
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
import WorkPermissions from '@/backoffice/classes/WorkPermissions';

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
		emptyMessage() {
			var ret = 'No hay ' + this.entityName.plural;
			return ret + (this.timeFilter ? ' para este período.' : '.');
		},
		gridColumns() {
			var loc = this;
			var columns = [
				{ property: 'Caption', caption: 'Título', href: function (item) { return loc.getWorkUri(item, true); } },
				{
					property: 'TotalSizeBytes', caption: 'Tamaño', sortType: 'number',
					value: function (item) { return loc.totalSizeMB(item); },
					tooltip: function (item) { return loc.formatSizes(item); },
				},
				{ property: 'DatasetCount', caption: 'Datasets', size: 1, sortType: 'number', tooltip: function (item) { return item.DatasetNames; } },
				{ property: 'MetricCount', caption: 'Indicadores', sortType: 'number' },
			];
			if (this.showIndexingColumn) {
				columns.push({ property: 'IsIndexed', caption: 'Indexado', type: 'switch', onChange: function (item) { loc.onIndexedChanged(item); } });
				columns.push({
					property: 'SegmentedCrawling', caption: 'Segmentado', type: 'switch',
					onChange: function (item) { loc.onSegmentedCrawlingChanged(item); },
					disabled: function (item) { return !item.IsIndexed; },
				});
			}
			columns.push({
				property: 'Estado',
				caption: 'Estado',
				type: 'status',
				sortable: false,
				icon: function (item) { return loc.status(item).icon; },
				color: function (item) { return loc.status(item).color; },
				tooltip: function (item) { return loc.status(item).label; },
				icons: [
					{
						icon: 'lock',
						show: function (item) { return item.IsPrivate; },
						tooltip: 'Visiblidad: Privado. Para cambiar la visiblidad, acceda a Editar > Visiblidad.',
					},
					{
						icon: 'error_outline',
						show: function (item) { return !loc.showIndexingColumn && !item.IsPrivate && !item.IsIndexed && loc.status(item).tag !== 'unpublished'; },
						tooltip: 'No indexada. El buscador de Poblaciones no publica los indicadores de esta cartografía en sus '
							+ 'resultados. Para que sean incluidos, debe solictar una revisión desde Modificar > Visiblidad > Solicitar revisión.',
					},
				],
			});
			return columns;
		},
		gridActions() {
			var loc = this;
			return [
				{ icon: 'remove_red_eye', caption: 'Consultar', onClick: function (grid, item) { loc.select(item); }, isEnabled: function (item) { return !loc.canEdit(item); } },
				{ icon: 'public', caption: 'Publicar', onClick: function (grid, item) { loc.onPublish(item); }, isEnabled: function (item) { return loc.canEdit(item) && !loc.publishDisabled(item); } },
				{ icon: 'pause_circle_filled', caption: 'Revocar publicación', onClick: function (grid, item) { loc.onRevoke(item); }, isEnabled: function (item) { return loc.canEdit(item) && !loc.revokeDisabled(item); } },
				{ icon: 'edit', caption: 'Modificar', onClick: function (grid, item) { loc.select(item); }, isEnabled: function (item) { return loc.canEdit(item); } },
				{ icon: 'file_copy', caption: 'Duplicar', onClick: function (grid, item) { loc.onDuplicate(item); }, isEnabled: function (item) { return loc.canEdit(item); } },
				{ icon: 'playlist_add', caption: 'Promover a Dato público', onClick: function (grid, item) { loc.onPromotePublic(item); }, isEnabled: function (item) { return WorkPermissions.CanPromotePublic(item); } },
				{ icon: 'playlist_remove', caption: 'Convertir en Cartografía', onClick: function (grid, item) { loc.onDemotePublic(item); }, isEnabled: function (item) { return WorkPermissions.CanDemotePublic(item); } },
			];
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
		onRowClick(grid, item) {
			this.select(item);
		},
		loadData() {
			if (this.works.length == 0) {
				this.refreshWorks();
			}
		},
		// El valor llega por el evento: no se lee de timeFilter porque
		// v-model y este handler escuchan el mismo evento, y el orden entre
		// ambos no está garantizado.
		onTimeFilterChanged(value) {
			this.timeFilter = value;
			this.refreshWorks();
		},
		refreshWorks() {
			var loc = this;
			this.$refs.invoker.doMessage('Obteniendo cartografías', window.Db,
					window.Db.GetWorks, this.filter, this.timeFilter).then(function(data) {
						arr.Fill(loc.works, data);
						});
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
		deleteConfirmMessage(item) {
			return 'Los datasets, indicadores y metadatos correspondientes a \'' + item.Caption + '\' serán eliminados';
		},
		onItemDelete(item) {
			this.runDelete(item);
		},
		runDelete(item) {
			this.source = item;
			this.$refs.DeleteStepper.startUrl = window.Db.GetStartWorkDeleteUrl(item.Id);
			this.$refs.DeleteStepper.stepUrl = window.Db.GetStepWorkDeleteUrl();
			this.$refs.DeleteStepper.setTitle('Eliminando ' + this.entityName.single);
			this.$refs.DeleteStepper.Start();
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
		onPromotePublic(item) {
			var loc = this;
			this.source = item;
			this.$refs.invoker.confirmDo('Promover ' + this.entityName.single,
				'La cartografía será convertida a dato público. Los cambios no surtirán efecto hasta que la publique nuevamente teniendo este status.',
				window.Db, window.Db.PromoteWork, item.Id,
				function () {
					item.Type = 'P';
					arr.Remove(loc.works, item);
				});
		},
		onDemotePublic(item) {
			var loc = this;
			this.source = item;
			this.$refs.invoker.confirmDo('Revocar promoción de ' + this.entityName.single,
				'El dato público será convertido a cartografía. Los cambios no surtirán efecto hasta que la publique nuevamente teniendo este status.',
				window.Db, window.Db.DemoteWork, item.Id,
				function () {
					item.Type = 'R';
					arr.Remove(loc.works, item);
				});
		},
	},
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
</style>
