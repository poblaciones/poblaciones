<template>
  <div>
		<invoker ref="invoker"></invoker>
    <div v-if="contact" class="md-layout md-gutter">
			<div class="md-layout-item md-size-100">
				<mp-text :canEdit="Work.CanEdit()" label="Nombre" @update="Update"
					helper="Nombre completo de la persona a contactar. Ej. Catalina Gorriti."
					v-model="contact.Person" :maxlength="200" />
      </div>
      <div class="md-layout-item md-size-50 md-small-size-100">
				<mp-text :canEdit="Work.CanEdit()" label="Correo electrónico" @update="Update"
					helper="Dirección de correo electrónico de contacto. Ej. catagorr@cecil.edu."
					v-model="contact.Email" :maxlength="50" />
      </div>
      <div class="md-layout-item md-size-50 md-small-size-100">
				<mp-text :canEdit="Work.CanEdit()" label="Teléfono" @update="Update"
					helper="Teléfono de contacto, incluyendo códigos de área. Ej. +54 11 524-1124."
					v-model="contact.Phone" :maxlength="50" />
			</div>
    </div>
  </div>
</template>

<script>
import Context from '@/backoffice/classes/Context';


export default {
 name: 'Contacto',
  data() {
    return {
    };
  },
  computed: {
		Work() {
			return window.Context.CurrentWork;
		},
		contact() {
			return this.Work.properties.Metadata.Contact;
		}
  },
  methods: {
    Update() {
			this.$refs.invoker.do(this.Work,
								this.Work.UpdateMetadata);
			return true;
     }
  },
  components: {
  }
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
    .md-layout-item .md-size-25 {
        padding: 0 !important;
    }
</style>
