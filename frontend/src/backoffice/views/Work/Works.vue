<template>
	<div class="md-layout">
		<div v-if="list.length > 8">
			<div class="md-layout-item md-size-100" style="margin-bottom: 10px;">
				Recientes
			</div>
			<div class="md-layout-item md-size-100" style="margin-bottom: 1px;">
				<div style="position: relative; display: inline" v-for="item in lastest" :key="item.Id">
					<mp-large-data-item @click="select(item)" :item="item" />
					<work-item-actions :item="item" actions="I" :filter="filter" @action="actionSelected" />
				</div>
			</div>
		</div>

		<div class="md-layout-item md-size-100">
			<stepper ref="DeleteStepper" @completed="onDeleteComplete">
			</stepper>
			<stepper ref="stepper">
			</stepper>
			<invoker ref="invoker">
			</invoker>
			<div v-if="canCreate && !showingWelcome && createEnabled">
				<md-button @click="onNewWork">
					<md-icon>add_circle_outline</md-icon>
					{{ newLabel }}
				</md-button>
			</div>
		</div>

		<!-- Lista activa: soporta selección múltiple para archivar y eliminar. -->
		<div v-if="list.length > 0">
			<mp-grid
				:items="list"
				:columns="gridColumns"
				:actions="activeActions"
				multiSelect="optional"
				defaultSortBy="Modificado"
				defaultSortOrder="desc"
				:rowClick="onRowClick"
				:settingsKey="'works-' + filter + '-I'"
				canDelete
				:isItemDeleteEnabled="canDeleteActive"
				:entityName="entityName.single"
				:deleteConfirmMessage="deleteConfirmMessage"
				@itemDelete="onItemDelete" />
		</div>

		<!-- Lista archivada: soporta selección múltiple para desarchivar y eliminar. -->
		<div v-if="listArchived.length > 0">
			<md-button @click="toggleArchived" style="margin: 10px 0px 10px 0px">
				<md-icon>{{ (archivedExpanded ? 'expand_less' : 'expand_more' ) }}</md-icon>
				<md-icon>archive</md-icon>
				Archivadas ({{ listArchived.length }})
			</md-button>
			<transition name="fade">
				<div v-show="archivedExpanded">
					<mp-grid
						:items="listArchived"
						:columns="gridColumns"
						:actions="archivedActions"
						multiSelect="optional"
						defaultSortBy="Modificado"
						defaultSortOrder="desc"
						:rowClick="onRowClick"
						:settingsKey="'works-' + filter + '-A'"
						canDelete
						:isItemDeleteEnabled="canDeleteArchived"
						:entityName="entityName.single"
						:deleteConfirmMessage="deleteConfirmMessage"
						@itemDelete="onItemDelete" />
				</div>
			</transition>
		</div>

		<div class="md-layout-item md-size-100">
			<div v-if="showingWelcome" style="margin-top: 20px; margin-left: 40px">
				<div v-if="!canCreate" style="">
					<p>
						No dispone actualmente de {{ entityName.plural }}.
					</p>
				</div>
				<div v-else="">
					<p style="margin-bottom: 25px; line-height: 2em;">
						No hay {{ entityName.plural }} disponibles. Para crear {{ entityName.one }}
						{{ entityName.single }}, <br>seleccione la acción a continuación.
					</p>
					<md-button @click="onNewWork" class="md-raised">
						<md-icon>add_circle_outline</md-icon>
						{{ newLabel }}
					</md-button>
					<div v-if="help.UploadGuideLink || help.ReadGuideLink">
						<p style="line-height: 1em;">
							&nbsp;
						</p>
						<p style="margin-top: 25px; line-height: 2em;">
							Para información de uso:
						</p>
						<md-button @click="openPdf(help.ReadGuideLink.Url)" class="md-raised">
							<i class="far fa-file-pdf" />
							{{ help.ReadGuideLink.Caption }}
						</md-button>
						<md-button @click="openPdf(help.UploadGuideLink.Url)" class="md-raised">
							<i class="far fa-file-pdf" />
							{{ help.UploadGuideLink.Caption }}
						</md-button>
					</div>
				</div>
			</div>
		</div>

		<div class="md-layout" v-if="this.filter !== 'P' && listExamples.length > 0">
			<md-button @click="toggle" v-if="list.length > 0" style="margin: 10px 0px 10px 0px">
				<md-icon>{{ (examplesExpanded ? 'expand_less' : 'expand_more' ) }}</md-icon>
				<md-icon>lightbulb</md-icon>
				Ejemplos ({{ listExamples.length }})
			</md-button>
			<transition name="fade">
				<div class="md-layout-item md-size-100" style="margin-bottom: 1px;" v-show="examplesExpanded">
					<div style="position: relative; display: inline" v-for="item in listExamples" :key="item.Id">
						<mp-large-data-item @click="select(item)" :item="item" :showEdited="false" />
						<work-actions :item="item" actions="S" :filter="filter" @action="actionSelected"></work-actions>
					</div>
				</div>
			</transition>
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
		<md-dialog-prompt :md-active.sync="activateNewWork"
						  v-model="newWorkName"
						  :md-title="'Indique el título de ' + entityName.article + ' ' + newLabel.toLowerCase()"
						  md-input-maxlength="200"
						  :md-input-placeholder="newLabel"
						  md-confirm-text="Aceptar"
						  md-cancel-text="Cancelar"
						  @md-confirm="onNewWorkStart">
		</md-dialog-prompt>
	</div>
