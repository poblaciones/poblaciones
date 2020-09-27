<template>
	<div>
		<div class="md-layout">
			<invoker ref="invoker"></invoker>

			<review-popup ref="editPopup" @completed="popupSaved">
			</review-popup>
			<div class="md-layout-item md-size-100">
				<md-table style="max-width: 1100px;" v-model="list" md-card="">
					<md-table-row slot="md-table-row" slot-scope="{ item }">
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Título">{{ item.Work.Metadata.Title }}</md-table-cell>
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Fecha de envío">{{ formatDate(item.SubmissionDate) }}</md-table-cell>
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Fecha de respuesta">{{ formatDate(item.ResolutionDate) }}</md-table-cell>
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Respuesta">{{ formatDecision(item.Decision) }}</md-table-cell>
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Solicitante" :title="(item.UserSubmission ? item.UserSubmission.Email : item.UserSubmissionEmail)">{{ formatFullName(item) }}</md-table-cell>
						<md-table-cell md-label="Acciones" class="mpNoWrap">
							<md-button class="md-icon-button" title="Modificar revisión" @click="openEdition(item)">
								<md-icon>edit</md-icon>
							</md-button>
							<md-button class="md-icon-button" title="Ver cartografía" @click="select(item.Work)">
								<md-icon>visibility</md-icon>
							</md-button>
							<md-button class="md-icon-button" title="Eliminar" @click="deleteDecision(item)">
								<md-icon>delete</md-icon>
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
import ReviewPopup from './ReviewPopup.vue';
import f from '@/backoffice/classes/Formatter';
import arr from '@/common/js/arr';

var	DECISIONS = { 'A': 'Publicable', 'S': 'Publicable con sugerencias', 'C': 'Cambios solicitados', 'R': 'Rechazada' };

export default {
	name: 'Reviewes',
	data() {
		return {
			list: []
			};
	},
	computed: {

	},
	mounted() {
		var loc = this;
		this.$refs.invoker.do(window.Db,
				window.Db.GetReviews).then(function(data) {
					arr.Clear(loc.list);
					arr.AddRange(loc.list, data);
					loc.updatePending();
					});
	},
	methods: {
		formatDate(date) {
			return f.formatDate(date);
		},
		formatFullName(item)
		{
			if (!item.UserSubmission) {
				return item.UserSubmissionEmail;
			} else {
				return f.formatFullName(item.UserSubmission);
			}
		},
		formatDecision(decision) {
			if (!decision) {
				return '-';
			} else {
				return DECISIONS[decision];
			}
		},
		getWorkUri(element, absoluteUrl) {
			var pre = '';
			if (absoluteUrl) {
				pre ='/users/#';
			}
			return pre + '/cartographies/' + element.Id + '/content';
		},
		select(element) {
			window.open(this.getWorkUri(element, true), '_blank');
		},
		updatePending() {
			var pending = 0;
			for(var n = 0; n < this.list.length; n++) {
				if (!this.list[n].Decision) {
					pending++;
				}
			}
			this.$emit('pendingUpdated', pending);
		},
		deleteDecision(item) {
			var loc = this;
			this.$refs.invoker.confirmDo('Eliminar revisión', 'La revisión seleccionada será eliminada',
					window.Db, window.Db.DeleteReview, item, function() {
						arr.Remove(loc.list, item);
						loc.updatePending();
					});
		},
		openEdition(item) {
			this.$refs.editPopup.show(item);
		},
		popupSaved(item) {
			arr.ReplaceByIdOrAdd(this.list, item);
			this.updatePending();
		},
  },
  components: {
      ReviewPopup,
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
