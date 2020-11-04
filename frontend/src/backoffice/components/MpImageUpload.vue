<template>
	<div style="display: inline-block">
		<div v-if="label" class="mp-label" style="margin-top: 6px">{{ label }}</div>
		<div v-if="localPreviewImage && showPreview">
			<img class="imagen-preview" style="" :src="this.localPreviewImage" alt="">
			<div style="display: inline-block">
				<md-button style="background-color: #ececec;"
									 title="Quitar"
									 class="md-icon-button md-button-mini"
									 v-on:click="clear">
					<md-icon>close</md-icon>
				</md-button>
				<label class="file-select">
					<div class="edit-button">
						<md-icon>edit</md-icon>
					</div>
					<input @change="handleImage" class="file-select" type="file" accept="image/*" />
				</label>
			</div>
		</div>
		<div v-else class="md-ripple" style="display: table-cell">
			<label class="file-select">
				<div class="select-button">
					<md-icon>add_circle_outline</md-icon>
					Agregar imagen
				</div>
				<input @change="handleImage" class="file-select" type="file" accept="image/*" />
			</label>
		</div>

		<div v-if="helper" class="md-helper-text helper">{{ helper }}</div>
	</div>
</template>

<script>

export default {
	name: 'MpImageUpload.vue',
	data() {
		return {
			localPreviewImage: null
		};
	},
	mounted() {
		this.localPreviewImage = this.previewImage;
	},
	computed: {

	},
	methods: {
		handleImage(e) {
			const selectedImage = e.target.files[0];
			this.createBase64Image(selectedImage);
			e.target.value = '';
		},
		createBase64Image(fileObject) {
			const reader = new FileReader();
			var loc = this;
			reader.onload = (e) => {
				loc.localPreviewImage = e.target.result;
				loc.imageToSend = loc.localPreviewImage;
				loc.$emit('input', loc.imageToSend);
				loc.$emit('changed', loc.imageToSend, fileObject.name);
			};
			reader.readAsDataURL(fileObject);
		},
		clear() {
			this.localPreviewImage = null;
			this.imageToSend = null;
			this.$emit('input', this.imageToSend);
			this.$emit('clear');
		}
	},
 	props: {
			container: Object,
			label: String,
			helper: String,
			showPreview: { type: Boolean, default: true },
			previewImage: String,
	},
	components: {
		},
		watch: {
			'previewImage'() {
				this.localPreviewImage = this.previewImage;
			}
		}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

.md-button-mini{
  width: 30px;
  min-width: 30px;
  height: 30px;
}
.select-button {
	cursor: pointer;
  padding: 6px;
}

.select-button:hover {
	background-color: #e8e8e8;
	border-radius: 2px;
}

.edit-button {
	cursor: pointer;
	padding: 8px;
}

.imagen-preview {
	min-height: unset !important;
	width: auto;
	max-height: 100px;
	max-width: 195px;
	width: auto;
}

.file-select > input[type="file"] {
  display: none;
}

</style>
