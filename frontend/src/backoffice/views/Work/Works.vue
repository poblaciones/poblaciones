<template>
	<div class="md-layout">
		<div v-if="list.length > 8">
			<div class="md-layout-item md-size-100" style="margin-bottom: 10px;">
				Recientes
			</div>
			<div class="md-layout-item md-size-100" style="margin-bottom: 1px;">
				<div style="position: relative; display: inline" v-for="item in lastest" :key="item.Id">
					<mp-large-data-item @click="select(item)" :item="item" />
					<work-actions :item="item" actions="I" @action="actionSelected" />
				</div>
			</div>
		</div>

		<div class="md-layout-item md-size-100">
			<stepper ref="DeleteStepper" @completed="onDeleteComplete">
			</stepper>
			<stepper ref="SaveAsStepper">
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
		<work-items :list="list" :filter="filter" @action="actionSelected" actions="I" />

		<work-items :list="listArchived" :filter="filter" icon="archive" @action="actionSelected" actions="A" label="Archivadas" />

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
						<work-actions :item="item" actions="S" @action="actionSelected"></work-actions>
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
import WorkActions from './WorkActions';
import WorkItems from './WorkItems';


export default {
	name: 'works',
	components: {
		WorkActions,
		WorkItems
	},
	data() {
		return {
			activateNewWork: false,
			newWorkName: '',
			timeFilter: 0,
			works: [],
			examplesExpanded: true,
			activateSaveAs: false,
		};
	},
	props: {
		filter: String,
		createEnabled: { type: Boolean, default: true },
		},
		mounted() {
			this.examplesExpanded = window.Db.GetUserSetting('examplesExpanded', '1') == '1';
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
				// Ordena descendiente por fecha
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
				get() {
					return this.calculateList(false, false);
				},
				set(value) {

				}
			},
			listArchived: {
				get() {
					return this.calculateList(true, false);
				},
				set(value) {

				}
			},
			listExamples: {
				get() {
					return this.calculateList(false, false, true);
				},
				set(value) {

				}
			},
	},
	methods: {
		getWorkUri(element) {
			return '/cartographies/' + element.Id + '/metadata/content';
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
			//this.customSort(ret);
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
			if (o1 === o2) {
				return 0;
			}
			if (o1 === null) {
				return -1;
			}
			if (o2 === null) {
				return 1;
			}
			if (typeof o1 === 'string' && typeof o2 === 'string') {
				return o1.localeCompare(o2, undefined, { sensitivity: 'accent' });
			} else {
				return o1 < o2 ? -1 :
					o1 > o2 ? 1 : 0;
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
			arr.Remove(window.Context.Cartographies, this.source);
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
				this.$nextTick(() => {
					loc.activateNewWork = true;
				});
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
				this.$nextTick(() => {
					loc.activateSaveAs = true;
				});
				return;
			}
			this.$refs.stepper.startUrl = window.Db.GetStartWorkCloneUrl(this.source.Id, this.newWorkName);
			this.$refs.stepper.stepUrl = window.Db.GetStepWorkCloneUrl();
			this.$refs.stepper.setTitle('Duplicando ' + this.entityName.single);
			this.$refs.stepper.Start().then(function() {
						window.Db.LoadWorks(); });
		},
		},
		watch: {
			'examplesExpanded'() {
				window.Db.SetUserSetting('examplesExpanded', (this.examplesExpanded ? '1' : '0'));
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
	.tinyIcon {
		font-size: 10px;
		margin: 3px 2px 0px 2px;
	}

	.extraIcon {
		background-color: white;
		font-size: 15px !important;
		color: #868686;
		margin-left: -5px;
		margin-top: -6px;
	}
</style>
