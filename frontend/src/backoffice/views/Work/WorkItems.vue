<template>
	<div class="md-layout-item md-size-100" v-if="list.length > 0">
		<md-button @click="toggle" v-if="label" style="margin: 10px 0px 10px 0px">
			<md-icon>{{ (expanded ? 'expand_less' : 'expand_more' ) }}</md-icon>
			<md-icon>{{ icon }}</md-icon>
			{{ label }} ({{ list.length }})
		</md-button>
		<transition name="fade">
			<div style="position: relative">
				<mp-search @search="searchOnTable" v-model="search" v-show="(expanded || actions == 'I')" />
				<md-table style="max-width: 1000px;" v-show="(expanded || actions == 'I')" v-model="listFiltered"
									:md-sort.sync="currentSort" :md-sort-order.sync="currentSortOrder" :md-sort-fn="customSort"
									md-card>
					<md-table-row slot="md-table-row" slot-scope="{ item }">
						<md-table-cell style="width: 400px" @click.native="selected('VIEW', item)" class="selectable" md-label="Título" md-sort-by="Caption">
							<a :href="getWorkUri(item)" class="normalTextLink">{{ item.Caption }}</a>
						</md-table-cell>
						<md-table-cell @click.native="selected('VIEW', item)" class="selectable"
													 md-label="Modificado" md-sort-by="History">
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
						<md-table-cell @click.native="selected('VIEW', item)" class="selectable"
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
							<md-button v-if="!canEdit(item)" class="md-icon-button" @click="selected('VIEW', item)">
								<md-icon>remove_red_eye</md-icon>
								<md-tooltip md-direction="bottom">Consultar</md-tooltip>
							</md-button>
							<md-button v-if="canEdit(item) && !publishDisabled(item)" class="md-icon-button" @click="selected('PUBLISH', item)">
								<md-icon>public</md-icon>
								<md-tooltip md-direction="bottom">Publicar</md-tooltip>
							</md-button>
							<md-button v-if="canEdit(item) && !revokeDisabled(item)" class="md-icon-button" @click="selected('REVOKE', item)">
								<md-icon>pause_circle_filled</md-icon>
								<md-tooltip md-direction="bottom">Revocar publicación</md-tooltip>
							</md-button>
							<md-button v-if="canEdit(item)" class="md-icon-button" @click="selected('VIEW', item)">
								<md-icon>edit</md-icon>
								<md-tooltip md-direction="bottom">Modificar</md-tooltip>
							</md-button>
							<md-button v-if="canEdit(item)" @click="selected('DUPLICATE', item)" class="md-icon-button">
								<md-icon>file_copy</md-icon>
								<md-tooltip md-direction="bottom">Duplicar</md-tooltip>
							</md-button>
							<md-button v-if="canCreatePublic && item.Type !== 'P'" class="md-icon-button" @click="selected('PROMOTE', item)">
								<md-icon>playlist_add</md-icon>
								<md-tooltip md-direction="bottom">Promover a Dato público</md-tooltip>
							</md-button>
							<md-button v-if="isAdmin && item.Type !== 'P'" class="md-icon-button" @click="selected('PROMOTEEXAMPLE', item)">
								<md-icon>lightbulb</md-icon>
								<md-tooltip md-direction="bottom">Convertir a ejemplo</md-tooltip>
							</md-button>
							<md-button v-if="canCreatePublic && item.Type === 'P'" class="md-icon-button" @click="selected('DEMOTE', item)">
								<md-icon>playlist_remove</md-icon>
								<md-tooltip md-direction="bottom">Convertir en Cartografía</md-tooltip>
							</md-button>
							<md-button class="md-icon-button" v-if="actions == 'I'" @click="selected('ARCHIVE', item)">
								<md-icon>archive</md-icon>
								<md-tooltip md-direction="bottom">Archivar</md-tooltip>
							</md-button>
							<md-button class="md-icon-button" v-if="actions == 'A'" @click="selected('UNARCHIVE', item)">
								<md-icon>unarchive</md-icon>
								<md-tooltip md-direction="bottom">Desarchivar</md-tooltip>
							</md-button>
							<md-button v-if="canEdit(item)" class="md-icon-button" @click="selected('DELETE', item)">
								<md-icon>delete</md-icon>
								<md-tooltip md-direction="bottom">Eliminar</md-tooltip>
							</md-button>
						</md-table-cell>
					</md-table-row>
				</md-table>
				</div>
