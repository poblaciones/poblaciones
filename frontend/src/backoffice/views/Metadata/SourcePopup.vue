<template>
	<md-dialog :md-active.sync="openEditableSource" style="height: 520px">
		<md-dialog-title>
			Fuente
		</md-dialog-title>
		<md-dialog-content v-if="item">
			<invoker ref="invoker"></invoker>
			<md-tabs md-sync-route="">
				<md-tab md-label="General">
					<div class="md-layout md-gutter">
						<div class="md-layout-item md-size-70 md-small-size-100">
							<mp-simple-text :canEdit="Work.CanEdit()" @enter="save"
								label="Nombre de la fuente" ref="datasetInput" helper="Indique el nombre completo de la fuente,
					evitando siglas o acrónimos. No incluya el año de producción de la información.
					Ej. Censo Nacional Económico."
									:maxlength="200" v-model="item.Caption" />
						</div>
						<div class="md-layout-item md-size-30 md-small-size-100">
							<mp-simple-text :canEdit="Work.CanEdit()" @enter="save"
							label="Edición" helper="Año de producción de la fuente o versión"
								:maxlength="15" v-model="item.Version" />
						</div>
						<div class="md-layout-item md-size-55 md-small-size-100">
							<mp-simple-text :canEdit="Work.CanEdit()" @enter="save"
											label="Autores" helper="Autores personales si correspondiera (Ej. Juana Méndez)"
											:maxlength="200" v-model="item.Authors" />
						</div>

						<div class="md-layout-item md-size-50 md-small-size-100">
							<mp-simple-text :canEdit="Work.CanEdit()" @enter="save"
											label="Página web" helper="Sitio web correspondiente a la fuente (Ej. https://mical.gov/datum/2010)"
											:maxlength="255" v-model="item.Web" />
						</div>
						<div class="md-layout-item md-size-10 md-small-size-0">
						</div>
						<div class="md-layout-item md-size-40 md-small-size-100">
							<mp-simple-text :canEdit="Work.CanEdit()" @enter="save"
											label="Entrada en Wikipedia" helper="Ej. https://es.wikipedia.org/wiki/Cen2010"
											:maxlength="200" v-model="item.Wiki" />
						</div>
					</div>
				</md-tab>
				<md-tab md-label="Institución">
					<div class="md-layout md-gutter">
						<div class="md-layout-item md-size-90 md-small-size-100">
							<institution-widget :container="item"></institution-widget>
						</div>
					</div>
				</md-tab>
				<md-tab md-label="Contacto">
					<div v-if="item.Contact" class="md-layout md-gutter">
							<div class="md-layout-item md-size-80">
								<mp-simple-text label="Nombre" :canEdit="Work.CanEdit()" @enter="save"
									helper="Nombre completo de la persona a contactar por consultas. Ej. Catalina Gorriti."
									v-model="item.Contact.Person" :maxlength="200" />
							</div>
							<div class="md-layout-item md-size-50 md-small-size-100">
								<mp-simple-text label="Correo electrónico" :canEdit="Work.CanEdit()" @enter="save"
									helper="Dirección de correo electrónico de contacto. Ej. catagorr@cecil.edu."
									v-model="item.Contact.Email" :maxlength="50" />
							</div>
							<div class="md-layout-item md-size-50 md-small-size-100">
								<mp-simple-text label="Teléfono" :canEdit="Work.CanEdit()" @enter="save"
									helper="Teléfono de contacto, incluyendo códigos de área. Ej. +54 11 524-1124."
									v-model="item.Contact.Phone" :maxlength="50" />
							</div>
					</div>
				</md-tab>
			</md-tabs>
		</md-dialog-content>
		<md-dialog-actions>
			<div v-if="Work.CanEdit()">
				<md-button @click="openEditableSource = false">Cancelar</md-button>
				<md-button class="md-primary" @click="save()">Aceptar</md-button>
			</div>
			<div v-else="">
				<md-button @click="openEditableSource = false">Cerrar</md-button>
			</div>
		</md-dialog-actions>
	</md-dialog>
</template>

<script>
import Context from '@/backoffice/classes/Context';
import InstitutionWidget from '@/backoffice/views/Metadata/InstitutionWidget';

export default {
  name: 'SourcePopup',
  data() {
    return {
  		item: null,
			closeParentCallback: null,
			openEditableSource: false,
    };
  },
  computed: {
   Work() {
      return window.Context.CurrentWork;
    },
		institutionSelected()
		{
			if (this.item && this.item.Institution) {
				return this.item.Institution.Id;
			} else {
				return -1;
			}
		}
	},
  methods: {
		show(item, closeParentCallback) {
			this.item = item;
			if (closeParentCallback) {
				this.closeParentCallback = closeParentCallback;
			} else {
				this.closeParentCallback = null;
			}
			this.openEditableSource = true;
			var loc = this;
			setTimeout(() => {
				loc.$refs.datasetInput.focus();
			}, 100);
		},
		save() {
			if (this.item.Caption === null || this.item.Caption.trim() === '') {
				alert("Debe indicar un valor para 'Nombre' de la fuente.");
				return;
			}
			if (this.item.Version === null || this.item.Version.trim() === '') {
				alert("Debe indicar un valor para 'Edición' de la fuente.");
				return;
			}
			var loc = this;
		  this.$refs.invoker.do(this.Work,
														this.Work.UpdateSource, this.item).then(
														function () {
															loc.openEditableSource = false;
															if (loc.closeParentCallback !== null) {
																loc.closeParentCallback();
															}
														});
		}
  },
  components: {
    InstitutionWidget
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
