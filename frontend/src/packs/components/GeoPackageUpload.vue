<template>
	<div>
		<vue-dropzone
			:id="dropzoneId"
			ref="dropzone"
			:options="dropzoneOptions"
			@vdropzone-sending="beforeSending"
			@vdropzone-success="afterSuccess"
			@vdropzone-complete="afterComplete"
			@vdropzone-max-files-exceeded="maxFilesExceeded">
		</vue-dropzone>
		<md-button v-if="hasFile" class="md-icon-button" @click="clear">
			<md-icon>close</md-icon>
			<md-tooltip md-direction="bottom">Quitar</md-tooltip>
		</md-button>
		<div class="helper" v-if="verifying">Analizando el archivo...</div>
		<div class="helper mpError" v-if="error">{{ error }}</div>
		<div v-if="columns.length > 0 && fields.length > 0" class="md-layout md-gutter">
			<div class="md-layout-item md-size-50" v-for="field in fields" :key="field.key">
				<mp-select :list="columnOptions" :model-key="true" :label="field.label"
									 :allow-null="!field.required" v-model="mapping[field.key]" />
			</div>
		</div>
	</div>
</template>

<script>

import vueDropzone from 'vue2-dropzone';
import 'vue2-dropzone/dist/vue2Dropzone.min.css';

// Sube un GeoPackage (.gpkg) por partes, siguiendo el mismo mecanismo que
// ya usa la importación de datasets (ver ImportPopup.vue en backoffice):
// vue2-dropzone con chunking hacia GetCreateFileUrl(bucketId). Al terminar
// la subida, pide al servidor que analice el archivo (verifyMethod, por
// defecto VerifyGeoPackage): si tiene más de una capa, responde con un
// error y no se ofrece mapeo; si tiene una sola, devuelve sus columnas
// para que el padre las mapee a los campos de negocio que declare en
// 'fields'. Con fields vacío (caso Gradient, donde el archivo no trae
// columnas de negocio sino tiles) no hay mapeo: alcanza con que el
// archivo esté subido y verificado; cualquier otro dato que el servidor
// devuelva junto con la verificación (p. ej. el zoom máximo calculado)
// queda disponible en getPayload().verification.
export default {
	name: 'GeoPackageUpload',
	components: {
		vueDropzone,
	},
	props: {
		// Campos de negocio a completar con una columna del archivo:
		// [{ key, label, required }]. Vacío si el archivo no requiere mapeo.
		fields: { type: Array, default: () => [] },
		// (bucketId) => promise<{ Error }|{ Columns, ... }>. Por defecto,
		// VerifyGeoPackage (capas vectoriales); Gradient pasa una variante
		// propia para archivos de tiles.
		verifyMethod: {
			type: Function,
			default: function (bucketId) { return window.Db.VerifyGeoPackage(bucketId); },
		},
	},
	data() {
		return {
			bucketId: 0,
			hasFile: false,
			sending: false,
			verifying: false,
			error: '',
			columns: [],
			mapping: {},
			verification: null,
			dropzoneOptions: {
				url: this.getCreateFileUrl,
				thumbnailWidth: 150,
				withCredentials: true,
				maxFiles: 1,
				acceptedFiles: '.gpkg',
				dictDefaultMessage: 'Arrastre el archivo GeoPackage (.gpkg) aquí o haga click para examinar.',
				forceChunking: true,
				chunking: true,
				chunkSize: 500000,
				chunksUploaded: function (file, done) { done(); },
			},
		};
	},
	computed: {
		dropzoneId() {
			return 'geopackage-dropzone-' + this._uid;
		},
		columnOptions() {
			var ret = [];
			for (var n = 0; n < this.columns.length; n++) {
				ret.push({ Id: this.columns[n], Caption: this.columns[n] });
			}
			return ret;
		},
	},
	created() {
		this.generateBucketId();
	},
	methods: {
		generateBucketId() {
			this.bucketId = new Date().getTime() * 10000;
		},
		getCreateFileUrl() {
			return window.Context.GetCreateFileUrl(this.bucketId);
		},
		beforeSending() {
			this.sending = true;
			this.error = '';
		},
		afterSuccess() {
			this.sending = false;
			this.hasFile = true;
			this.verifyFile();
		},
		afterComplete() {
			this.sending = false;
		},
		maxFilesExceeded(file) {
			this.$refs.dropzone.removeAllFiles();
			this.$refs.dropzone.addFile(file);
		},
		verifyFile() {
			var loc = this;
			this.verifying = true;
			this.error = '';
			this.columns = [];
			this.verification = null;
			this.verifyMethod(this.bucketId).then(function (data) {
				if (data.Error) {
					loc.error = data.Error;
				} else {
					loc.columns = data.Columns || [];
					loc.verification = data;
					loc.initMapping();
				}
				loc.verifying = false;
			});
		},
		initMapping() {
			var mapping = {};
			for (var n = 0; n < this.fields.length; n++) {
				mapping[this.fields[n].key] = null;
			}
			this.mapping = mapping;
		},
		clear() {
			this.$refs.dropzone.removeAllFiles();
			this.hasFile = false;
			this.verifying = false;
			this.error = '';
			this.columns = [];
			this.mapping = {};
			this.verification = null;
			this.generateBucketId();
			this.$emit('cleared');
		},
		// El padre consulta esto recién al confirmar el alta (no hay eventos
		// reactivos de 'listo'): evita disparar el proceso de importación con
		// datos incompletos.
		isReady() {
			if (!this.hasFile || this.error || this.verifying || this.sending) {
				return false;
			}
			for (var n = 0; n < this.fields.length; n++) {
				if (this.fields[n].required && !this.mapping[this.fields[n].key]) {
					return false;
				}
			}
			return true;
		},
		getPayload() {
			return { bucketId: this.bucketId, mapping: this.mapping, verification: this.verification };
		},
	},
	watch: {
		fields() {
			if (this.columns.length > 0) {
				this.initMapping();
			}
		},
	},
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

.mpError {
	color: #dc113a !important;
}

</style>