</transition>
	</div>
</template>
<script>

	import ActiveWork from '@/backoffice/classes/ActiveWork';
	import str from '@/common/framework/str';
	import speech from '@/common/js/speech';
	import arr from '@/common/framework/arr';

	export default {
		name: 'WorkItems',
		components: {

		},
		data() {
			return {
				currentSort: 'History',
				currentSortOrder: 'desc',
				search: '',
				listFiltered: [],
				expanded: true,
			};
		},
		mounted() {
			this.currentSort = window.Db.GetUserSetting(this.settingsKey, 'History');
			this.currentSortOrder = window.Db.GetUserSetting(this.settingsKey + 'Order', 'desc');
			this.expanded = window.Db.GetUserSetting(this.settingsKey + 'Expanded', '0') == '1';
			this.search = '';
			this.listFiltered = this.customSort(arr.SearchByCaption(this.list, this.search));
		},
		props: {
			list: Array,
			label: String,
			icon: String,
			filter: String,
			actions: { type: String, default: null }
			// Los tipos de acción son los correspondientes a los estados:
			// - I: inbox (activo)
			// - A: archivado
			// - D: borrado
			// - S: ejemplo
		},
		computed: {
			canAdmin() {
				if (window.Context.User.Privileges === 'A') {
					return true;
				}
				return this.item.privileges === 'A';
			},
			isAdmin() {
				return window.Context.IsAdmin();
			},
			settingsKey() {
				return 'worksSort-' + this.filter + '-' + this.actions;
			},

		},
		methods: {
			selected(action, item) {
				this.$emit('action', action, item);
			},
			searchOnTable() {
				this.listFiltered = this.customSort(arr.SearchByCaption(this.list, this.search));
			},
			logInfo(item) {
				return speech.FormatWorkInfo(item);
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
			canCreatePublic() {
				return window.Context.CanCreatePublicData();
			},
			canEdit(item) {
				if (window.Context.User.Privileges === 'A') {
					return true;
				}
				if (this.filter === 'P' && window.Context.User.Privileges === 'E') {
					return true;
				}
				if (item.IsIndexed) {
					return false;
				}
				return item.Privileges !== 'V';
			},
			toggle() {
				this.expanded = !this.expanded;
			},
			doSort(value, sortBy, direction) {
				var loc = this;
				return value.sort((a, b) => {
					var sign = (direction === 'desc' ? -1 : 1);
					if (sortBy === 'History') {
						return sign * loc.ocompare(speech.GetValidaDate(a), speech.GetValidaDate(b));

					} else {
						return sign * str.humanCompare(a[sortBy], b[sortBy]);
					}
				});
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

			customSort(value) {
				return this.doSort(value, this.currentSort, this.currentSortOrder);
			},

			getWorkUri(element) {
				return '/users/#/cartographies/' + element.Id + '/metadata/content';
			},
		},
		watch: {
			'currentSort'() {
				window.Db.SetUserSetting(this.settingsKey, this.currentSort);
			},
			'list'() {
				this.listFiltered = this.list;
				this.search = '';
			},
			'currentSortOrder'() {
				window.Db.SetUserSetting(this.settingsKey + 'Order', this.currentSortOrder);
			},
			'expanded'() {
				window.Db.SetUserSetting(this.settingsKey + 'Expanded', (this.expanded ? '1': '0'));
			},
		}

	};
</script>
<style rel="stylesheet/scss" lang="scss" scoped>

</style>
