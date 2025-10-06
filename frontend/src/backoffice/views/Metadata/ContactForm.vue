<template>
  <div>
		<invoker ref="invoker"></invoker>
    <div v-if="contact" class="md-layout md-gutter">
			<div class="md-layout-item md-size-100">
				<mp-text :canEdit="canEdit" label="Nombre" @update="Update"
					helper="Nombre completo de la persona a contactar. Ej. Catalina Gorriti."
					v-model="contact.Person" :maxlength="200" />
      </div>
      <div class="md-layout-item md-size-50 md-small-size-100">
				<mp-text :canEdit="canEdit" label="Correo electrónico" @update="Update"
					helper="Dirección de correo electrónico de contacto. Ej. catagorr@cecil.edu."
					v-model="contact.Email" :maxlength="50" />
      </div>
      <div class="md-layout-item md-size-50 md-small-size-100">
				<mp-text :canEdit="canEdit" label="Teléfono" @update="Update"
					helper="Teléfono de contacto a publicar (opcional). Ej. +54 11 524-1124."
					v-model="contact.Phone" :maxlength="50" />
			</div>
    </div>
  </div>
</template>

<script>
import Context from '@/backoffice/classes/Context';


export default {
    name: 'Contacto',
		props: [
			'canEdit',
			'useComplexAbstract',
			'Metadata'
		],
  data() {
    return {
    };
  },
  computed: {
		contact() {
			return this.Metadata.properties.Contact;
		}
  },
  methods: {
    Update() {
			this.$refs.invoker.doSave(this.Metadata,
								this.Metadata.UpdateMetadata);
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
