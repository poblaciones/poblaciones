<template>
	<div class="md-layout">
		<div class="md-layout-item md-size-100" style="margin-bottom: 10px;">
			 Sugeridas
		</div>
		<div class="md-layout-item md-size-100" style="margin-bottom: 1px;">
				<mp-large-data-item v-for="item in lastest" :key="item.Id" @click="select(item)" :item="item" />
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
		<div class="md-layout-item md-size-100">
			<md-table style="max-width: 1000px;" v-if="list.length > 0" v-model="list"
								:md-sort.sync="currentSort" :md-sort-order.sync="currentSortOrder" :md-sort-fn="customSort"
								md-card>
				<md-table-row slot="md-table-row" slot-scope="{ item }">
					<md-table-cell style="min-width: 400px" @click.native="select(item)" class="selectable" md-label="Título" md-sort-by="Caption">
						<a :href="getWorkUri(item, true)" class="normalTextLink">{{ item.Caption }}</a>
					</md-table-cell>
					<md-table-cell @click.native="select(item)" class="selectable"
												 md-label="Contenido" md-sort-by="History">
						<span>
							<i v-if="logInfo(item)" style="margin-right: 5px; font-size: 11px;"
								 class="tinyIcon vsm-icon fa fa-history"></i>
							<md-tooltip md-direction="bottom">{{ logInfo(item) }}</md-tooltip>
						</span>
						<span>
							{{ item.DatasetCount }} <i class="tinyIcon vsm-icon fa fa-table"></i>
							<md-tooltip md-direction="bottom">{{ item.DatasetCount + (item.DatasetCount == 1 ? ' dataset' : ' datasets') }}</md-tooltip>
						</span>,<span>
								{{ item.MetricCount }} <i class="tinyIcon vsm-icon fa fa-chart-bar"></i>
								<md-tooltip md-direction="bottom">{{ item.MetricCount + (item.MetricCount == 1 ? ' indicador' : ' indicadores') }}</md-tooltip>
							</span>
					</md-table-cell>
					<md-table-cell @click.native="select(item)" class="selectable"
													md-label="Estado">
						<md-icon :style="'color: ' + status(item).color">{{ status(item).icon }}</md-icon>
						<md-tooltip md-direction="bottom">{{ status(item).label }}</md-tooltip>
						<div class="extraIconContainer">
							<md-icon v-if="item.IsPrivate" class="extraIcon">
								lock
								<md-tooltip md-direction="bottom">Visiblidad: Privado. Para cambiar la visiblidad, acceda a Editar > Visiblidad.</md-tooltip>
							</md-icon>
							<md-icon v-if="!item.IsPrivate && !item.IsIndexed && status(item).tag !== 'unpublished'"
											 class="extraIcon">error_outline</md-icon>
							<md-tooltip md-direction="bottom">
								No indexada. El buscador de Poblaciones no publica los indicadores de esta cartografía en sus resultados.
								Para que sean incluidos, debe solictar una revisión desde Modificar > Visiblidad > Solicitar revisión.
							</md-tooltip>
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
						No dispone actualmente de {{ entityName.plural
							}}.
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
import ActiveWork from '@/backoffice/classes/ActiveWork';
import arr from '@/common/framework/arr';
import f from '@/backoffice/classes/Formatter';
import speech from '@/common/js/speech';

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
			currentSort: 'Caption',
			currentSortOrder: 'asc',
			activateSaveAs: false,
		};
	},
	props: {
		filter: String,
		createEnabled: { type: Boolean, default: true },
	},
		computed: {
			showingWelcome() {
				return window.Context.CartographiesStarted && this.list && this.list.length === 0;
			},
			lastest() {
				var listCopy = [];
				arr.AddRange(listCopy, this.list);
				this.doSort(listCopy, 'History', 'desc');
				return listCopy.slice(0, 4);
			},
			user() {
				return window.Context.User;
			},
			canCreate() {
				return (this.filter !== 'P' || window.Context.CanCreatePublicData());
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
					var ret = [];

					if (window.Context.Cartographies) {
						for (var i = 0; i < window.Context.Cartographies.length; i++) {
							if (window.Context.Cartographies[i].Type === this.filter) {
								ret.push(window.Context.Cartographies[i]);
							}
						}
					}
					return ret;
				},
				set(value) {

				}
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
		logInfo(item) {
			return speech.FormatWorkInfo(item);
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
			return o1 < o2 ? -1 :
				o1 > o2 ? 1 : 0;
		},
		customSort(value) {
			return this.doSort(value, this.currentSort, this.currentSortOrder);
		},
		doSort(value, sortBy, direction) {
			var loc = this;
			return value.sort((a, b) => {
				var sign = (direction === 'desc' ? -1 : 1);
				if (sortBy === 'History') {
					return sign * loc.ocompare(speech.GetValidaDate(a), speech.GetValidaDate(b));

				} else {
					return sign * loc.ocompare(a[sortBy], b[sortBy]);
				}
			});
		},
		select(element) {
			this.$router.push({ path: this.getWorkUri(element, false) }).catch();
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
			if (this.filter === 'P' && window.Context.User.Privileges === 'E') {
				return true;
			}
			return item.Privileges !== 'V';
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
						item.Updated = new Date();
						item.UpdateUser = f.formatFullName(window.Context.User);
						item.MetadataLastOnline = new Date();
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
						window.Db.LoadWorks(); });
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
