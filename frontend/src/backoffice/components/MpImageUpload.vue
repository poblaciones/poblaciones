<template>
	<div>
		<div v-if="label" class="mp-label" style="margin-top: 6px">{{ label }}</div>
		<div v-if="localPreviewImage && showPreview" style="position: relative; overflow: hidden; background-color: #f9f7f7 ">
			<img class="imagen-preview"
					 @click="openFile"
					 :style="sizes + circleStyle + 'margin-right: 40px;'" :src="this.localPreviewImage" alt="">
			<div style="position: absolute; right: -7px; top: 0px;">
				<md-button class="md-icon-button md-button-mini" v-if="canEdit"
									 @click="clear">
					<md-icon>close</md-icon>
					<md-tooltip md-direction="bottom">Quitar</md-tooltip>
				</md-button>
				<br />
				<label class="file-select" v-if="canEdit">
					<md-button class="md-icon-button md-button-mini" v-if="canEdit"
										 @click="openFile" style="margin-top: 6px">
						<md-icon>edit</md-icon>
						<md-tooltip md-direction="bottom">Modificar</md-tooltip>
					</md-button>
					<input @change="handleImage" ref="file" class="file-select" type="file" accept="image/*" />
				</label>
			</div>
		</div>
		<div v-else class="md-ripple" style="display: table-cell">
			<label class="file-select"  v-if="canEdit">
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
import { integer } from "vuelidate/lib/validators";


export default {
	name: 'MpImageUpload.vue',
	data() {
		return {
			localPreviewImage: null
		};
	},
	props: {
		container: Object,
		maxWidth: { type: Number, default: 100 },
		maxHeight: { type: Number, default: 195 },
		minWidth: { type: Number, default: -1 },
		minHeight: { type: Number, default: -1 },
		canEdit: { type: Boolean, default: true },
		circlePreview: { type: Boolean, default: false },
		label: String,
		helper: String,
		showPreview: { type: Boolean, default: true },
		previewImage: String,
	},
	components: {
	},
	mounted() {
		this.localPreviewImage = this.previewImage;
	},
	computed: {
		sizes() {
			var ret = '';
			if (this.minWidth !== -1) {
				ret += "min-width: " + this.minWidth + "px;";
			}
			if (this.minHeight !== -1) {
				ret += "min-height: " + this.minHeight + "px;";
			}
			if (this.maxWidth !== -1) {
				ret += "max-width: " + this.maxWidth + "px;";
			}
			if (this.maxHeight !== -1) {
				ret += "max-height: " + this.maxHeight + "px;";
			}
			return ret;
		},
		circleStyle() {
			if (this.circlePreview) {
				return 'border-radius: 50vh;';
			} else {
				return '';
			}
		}
	},
	methods: {
		handleImage(e) {
			const selectedImage = e.target.files[0];
			this.createBase64Image(selectedImage);
			e.target.value = '';
		},
		openFile() {
			if (this.canEdit) {
				this.$refs.file.click();
			}
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
		watch: {
			'previewImage'() {
				this.localPreviewImage = this.previewImage;
			}
		}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

	.select-button {
		cursor: pointer;
		padding: 6px;
		user-select: none;
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
	min-height: unset;
	width: auto;
}

.file-select > input[type="file"] {
  display: none;
}

</style>
