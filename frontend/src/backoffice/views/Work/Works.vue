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

		<div v-if="canCreate && !showingWelcome && createEnabled">
			<md-button @click="onNewWork">
				<md-icon>add_circle_outline</md-icon>
				{{ newLabel }}
			</md-button>
		</div>
		</div>

		<div v-if="offerAdminActions">
			<md-radio v-model="timeFilter" class="md-primary" @change="refreshWorks" :value="0">Todas</md-radio>
			<md-radio v-model="timeFilter" class="md-primary" @change="refreshWorks" :value="7">Últimos 7 días</md-radio>
			<md-radio v-model="timeFilter" class="md-primary" @change="refreshWorks" :value="30">Últimos 30 días</md-radio>
			<md-radio v-model="timeFilter" class="md-primary" @change="refreshWorks" :value="90">Últimos 90 días</md-radio>
		</div>
			<div class="md-layout-item md-size-100">
				<md-table style="max-width: 1000px;" v-if="list.length > 0" v-model="list" md-sort="title" md-sort-order="asc" md-card>
						<md-table-row slot="md-table-row" slot-scope="{ item }">
							<md-table-cell @click.native="select(item)" class="selectable" md-label="Título" md-sort-by="title">
								<a :href="getWorkUri(item, true)" class="normalTextLink">{{ item.Caption }}</a>
							</md-table-cell>
          			<md-table-cell @click.native="select(item)" class="selectable" md-label="Datasets">{{ item.DatasetCount }}</md-table-cell>
								<md-table-cell @click.native="select(item)" class="selectable" md-label="Indicadores">{{ item.MetricCount }}</md-table-cell>
								<md-table-cell v-if="showIndexingColumn" @click.native="select(item)" class="selectable" md-label="Indexado">
									<md-switch class="md-primary"  v-model="item.IsIndexed"
											@change="onIndexedChanged(item)" />
								</md-table-cell>
								<md-table-cell v-if="showIndexingColumn" @click.native="select(item)" class="selectable" md-label="Segmentado">
									<md-switch class="md-primary" v-model="item.SegmentedCrawling"
														 @change="onSegmentedCrawlingChanged(item)" :disabled="!item.IsIndexed" />
								</md-table-cell><md-table-cell @click.native="select(item)" class="selectable" md-label="Estado">
										<md-icon :title="status(item).label" :style="'color: ' + status(item).color">{{ status(item).icon }}</md-icon>
									<div class="extraIconContainer">
										<md-icon v-if="item.IsPrivate" class="extraIcon" title="Visiblidad: Privado. Para cambiar la visiblidad, acceda a Editar > Visiblidad.">lock</md-icon>
										<md-icon v-if="!showIndexingColumn && !item.IsPrivate && !item.IsIndexed && status(item).tag !== 'unpublished'"
													 class="extraIcon" title="No indexada. El buscador de Poblaciones no publica los indicadores de esta cartografía en sus resultados.
