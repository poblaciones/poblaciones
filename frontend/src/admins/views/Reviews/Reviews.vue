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
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Solicitante">
							{{ formatFullName(item) }}
							<md-tooltip md-direction="bottom">{{ (item.UserSubmission ? item.UserSubmission.Email : item.UserSubmissionEmail) }}</md-tooltip>
						</md-table-cell>
						<md-table-cell md-label="Acciones" class="mpNoWrap">
							<md-button class="md-icon-button" @click="openEdition(item)">
								<md-icon>edit</md-icon>
								<md-tooltip md-direction="bottom">{{ (isDataAdmin ? 'Modificar revisión' : 'Ver revisión') }}</md-tooltip>
							</md-button>
							<md-button class="md-icon-button" @click="select(item.Work)">
								<md-icon>visibility</md-icon>
								<md-tooltip md-direction="bottom">Ver cartografía</md-tooltip>
							</md-button>
							<md-button class="md-icon-button" v-if="isDataAdmin" @click="deleteDecision(item)">
								<md-icon>delete</md-icon>
								<md-tooltip md-direction="bottom">Eliminar</md-tooltip>
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
import arr from '@/common/framework/arr';
var	DECISIONS = { 'A': 'Publicable', 'S': 'Publicable con sugerencias', 'C': 'Cambios solicitados', 'R': 'Rechazada' };
export default {
	name: 'Reviewes',
	data() {
		return {
			list: []
			};
	},
	computed: {
		isDataAdmin() {
			return window.Context.IsDataAdmin();
		},
	},
	mounted() {
		var loc = this;
		this.$refs.invoker.doMessage('Obteniendo revisiones', window.Db,
				window.Db.GetReviews).then(function(data) {
					arr.Fill(loc.list, data);
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
			this.$refs.invoker.message = 'Eliminando...';
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
