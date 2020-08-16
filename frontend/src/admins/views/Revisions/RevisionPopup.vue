<template>
  <div>
		<md-dialog :md-active.sync="activateEdit" :md-click-outside-to-close="false">
			<md-dialog-title v-if="revision">{{ revision.Work.Metadata.Title }}</md-dialog-title>
			<md-dialog-content v-if="revision">
				<invoker ref="invoker"></invoker>
				<div class="md-layout md-gutter">
					<div class="md-layout-item md-size-100">
						<mp-simple-text label="Comentarios de revisión" ref="inputName" :canEdit="(!revision.Decision)" :multiline="true"
														v-model="revision.ReviewerComments" :maxlength="2000" :helper="(revision.Decision ? 'Los comentarios no pueden editarse una vez asignada una decisión.' : '')" />
					</div>
					<div class="md-layout-item md-size-50">
						<mp-simple-text label="Comentarios editoriales" :maxlength="2000" :multiline="true" :canEdit="(!revision.Decision)"
														v-model="revision.EditorComments" />
					</div>
					<div class="md-layout-item md-size-50">
						<mp-simple-text label="Comentarios internos" :maxlength="2000" :multiline="true" :canEdit="(!revision.Decision)"
														v-model="revision.ExtraComments" />
					</div>
					<div class="md-layout-item md-size-50">
						<mp-select label='Decisión de revisión' :allowNull='true' :modelKey="true"
											 :list='Decisions' v-model='revision.Decision' />
					</div>
					<div class="md-layout-item md-size-50" v-if="revision.UserDecision">
						<mp-simple-text label="Usuario de revisión" :canEdit="false"
														v-model="userDecision" />
					</div>
					<div class="md-layout-item md-size-50">
						<mp-simple-text label="Fecha de envío" :canEdit="false"
														v-model="submissionDate" />
					</div>
					<div class="md-layout-item md-size-50" v-if="revision.UserDecision">
						<mp-simple-text label="Fecha revisión" :canEdit="false"
														v-model="decisionDate" />
					</div>
				</div>
			</md-dialog-content>
			<md-dialog-actions>
				<md-button @click="activateEdit = false">Cancelar</md-button>
				<md-button class="md-primary" @click="save">Guardar</md-button>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>

import arr from '@/common/js/arr';
import f from '@/backoffice/classes/Formatter';

export default {
  name: "RevisionPopup",
  data() {
    return {
			activateEdit: false,
			revision: null,
			userDecision: null,
			submissionDate: null,
			decisionDate: null,
			Decisions: [
						{ Id: 'A', Caption: 'Publicable' },
						{ Id: 'C', Caption: 'Cambios solicitados' },
						{ Id: 'R', Caption: 'Rechazada' }]
    };
  },
  computed: {

  },
  methods: {
		show(revision) {
			this.revision = f.clone(revision);
			this.activateEdit = true;
			this.userDecision = f.formatFullName(revision.UserDecision);
			this.submissionDate = f.formatDate(revision.SubmissionDate);
			this.decisionDate = f.formatDate(revision.ResolutionDate);
			setTimeout(() => {
				this.$refs.inputName.focus();
			}, 100);
		},
		save() {
			var loc = this;

			this.$refs.invoker.do(window.Db, window.Db.UpdateRevision,
							this.revision, this.password, this.verification).then(function(data) {
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
