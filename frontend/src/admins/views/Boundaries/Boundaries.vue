<template>
	<div>
		<div class="md-layout">
			<invoker ref="invoker"></invoker>

			<boundary-popup ref="editPopup" @completed="popupSaved">
			</boundary-popup>
			<div class="md-layout-item md-size-100">
				<md-table style="max-width: 1100px;" v-model="list" md-card="">
					<md-table-row slot="md-table-row" slot-scope="{ item }">
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Nombre">{{ item.Caption }}</md-table-cell>
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Grupo">{{ item.Group.Caption }}</md-table-cell>
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Contenido">{{ item.ClippingRegions }}</md-table-cell>
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Geografía">{{ geographyCaption(item) }}</md-table-cell>
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Público">{{ formatBool(!item.IsPrivate) }}</md-table-cell>
						<md-table-cell md-label="Acciones" class="mpNoWrap" v-if="isAdmin">
							<md-button class="md-icon-button" title="Modificar" @click="openEdition(item)">
								<md-icon>edit</md-icon>
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
import BoundaryPopup from './BoundaryPopup.vue';
import f from '@/backoffice/classes/Formatter';
import arr from '@/common/framework/arr';

	export default {
	name: 'Boundaries',
	data() {
		return {
			list: [],
			groups: [],
			geographies: [],
			};
	},
	computed: {
		isAdmin() {
			return window.Context.IsAdmin();
		},
	},
	mounted() {
		var loc = this;
		this.$refs.invoker.doMessage('Obteniendo delimitaciones', window.Db,
				window.Db.GetBoundaries).then(function(data) {
					arr.AddRange(loc.list, data);
			});
		var loc = this;
		window.Context.BoundaryGroups.GetAll(function (data) {
			arr.AddRange(loc.groups, data);
		});
		var loc = this;
		window.Context.Geographies.GetAll(function (data) {
			arr.AddRange(loc.geographies, data);
		});
	},
	methods: {
		formatBool(v) {
			return (v ? 'Sí' : '-');
		},
		createNewBoundary() {
			var loc = this;
			window.Context.Factory.GetCopy('Boundary', function(data) {
					loc.openEdition(data);
			});
		},
		geographyCaption(item) {
			if (item.Geography) {
				return item.Geography.Caption;
			} else {
				return '-';
			}
		},
		openEdition(item) {
			this.$refs.editPopup.show(item, this.groups, this.geographies);
		},
		popupSaved(item) {
			arr.ReplaceByIdOrAdd(this.list, item);
		},
  },
  components: {
      BoundaryPopup,
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
