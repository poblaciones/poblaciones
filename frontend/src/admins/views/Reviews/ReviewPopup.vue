<template>
  <div>
		<md-dialog :md-active.sync="activateEdit" :md-click-outside-to-close="false">
			<md-dialog-title v-if="review">{{ review.Work.Metadata.Title }}</md-dialog-title>
			<md-dialog-content v-if="review">
				<invoker ref="invoker"></invoker>
				<div class="md-layout md-gutter">
					<div class="md-layout-item md-size-100">
						<mp-simple-text label="Comentarios de revisión" ref="inputName" :canEdit="isDataAdmin && (!review.Decision)" :multiline="true"
														v-model="review.ReviewerComments" :maxlength="2000" :helper="(review.Decision ? 'Los comentarios no pueden editarse una vez asignada una decisión.' : '')" />
					</div>
					<div class="md-layout-item md-size-50">
						<mp-simple-text label="Comentarios editoriales" :maxlength="2000" :multiline="true" :canEdit="isDataAdmin && (!review.Decision)"
														v-model="review.EditorComments" />
					</div>
					<div class="md-layout-item md-size-50">
						<mp-simple-text label="Comentarios internos" :maxlength="2000" :multiline="true" :canEdit="isDataAdmin && (!review.Decision)"
														v-model="review.ExtraComments" />
					</div>
					<div class="md-layout-item md-size-50">
						<mp-select label='Decisión de revisión' :allowNull='true' :canEdit="isDataAdmin" :modelKey="true"
											 :list='Decisions' v-model='review.Decision' />
					</div>
					<div class="md-layout-item md-size-50" v-if="review.UserDecision">
						<mp-simple-text label="Usuario de revisión" :canEdit="false"
														v-model="userDecision" />
					</div>
					<div class="md-layout-item md-size-50">
						<mp-simple-text label="Fecha de envío" :canEdit="false"
														v-model="submissionDate" />
					</div>
					<div class="md-layout-item md-size-50" v-if="review.UserDecision">
						<mp-simple-text label="Fecha revisión" :canEdit="false"
														v-model="decisionDate" />
					</div>
				</div>
			</md-dialog-content>
			<md-dialog-actions>
				<template v-if="isDataAdmin">
					<md-button @click="activateEdit = false">Cancelar</md-button>
					<md-button class="md-primary" @click="save">Guardar</md-button>
				</template>
				<md-button v-else="" @click="activateEdit = false">Cerrar</md-button>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>

import arr from '@/common/framework/arr';
import f from '@/backoffice/classes/Formatter';

export default {
  name: "ReviewPopup",
  data() {
    return {
			activateEdit: false,
			review: null,
			userDecision: null,
			submissionDate: null,
			decisionDate: null,
			Decisions: [
						{ Id: 'A', Caption: 'Publicable' },
						{ Id: 'S', Caption: 'Publicable con sugerencias' },
						{ Id: 'C', Caption: 'Cambios solicitados' },
						{ Id: 'R', Caption: 'Rechazada' }]
    };
  },
  computed: {
		isDataAdmin() {
			return window.Context.IsDataAdmin();
		},
  },
  methods: {
		show(review) {
			this.review = f.clone(review);
			this.activateEdit = true;
			this.userDecision = f.formatFullName(review.UserDecision);
			this.submissionDate = f.formatDate(review.SubmissionDate);
			this.decisionDate = f.formatDate(review.ResolutionDate);
			var loc = this;
			setTimeout(() => {
				loc.$refs.inputName.focus();
			}, 100);
		},
		save() {
			var loc = this;

			this.$refs.invoker.doSave(window.Db, window.Db.UpdateReview,
							this.review, this.password, this.verification).then(function(data) {
								loc.activateEdit = false;
								loc.$emit('completed', data);
			});
		}
  },
  components: {

  }
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

</style>
