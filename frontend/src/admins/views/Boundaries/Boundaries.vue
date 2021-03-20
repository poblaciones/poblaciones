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
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Público">{{ formatBool(!item.IsPrivate) }}</md-table-cell>
						<md-table-cell md-label="Acciones" class="mpNoWrap">
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
import arr from '@/common/js/arr';

	export default {
	name: 'Boundaries',
	data() {
		return {
			list: [],
			groups: [],
			};
	},
	computed: {

	},
	mounted() {
		var loc = this;
		this.$refs.invoker.do(window.Db,
				window.Db.GetBoundaries).then(function(data) {
					arr.AddRange(loc.list, data);
			});
		this.$refs.invoker.do(window.Db,
			window.Db.GetBoundaryGroups).then(function (data) {
				arr.AddRange(loc.groups, data);
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
		openEdition(item) {
			this.$refs.editPopup.show(item, this.groups);
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