</template>

<script>
import arr from '@/common/framework/arr';
import str from '@/common/framework/str';
import f from '@/backoffice/classes/Formatter';
import date from '@/common/framework/date';
import speech from '@/common/js/speech';
import ActiveWork from '@/backoffice/classes/ActiveWork';
import WorkPermissions from '@/backoffice/classes/WorkPermissions';
import WorkItemActions from './WorkItemActions';


export default {
	name: 'works',
	components: {
		WorkItemActions
	},
	data() {
		return {
			activateNewWork: false,
			newWorkName: '',
			timeFilter: 0,
			works: [],
			examplesExpanded: true,
			archivedExpanded: true,
			activateSaveAs: false,
			// ── Estado de borrado en lote (compartido por ambas listas) ──────────
			isBulkDeleting: false,
			bulkDeleteQueue: [],
			bulkDeleteIndex: 0,
			bulkDeleteTotal: 0,
		};
	},
	props: {
		filter: String,
		createEnabled: { type: Boolean, default: true },
	},
	mounted() {
		this.examplesExpanded = window.Db.GetUserSetting('examplesExpanded', '1') == '1';
		this.archivedExpanded = window.Db.GetUserSetting('worksArchivedExpanded-' + this.filter, '1') == '1';
	},
	computed: {
		showingWelcome() {
			return window.Context.CartographiesStarted && this.list && this.list.length === 0;
		},
		help() {
			return window.Context.Configuration.Help;
		},
		speechFormat() {
			return speech;
		},
		canCreate() {
			return (this.filter !== 'P' || window.Context.CanCreatePublicData());
		},
		lastest() {
			var listCopy = [];
			var loc = this;
			arr.AddRange(listCopy, this.list);
			listCopy.sort((a, b) => {
				return -1 * loc.ocompare(speech.GetValidaDate(a), speech.GetValidaDate(b));
			});
			return listCopy.slice(0, 4);
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
		list: {
			get() { return this.calculateList(false, false); },
			set(value) {}
		},
		listArchived: {
			get() { return this.calculateList(true, false); },
			set(value) {}
		},
		listExamples: {
			get() { return this.calculateList(false, false, true); },
			set(value) {}
		},
		// Columnas compartidas por la grilla activa y la archivada. El link
		// del título, los indicadores de "Modificado" y el ícono de estado
		// con sus badges quedan descriptos acá; el HTML lo arma mp-grid.
		gridColumns() {
			var loc = this;
			return [
				{ property: 'Caption', caption: 'Título', href: function (item) { return loc.getWorkHref(item); } },
				{
					property: 'Modificado',
					caption: 'Modificado',
					type: 'icons',
					sortType: 'date',
					sortValue: function (item) { return speech.GetValidaDate(item); },
					icons: [
						{
							icon: 'fas fa-history',
							show: function (item) { return !!loc.logInfo(item); },
							tooltip: function (item) { return loc.logInfo(item); },
						},
						{
							icon: 'fas fa-table',
							text: function (item) { return item.DatasetCount; },
							tooltip: function (item) { return item.DatasetCount + (item.DatasetCount == 1 ? ' dataset' : ' datasets'); },
						},
						{
							icon: 'fas fa-chart-bar',
							text: function (item) { return item.MetricCount; },
							tooltip: function (item) { return item.MetricCount + (item.MetricCount == 1 ? ' indicador' : ' indicadores'); },
						},
					],
				},
				{
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
							show: function (item) { return !item.IsPrivate && !item.IsIndexed && loc.status(item).tag !== 'unpublished'; },
							tooltip: 'No indexada. El buscador de Poblaciones no publica los indicadores de esta cartografía en sus '
								+ 'resultados. Para que sean incluidos, debe solictar una revisión desde Modificar > Visiblidad > Solicitar revisión.',
						},
					],
				},
			];
		},
		// Acciones comunes a la lista activa y la archivada; Archivar/
		// Desarchivar difieren entre una y otra, y se agregan aparte.
		baseWorkActions() {
			var loc = this;
			return [
				{ icon: 'remove_red_eye', caption: 'Consultar', onClick: function (grid, item) { loc.actionSelected('VIEW', item); }, isEnabled: function (item) { return !loc.canEdit(item); } },
				{ icon: 'public', caption: 'Publicar', onClick: function (grid, item) { loc.actionSelected('PUBLISH', item); }, isEnabled: function (item) { return loc.canEdit(item) && !loc.publishDisabled(item); } },
				{ icon: 'pause_circle_filled', caption: 'Revocar publicación', onClick: function (grid, item) { loc.actionSelected('REVOKE', item); }, isEnabled: function (item) { return loc.canEdit(item) && !loc.revokeDisabled(item); } },
				{ icon: 'edit', caption: 'Modificar', onClick: function (grid, item) { loc.actionSelected('EDIT', item); }, isEnabled: function (item) { return loc.canEdit(item); } },
				{ icon: 'file_copy', caption: 'Duplicar', onClick: function (grid, item) { loc.actionSelected('DUPLICATE', item); }, isEnabled: function (item) { return loc.canEdit(item); } },
				{ icon: 'playlist_add', caption: 'Promover a Dato público', onClick: function (grid, item) { loc.actionSelected('PROMOTE', item); }, isEnabled: function (item) { return WorkPermissions.CanPromotePublic(item); } },
				{ icon: 'lightbulb', caption: 'Convertir a ejemplo', onClick: function (grid, item) { loc.actionSelected('PROMOTEEXAMPLE', item); }, isEnabled: function (item) { return WorkPermissions.CanPromoteExample(item); } },
				{ icon: 'playlist_remove', caption: 'Convertir en Cartografía', onClick: function (grid, item) { loc.actionSelected('DEMOTE', item); }, isEnabled: function (item) { return WorkPermissions.CanDemotePublic(item); } },
			];
		},
		activeActions() {
			var loc = this;
			return this.baseWorkActions.concat([
				{ icon: 'archive', caption: 'Archivar', multiSelect: true, onClick: function (grid, itemOrItems) { loc.onArchiveAction(grid, itemOrItems); } },
			]);
		},
		archivedActions() {
			var loc = this;
			return this.baseWorkActions.concat([
				{ icon: 'unarchive', caption: 'Desarchivar', multiSelect: true, onClick: function (grid, itemOrItems) { loc.onUnarchiveAction(grid, itemOrItems); } },
			]);
		},
	},
	methods: {

		// ── Habilitación y formato de acciones (usados por gridColumns/*Actions) ───
		// canEdit/publishDisabled/revokeDisabled delegan en WorkPermissions
		// (compartido con WorkItemActions, usado en Recientes/Ejemplos); logInfo
		// y status son formato puro, no permisos, y se quedan acá.

		canEdit(item) {
			return WorkPermissions.CanEdit(item, this.filter);
		},
		// Mismo criterio que el menú de tarjetas (WorkItemActions): solo un
		// admin puede eliminar, no alcanza con poder editar.
		canDeleteActive(item) {
			return WorkPermissions.CanDelete(item, 'I');
		},
		canDeleteArchived(item) {
			return WorkPermissions.CanDelete(item, 'A');
		},
		publishDisabled(item) {
			return WorkPermissions.PublishDisabled(item);
		},
		revokeDisabled(item) {
			return WorkPermissions.RevokeDisabled(item);
		},
		logInfo(item) {
			return speech.FormatWorkInfo(item);
		},
		status(item) {
			return ActiveWork.CalculateListItemStatus(item);
		},
		// Uri absoluta para el link de la celda de título (navegación real vía
		// <a href>); distinta de getWorkUri, que arma la ruta relativa que usa
		// select() con $router.push.
		getWorkHref(element) {
			return '/users/#/cartographies/' + element.Id;
		},
		onRowClick(grid, item) {
			this.select(item);
		},

		// ── Colapso del bloque "Archivadas" ─────────────────────────────────────

		toggleArchived() {
			this.archivedExpanded = !this.archivedExpanded;
		},

		// ── Enrutadores de las acciones Archivar/Desarchivar/Eliminar de la
		// grilla: reciben la propia grilla como primer parámetro para poder
		// cerrar su selección múltiple (grid.clearSelection()) una vez
		// confirmada la operación en lote. ─────────────────────────────────────

		onArchiveAction(grid, itemOrItems) {
			if (Array.isArray(itemOrItems)) {
				this.startBulkArchive(itemOrItems, function () { grid.clearSelection(); });
			} else {
				this.onArchive(itemOrItems);
			}
		},
		onUnarchiveAction(grid, itemOrItems) {
			if (Array.isArray(itemOrItems)) {
				this.startBulkUnarchive(itemOrItems, function () { grid.clearSelection(); });
			} else {
				this.onUnarchive(itemOrItems);
			}
		},

		// Mensaje de confirmación que arma la propia grilla para CanDelete
		// (ella siempre confirma; esto solo aporta el texto del dominio).
		deleteConfirmMessage(itemOrItems) {
			if (Array.isArray(itemOrItems)) {
				const count = itemOrItems.length;
				return `Los datasets, indicadores y metadatos de las ${count} ${this.entityName.plural} seleccionadas `
					+ 'serán eliminados permanentemente. Esta operación no puede deshacerse.';
			}
			return `Los datasets, indicadores y metadatos correspondientes a '${itemOrItems.Caption}' serán eliminados.`;
		},

		// Handler de @itemDelete: la grilla ya confirmó antes de emitirlo,
		// así que acá se ejecuta directamente (no se vuelve a confirmar).
		onItemDelete(itemOrItems) {
			if (Array.isArray(itemOrItems)) {
				this.runBulkDelete(itemOrItems);
			} else {
				this.runDelete(itemOrItems);
			}
		},

		// ── Borrado en lote ───────────────────────────────────────────────────────

		runBulkDelete(items) {
			this.bulkDeleteQueue = [...items];
			this.bulkDeleteIndex = 0;
			this.bulkDeleteTotal = items.length;
			this.isBulkDeleting = true;
			this.runNextBulkDelete();
		},

		runNextBulkDelete() {
			const item = this.bulkDeleteQueue[this.bulkDeleteIndex];
			const n = this.bulkDeleteIndex + 1;
			const t = this.bulkDeleteTotal;
			this.source = item;
			this.$refs.DeleteStepper.startUrl = window.Db.GetStartWorkDeleteUrl(item.Id);
			this.$refs.DeleteStepper.stepUrl = window.Db.GetStepWorkDeleteUrl();
			this.$refs.DeleteStepper.setTitle(`Eliminando cartografías (${n}/${t})`);
			this.$refs.DeleteStepper.useClose = false;
			this.$refs.DeleteStepper.Start();
		},

		onDeleteComplete() {
			arr.Remove(window.Context.Cartographies, this.source);
			if (this.isBulkDeleting) {
				this.bulkDeleteIndex++;
				if (this.bulkDeleteIndex < this.bulkDeleteTotal) {
					// Cierra el stepper actual, pausa breve para ver el estado completado,
					// y abre el siguiente.
					setTimeout(() => {
						this.$refs.DeleteStepper.Close();
						this.$nextTick(() => this.runNextBulkDelete());
					}, 1);
				} else {
					// Último ítem: el stepper queda en su estado completado para cierre manual.
					this.$refs.DeleteStepper.useClose = true;
					this.isBulkDeleting = false;
				}
			}
		},

		// ── Archivo en lote ───────────────────────────────────────────────────────

		startBulkArchive(items, onConfirmed) {
			const count = items.length;
			const loc = this;
			this.$refs.invoker.confirm(
				`Archivar ${count} ${this.entityName.plural}`,
				`Las ${count} ${this.entityName.plural} seleccionadas serán archivadas.`,
				function () {
					if (onConfirmed) onConfirmed();
					loc.runBulkArchive([...items]);
				}
			);
		},

		async runBulkArchive(items) {
			const total = items.length;
			for (let i = 0; i < items.length; i++) {
				const item = items[i];
				await this.$refs.invoker.doMessage(
					`Archivando cartografías (${i + 1}/${total})`,
					window.Db, window.Db.ArchiveWork, item.Id
				);
				item.IsArchived = true;
			}
		},

		// ── Desarchivo en lote ────────────────────────────────────────────────────

		startBulkUnarchive(items, onConfirmed) {
			const count = items.length;
			const loc = this;
			this.$refs.invoker.confirm(
				`Reactivar ${count} ${this.entityName.plural}`,
				`Las ${count} ${this.entityName.plural} archivadas serán reactivadas.`,
				function () {
					if (onConfirmed) onConfirmed();
					loc.runBulkUnarchive([...items]);
				}
			);
		},

		async runBulkUnarchive(items) {
			const total = items.length;
			for (let i = 0; i < items.length; i++) {
				const item = items[i];
				await this.$refs.invoker.doMessage(
					`Reactivando cartografías (${i + 1}/${total})`,
					window.Db, window.Db.UnarchiveWork, item.Id
				);
				item.IsArchived = false;
			}
		},

		// ── Métodos existentes ────────────────────────────────────────────────────

		getWorkUri(element) {
			return '/cartographies/' + element.Id;
		},
		openPdf(pdf) {
			window.open(pdf, '_blank');
		},
		calculateList(archived, deleted, example = false) {
			var ret = [];
			if (window.Context.Cartographies) {
				for (var i = 0; i < window.Context.Cartographies.length; i++) {
					var item = window.Context.Cartographies[i];
					if (item.Type === this.filter &&
						item.IsArchived === archived &&
						item.IsDeleted === deleted &&
						item.IsExample === example) {
						if (example) {
							var setting = window.Db.GetUserSetting('work_example_hidden_' + item.Id, '0') == '1';
							if (!setting) {
								ret.push(item);
							}
						} else {
							ret.push(item);
						}
					}
				}
			}
			return ret;
		},
		onLogicalDelete(item) {
			this.$refs.invoker.doMessage('Enviando a la papelera', window.Db, window.Db.DeleteWork, item.Id).then(() => {
				item.Deleted = true;
				item.Archived = false;
			});
		},
		toggle() {
			this.examplesExpanded = !this.examplesExpanded;
		},
		onRestore(item) {
			this.$refs.invoker.doMessage('Restaurando cartografía', window.Db, window.Db.RestoreWork, item.Id).then(() => {
				item.IsDeleted = false;
			});
		},
		onArchive(item) {
			this.$refs.invoker.doMessage('Archivando cartografía', window.Db, window.Db.ArchiveWork, item.Id).then(() => {
				item.IsArchived = true;
			});
		},
		onUnarchive(item) {
			this.$refs.invoker.doMessage('Reactivando cartografía', window.Db, window.Db.UnarchiveWork, item.Id).then(() => {
				item.IsArchived = false;
			});
		},
		onPurge(item) {
			this.$refs.invoker.confirm('Eliminar cartografía', this.$t('key.advertencia_borrar', { caption: item.Caption }),
				() => { this.onPurgeConfirm(item); });
		},
		onPurgeConfirm(item) {
			this.$refs.invoker.doMessage('Eliminando cartografía', window.Db, window.Db.PurgeWork, item.Id).then(() => {
				arr.Remove(window.Context.Works, item);
			});
		},
		actionSelected(action, item) {
			switch (action) {
				case 'VIEW':
				case 'EDIT':
					this.select(item);
					break;
				case 'DELETE':
					if (item.IsExample) {
						this.onDeleteExample(item);
					} else {
						this.onDelete(item);
					}
					break;
				case 'PUBLISH':
					this.onPublish(item);
					break;
				case 'PROMOTEEXAMPLE':
					this.onPromoteExample(item);
					break;
				case 'DEMOTEEXAMPLE':
					this.onDemoteExample(item);
					break;
				case 'REVOKE':
					this.onRevoke(item);
					break;
				case 'PROMOTE':
					this.onPromotePublic(item);
					break;
				case 'DEMOTE':
					this.onDemotePublic(item);
					break;
				case 'ARCHIVE':
					this.onArchive(item);
					break;
				case 'UNARCHIVE':
					this.onUnarchive(item);
					break;
				case 'PURGE':
					this.onPurge(item);
					break;
				case 'DUPLICATE':
					this.onDuplicate(item, item.IsExample);
					break;
				case 'RESTORE':
					this.onRestore(item);
					break;
			}
		},
		ocompare(o1, o2) {
			if (o1 === o2) { return 0; }
			if (o1 === null) { return -1; }
			if (o2 === null) { return 1; }
			if (typeof o1 === 'string' && typeof o2 === 'string') {
				return o1.localeCompare(o2, undefined, { sensitivity: 'accent' });
			} else {
				return o1 < o2 ? -1 : o1 > o2 ? 1 : 0;
			}
		},
		select(element) {
			this.$router.push({ path: this.getWorkUri(element) }).catch();
		},
		onPromoteExample(item) {
			this.$refs.invoker.doMessage('Creando ejemplo', window.Db, window.Db.PromoteExample, item.Id).then(() => {
				item.IsExample = true;
			});
		},
		onDemoteExample(item) {
			this.$refs.invoker.doMessage('Quitando ejemplo', window.Db, window.Db.DemoteExample, item.Id).then(() => {
				item.IsExample = false;
			});
		},
		onPromotePublic(item) {
			var loc = this;
			this.source = item;
			this.$refs.invoker.confirmDo('Promover ' + this.entityName.single,
				'La cartografía será convertida a dato público. Los cambios no surtirán efecto hasta que la publique nuevamente teniendo este status.',
				window.Db, window.Db.PromoteWork, item.Id,
				function () {
					item.Type = 'P';
					arr.Remove(loc.list, item);
				});
		},
		onDeleteExample(item) {
			var loc = this;
			this.source = item;
			this.$refs.invoker.confirmDo('Eliminar ejemplo',
				'Si quita el elemento de su bandeja de ejemplos, no podrá volver a tenerlo disponible en el futuro.',
				window.Db, window.Db.HideExample, item.Id,
				function () {
					arr.Remove(window.Context.Cartographies, item);
					arr.Remove(loc.listExamples, item);
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
					arr.Remove(loc.list, item);
				});
		},
		onDelete(item) {
			var loc = this;
			this.$refs.invoker.confirm('Eliminar ' + this.entityName.single,
				'Los datasets, indicadores y metadatos correspondientes a \'' + item.Caption + '\' serán eliminados',
				function () { loc.runDelete(item); });
		},
		// Ejecuta el borrado sin confirmar; la usa onDelete (tras confirmar
		// acá) y onItemDelete (evento de la grilla, que ya confirmó ella misma).
		runDelete(item) {
			this.source = item;
			this.$refs.DeleteStepper.useClose = true;
			this.$refs.DeleteStepper.startUrl = window.Db.GetStartWorkDeleteUrl(item.Id);
			this.$refs.DeleteStepper.stepUrl = window.Db.GetStepWorkDeleteUrl();
			this.$refs.DeleteStepper.setTitle('Eliminando ' + this.entityName.single);
			this.$refs.DeleteStepper.Start();
		},
		onDuplicate(item, isExample) {
			this.source = item;
			this.newWorkName = '';
			if (!isExample) {
				this.activateSaveAs = true;
			} else {
				this.newWorkName = null;
				this.onDuplicateStart();
			}
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
				item.Updated = date.FormateDateTime(new Date());
				item.UpdateUser = f.formatFullName(window.Context.User);
				item.MetadataLastOnline = date.FormateDateTime(new Date());
				item.PreviewId = null;
				item.LastOnlineUser = f.formatFullName(window.Context.User);
				window.Db.ReleaseWork(item.Id);
			});
		},
		onNewWork() {
			this.newWorkName = '';
			this.activateNewWork = true;
		},
		onNewWorkStart() {
			var loc = this;
			if (this.newWorkName.trim().length === 0) {
				alert('Debe indicar un nombre.');
				this.$nextTick(() => { loc.activateNewWork = true; });
				return;
			}
			this.$refs.invoker.doMessage('Creando cartografía', window.Db,
				window.Db.CreateWork, this.newWorkName.trim(), this.filter).then(
				function (res) {
					loc.select(res);
				});
		},
		onRevoke(item) {
			this.$refs.stepper.startUrl = window.Db.GetStartWorkRevokeUrl(item.Id);
			this.$refs.stepper.stepUrl = window.Db.GetStepWorkRevokeUrl();
			this.$refs.stepper.setTitle('Revocando publicación');
			this.$refs.stepper.Start().then(function () {
				item.MetadataLastOnline = null;
				item.PreviewId = null;
				window.Db.ReleaseWork(item.Id);
			});
		},
		onDuplicateStart() {
			var loc = this;
			if (this.newWorkName !== null && this.newWorkName.trim().length === 0) {
				alert('Debe indicar un nombre.');
				this.$nextTick(() => { loc.activateSaveAs = true; });
				return;
			}
			this.$refs.stepper.startUrl = window.Db.GetStartWorkCloneUrl(this.source.Id, this.newWorkName);
			this.$refs.stepper.stepUrl = window.Db.GetStepWorkCloneUrl();
			this.$refs.stepper.setTitle('Duplicando ' + this.entityName.single);
			this.$refs.stepper.Start().then(function () {
				window.Db.LoadWorks();
			});
		},
	},
	watch: {
		'examplesExpanded'() {
			window.Db.SetUserSetting('examplesExpanded', (this.examplesExpanded ? '1' : '0'));
		},
		'archivedExpanded'() {
			window.Db.SetUserSetting('worksArchivedExpanded-' + this.filter, (this.archivedExpanded ? '1' : '0'));
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
</style>
