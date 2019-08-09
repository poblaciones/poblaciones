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
			this.SetFocus();
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

.md-layout-item .md-size-15 {
  padding: 0 !important;
}

.md-layout-item .md-size-25 {
  padding: 0 !important;
}

.md-layout-item .md-size-10 {
  padding: 0 !important;
}

.md-avatar {
  min-width: 200px;
  min-height: 200px;
  border-radius: 200px;
}

.editable-avatar {
  position: relative;
  display: inline-block;
}

.editable-avatar .editable-avatar-button {
  position: absolute;
  top: 60%;
  left: 25%;
}

.editable-avatar .md-avatar img {
  opacity: 1;
  transition: 0.7s;
}

.editable-avatar .editable-avatar-button .md-button {
  display: inline-block;
  visibility: hidden;
  opacity: 0;
  transition: opacity 0.2s linear, visibility 0s linear 0.2s;
}

.editable-avatar:hover .editable-avatar-button .md-button {
  visibility: visible;
  opacity: 1;
  transition: opacity 0.1s linear, visibility 0s linear;
}

.editable-avatar:hover .md-avatar img {
  opacity: 0.5;
  transition: 0.2s;
}
</style>