Para que sean incluidos, debe solictar una revisión desde Modificar > Visiblidad > Solicitar revisión.">error_outline</md-icon>
									</div>
								</md-table-cell>
								<md-table-cell md-label="Acciones">
								<md-button v-if="!canEdit(item)" title="Consultar" class="md-icon-button" v-on:click="select(item)">
									<md-icon>remove_red_eye</md-icon>
								</md-button>
								<md-button v-if="canEdit(item) && !publishDisabled(item)" title="Publicar" class="md-icon-button" v-on:click="onPublish(item)">
									<md-icon>public</md-icon>
								</md-button>
								<md-button v-if="canEdit(item) && !revokeDisabled(item)" title="Revocar publicación" class="md-icon-button" v-on:click="onRevoke(item)">
									<md-icon>pause_circle_filled</md-icon>
								</md-button>
								<md-button v-if="canEdit(item)" title="Modificar" class="md-icon-button" v-on:click="select(item)">
									<md-icon>edit</md-icon>
								</md-button>
								<md-button v-if="canEdit(item)" @click="onDuplicate(item)"  title="Duplicar" class="md-icon-button">
									<md-icon>file_copy</md-icon>
								</md-button>
									<md-button v-if="canEdit(item)" title="Eliminar" class="md-icon-button" v-on:click="onDelete(item)">
										<md-icon>delete</md-icon>
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

		<md-dialog-prompt
				:md-active.sync="activateSaveAs"
				:md-title="'Duplicar ' + entityName.single"
				v-model="newWorkName"
				md-input-maxlength="100"
				md-input-placeholder="Nombre de la nueva copia..."
				md-confirm-text="Guardar"
				md-cancel-text="Cancelar"
				@md-confirm="onDuplicateStart">
		</md-dialog-prompt>

		<md-dialog-prompt
						:md-active.sync="activateNewWork"
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
import arr from '@/common/js/arr';

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
		filter: String,
		createEnabled:  { type: Boolean, default: true },
		offerAdminActions:  { type: Boolean, default: false },
	},
	computed: {
		showingWelcome() {
			return window.Context.CartographiesStarted && this.list && this.list.length === 0;
		},
		showIndexingColumn() {
			return this.offerAdminActions && this.user.Privileges === 'A';
		},
		user() {
			return window.Context.User;
		},
		canCreate() {
			return (this.filter !== 'P' || window.Context.CanCreatePublicData()) && !this.offerAdminActions;
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
		list() {
			var ret = [];
			if (this.offerAdminActions) {
				return this.works;
			} else {
				if (window.Context.Cartographies) {
					for(var i = 0; i < window.Context.Cartographies.length; i++) {
						if (window.Context.Cartographies[i].Type === this.filter) {
							ret.push(window.Context.Cartographies[i]);
						}
					}
				}
			}
			return ret;
		}
	},
	mounted() {
		if (this.offerAdminActions) {
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
		select(element) {
			if (this.offerAdminActions) {
				window.open(this.getWorkUri(element, true), '_blank');
			} else {
				this.$router.push({ path: this.getWorkUri(element, false) });
			}
		},
		refreshWorks() {
			var loc = this;
			this.$refs.invoker.do(window.Db,
					window.Db.GetWorks, this.filter, this.timeFilter).then(function(data) {
						arr.Clear(loc.works);
						arr.AddRange(loc.works, data);
						});
		},
		publishDisabled(item) {
			return !(item.MetadataLastOnline === null || item.HasChanges !== 0);
		},
		revokeDisabled(item) {
			return (item.MetadataLastOnline === null);
		},
		status(item) {
			var privacy = (item.IsPrivate ? ' - Visiblidad: Privada' : '');
			if (item.Unfinished) {
				return { label: 'Clonación fallida', tag: 'unfinished', icon: 'error', color: '#ff0000' };
			} else if (item.Metadata === null || item.MetadataLastOnline === null) {
				return { label: 'Sin publicar' + privacy, tag: 'unpublished', icon: 'error_outline', color: '#ff7936' };
			} else if (item.HasChanges !== 0) {
				return { label: 'Existen cambios sin publicar' + privacy, tag: 'published_changes', icon: 'border_color', color: '#969696' };
			}	else {
				return { label: 'Publicada' + privacy, tag: 'published', icon: 'check_circle_outline', color: '#44b10f' };
			}
		},
		canEdit(item){
			if (window.Context.User.Privileges === 'A') {
				return true;
			}
			if (this.filter === 'P' && window.Context.User.Privileges === 'E') {
				return true;
			}
			return item.Privileges !== 'V';
		},
		onDelete(item){
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
						item.MetadataLastOnline = Date.now();
						window.Db.ReleaseWork(item.Id);
						});
		},
		onNewWork(){
			this.newWorkName = '';
			this.activateNewWork = true;
		},
		onNewWorkStart(){
			if (this.newWorkName.trim().length === 0) {
				alert('Debe indicar un nombre.');
				var loc = this;
				this.$nextTick(() => {
					loc.activateNewWork = true;
				});
				return;
			}
			this.$refs.invoker.do(window.Db,
														window.Db.CreateWork, this.newWorkName.trim(), this.filter);
		},
		onIndexedChanged(item) {
			this.$refs.invoker.do(window.Db,
														window.Db.UpdateWorkIndexing, item);	
		},
		onSegmentedCrawlingChanged(item) {
			this.$refs.invoker.do(window.Db,
				window.Db.UpdateWorkSegmentedCrawling, item);
		},
		onRevoke(item) {
			this.$refs.stepper.startUrl = window.Db.GetStartWorkRevokeUrl(item.Id);
			this.$refs.stepper.stepUrl = window.Db.GetStepWorkRevokeUrl();
			this.$refs.stepper.setTitle('Revocando publicación');
			this.$refs.stepper.Start().then(function () {
						item.MetadataLastOnline = null;
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
.extraIcon {
	 background-color: white;
  font-size: 15px !important;
  color: #868686;
  margin-left: -5px;
  margin-top: -6px;
}
</style>
