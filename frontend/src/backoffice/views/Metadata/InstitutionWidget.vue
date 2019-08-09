<template>
	<div style="padding-top: 20px;">
		<div class="mpLabel">
			Institución
		</div>
		<invoker ref="invoker"></invoker>

		<institution-popup ref="InstitutionPopup" @onSelected="selected" :container="container"></institution-popup>

		<div style="padding-top: 14px; padding-bottom: 4px; font-size: 18px; min-width: 260px; line-height: 1.3em">
			<div v-if="Work.CanEdit()" :style="(getInstitutionCaption === '' ? '' : 'float: right; margin-top: -16px;')">
				<md-button class="md-raised" @click="onOpenSelect()">
					<md-icon>edit</md-icon>
					Seleccionar
				</md-button>

				<md-button v-if="item !== null && item.IsEditableByCurrentUser" class="md-icon-button" title="Editar institución" @click="openEditionWarning(item)" style="margin-top: 5px;">
					<md-icon>edit</md-icon>
				</md-button>

			</div>
			{{ getInstitutionCaption }}
		</div>
		<pick-institution @onSelected="selected" :container="container" ref="PickInstitution"></pick-institution>
	</div>
</template>

<script>
import Context from '@/backoffice/classes/Context';
import PickInstitution from './PickInstitution';
import InstitutionPopup from './InstitutionPopup';

export default {
  name: 'InstitutionWidget',
  data() {
    return {

};
  },
  computed: {
   Work() {
      return window.Context.CurrentWork;
    },
		item() {
			return this.container.Institution;
		},
		CanEditStaticLists() {
			return window.Context.CanEditStaticLists();
		},
		getInstitutionCaption() {
			if (this.item === null) {
				return '';
			} else {
				return this.item.Caption;
			}
		},
	},
  methods: {
		selected(item) {
			this.container.Institution = item;
			this.$emit('onSelected', item);
		},
    openEditionWarning(item) {
			var loc = this;
			if (item.IsGlobal) {
				this.$refs.invoker.confirm('Editar institución', 'Al editar una institución, el cambio afectará todas las cartografías o datos públicos que mencionen esta institución',
						function () {
							loc.openEdition(item);
						});
			} else {
				loc.openEdition(item);
			}
		},
		openEdition(item) {
      this.$refs.InstitutionPopup.show(item);
		},
		onOpenSelect() {
			this.$refs.PickInstitution.show();
		}
	},
	props: {
    container: Object
	},
  components: {
    PickInstitution,
		InstitutionPopup
  }
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
/*.form-wrapper {
  margin: 20px;
}

.md-card .md-title {
  margin-top: 0;
  font-size: 18px;
  letter-spacing: 0;
  line-height: 18px;
}

.md-card-header {
  padding: 10px;
}*/

.md-field {
    margin: 12px 0 30px !important;
}
</style>
