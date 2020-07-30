<template>
    <div class="flex">
        <md-button v-show="!editableMode" v-on:click="EditField();" class="md-icon-button">
            <md-icon>edit</md-icon>
        </md-button>
        <md-button ref="btnOk" :id="this._uid + 'ok'" v-show="editableMode" v-on:click="Save" class="md-icon-button">
            <md-icon>done</md-icon>
        </md-button>
        <md-button ref="btnCancel" :id="this._uid + 'cancel'" v-show="editableMode" v-on:click="Cancel" class="md-icon-button">
            <md-icon>clear</md-icon>
        </md-button>
			<mp-confirm title="Cambios pendientes" ref="confirmDialog"
					question="¿Desea guardarlos ahora?"
				text="La edición del elemento produjo cambios que no fueron guardados."
            confirm-text="Guardarlos"
            cancel-text="Descartar los cambios"
						@cancel="Cancel"
            @confirm="Save"
			/>
    </div>
</template>

<script>
export default {
  data() {
    return {
      editableMode: true
   };
  },
  mounted() {
     this.ChangeEditableMode();
  },
  methods: {
    EditField() {
			this.ChangeEditableMode();
			var loc = this;
			setTimeout(() => {
				loc.SetFocus();
			}, 25);
		},
		showPrompt() {
			this.$refs.confirmDialog.show();
		},
		HasFocus() {
     return	(document.activeElement.id === this.$refs.btnOk.$el.id ||
            document.activeElement.id === this.$refs.btnCancel.$el.id);
		},
		SetFocus() {
			this.$emit('onFocus');
		},
		Save() {
			this.UpdateParent();
			this.ChangeEditableMode();
		},
    Cancel() {
      this.ChangeEditableMode();
			this.$emit('onCancel');
    },
    ChangeEditableMode() {
      this.editableMode = !this.editableMode;
			this.$emit('onEditModeChange', this.editableMode);
    },
    UpdateParent() {
      this.$emit('onUpdate');
    }
  }
};
</script>


<style rel="stylesheet/scss" lang="scss" scoped>

.flex{
  display: flex;
}

.md-icon-button{
  margin-top: 10px;
}

</style>
