<template>
	<md-dialog :md-active.sync="openEditableInstitution" style="min-height: 520px">
		<md-dialog-title>
			Institución
		</md-dialog-title>
		<md-dialog-content v-if="item">
			<invoker ref="invoker"></invoker>

			<div class="md-layout md-gutter">
				<div class="md-layout-item md-size-80 md-small-size-100">
					<mp-simple-text :canEdit="Work.CanEdit()"
						label="Nombre de la institución" ref="datasetInput" helper="Indique el nombre de la institución,
			evitando siglas o acrónimos. Ej. Instituto de Estadística Nacional." @enter="save"
							:maxlength="200" v-model="item.Caption" />
				</div>

				<div class="md-layout-item md-size-50 md-small-size-100">
					<mp-simple-text :canEdit="Work.CanEdit()" @enter="save"
									label="Correo electrónico" helper="Dirección de correo electrónico institucional."
									:maxlength="50"  v-model="item.Email" />
				</div>

				<div class="md-layout-item md-size-50 md-small-size-100">
					<mp-simple-text :canEdit="Work.CanEdit()" @enter="save"
									label="Teléfono" helper="Sitio web correspondiente a la fuente (Ej. https://mical.gov/datum/2010)"
									:maxlength="50"  v-model="item.Phone" />
				</div>
				<div class="md-layout-item md-size-65 md-small-size-100">
					<mp-simple-text :canEdit="Work.CanEdit()" @enter="save"
									label="Dirección postal" helper="Ubicación de la institución (Ej. Carreli 1720 (2321) Montevideo"
									:maxlength="200"  v-model="item.Address" />
				</div>
				<div class="md-layout-item md-size-35 md-small-size-100">
					<mp-simple-text :canEdit="Work.CanEdit()" @enter="save"
									label="País" helper="País correspondiente a la dirección indicada (Ej. Uruguay)"
									:maxlength="50"  v-model="item.Country" />
				</div>
				<div class="md-layout-item md-size-65 md-small-size-100">
					<mp-simple-text :canEdit="Work.CanEdit()"  @enter="save"
									label="Página web" helper="Sitio web de la institución (Ej. https://vedol.gov/)"
									:maxlength="255"  v-model="item.Web" />
				</div>
			</div>

		</md-dialog-content>
		<md-dialog-actions>
			<div v-if="Work.CanEdit()">
				<md-button @click="openEditableInstitution = false">Cancelar</md-button>
				<md-button class="md-primary" @click="save()">Aceptar</md-button>
			</div>
			<div v-else="">
				<md-button @click="openEditableInstitution = false">Cerrar</md-button>
			</div>
		</md-dialog-actions>
	</md-dialog>
</template>

<script>
	import Context from '@/backoffice/classes/Context';

	export default {
	name: 'InstitutionPopup',
	data() {
		return {
		item: null,
		closeParentCallback: null,
		openEditableInstitution: false,
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
			this.openEditableInstitution = true;
			var loc = this;
			setTimeout(() => {
				loc.$refs.datasetInput.focus();
			}, 100);
		},
		save() {
			if (this.item.Caption === null || this.item.Caption.trim() === '') {
				alert('Debe indicar un nombre.');
				return;
			}
			if (this.item.Country === null || this.item.Country.trim() === '') {
				alert('Debe indicar el país.');
				return;
			}
			var loc = this;
		  this.$refs.invoker.do(this.Work,
														this.Work.UpdateInstitution, this.item, this.container).then(
														function () {
															loc.openEditableInstitution = false;
															loc.$emit('onSelected', loc.container.Institution);
															if (loc.closeParentCallback !== null) {
																loc.closeParentCallback();
															}
														});
		}
  },
 	props: {
    container: Object
	},
	components: {

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
