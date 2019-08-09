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

		<div v-if="canCreate && !showingWelcome">
			<md-button @click="onNewWork">
				<md-icon>add_circle_outline</md-icon>
				{{ newLabel }}
			</md-button>
		</div>

		</div>
			<div class="md-layout-item md-size-100">
				<md-table style="max-width: 1000px;" v-if="list.length > 0" v-model="list" md-sort="title" md-sort-order="asc" md-card>
						<md-table-row slot="md-table-row" slot-scope="{ item }">
							<md-table-cell @click.native="select(item)" class="selectable" md-label="Título" md-sort-by="title">
								<a :href="getWorkUri(item, true)" class="normalTextLink">{{ item.Caption }}</a>
							</md-table-cell>
          			<md-table-cell @click.native="select(item)" class="selectable" md-label="Datasets">{{ item.DatasetCount }}</md-table-cell>
								<md-table-cell @click.native="select(item)" class="selectable" md-label="Georreferenciados">{{ item.GeorreferencedCount }}</md-table-cell>
								<md-table-cell @click.native="select(item)" class="selectable" md-label="Indicadores">{{ item.MetricCount }}</md-table-cell>
								<md-table-cell @click.native="select(item)" class="selectable" md-label="Estado">
									<md-icon :title="status(item).label" :style="'color: ' + status(item).color">{{ status(item).icon }}</md-icon></md-table-cell>
								<md-table-cell md-label="Acciones">
								<md-button v-if="!canEdit(item)" title="Consultar" class="md-icon-button" v-on:click="select(item)">
									<md-icon>remove_red_eye</md-icon>
								</md-button>
								<md-button v-if="canEdit(item) && !publishDisabled(item)" title="Publicar" class="md-icon-button" v-on:click="onPublish(item)">
									<md-icon>public</md-icon>
								</md-button>
								<md-button v-if="canEdit(item)" title="Modificar" class="md-icon-button" v-on:click="select(item)">
									<md-icon>edit</md-icon>
								</md-button>
								<md-button v-if="canEdit(item) && !revokeDisabled(item)" title="Revocar publicación" class="md-icon-button" v-on:click="onRevoke(item)">
									<md-icon>pause_circle_filled</md-icon>
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
			activateSaveAs: false,
		};
	},
	props: {
		filter: String,
	},
	computed: {
		showingWelcome() {
			return window.Context.CartographiesStarted && this.list && this.list.length === 0;
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
		list() {
			var ret = [];
			if (window.Context.Cartographies) {
				for(var i = 0; i < window.Context.Cartographies.length; i++) {
					if (window.Context.Cartographies[i].Type === this.filter) {
						ret.push(window.Context.Cartographies[i]);
					}
				}
			}
			return ret;
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
			this.$router.push({ path: this.getWorkUri(element, false) });
		},
		publishDisabled(item) {
			return !(item.MetadataLastOnline === null || item.HasChanges !== 0);
		},
		revokeDisabled(item) {
			return (item.MetadataLastOnline === null);
		},
		status(item) {
			if (item.Metadata === null || item.MetadataLastOnline === null) {
				return { label: 'Sin publicar', icon: 'error_outline', color: '#ff7936' };
			} else if (item.HasChanges !== 0) {
				return { label: 'Con cambios', icon: 'border_color', color: '#969696' };
			}	else {
				return { label: 'Publicado', icon: 'check_circle_outline', color: '#44b10f' };
			}
		},
		canEdit(item){
			if (window.Context.User.privileges === 'A') {
				return true;
			}
			if (this.filter === 'P' && window.Context.User.privileges === 'E') {
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
</style>
