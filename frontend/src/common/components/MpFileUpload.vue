<template>
	<div style="display: inline-block; margin: 6px 8px 6px 0px">
		<div class="md-ripple" style="display: table-cell">
			<label class="file-select">
				<div class="select-button">
					<md-icon>upload</md-icon>
					{{ label }}
				</div>
				<input @change="handleImage" class="file-select" type="file" :accept="accept" />
			</label>
		</div>
		<div v-if="helper" class="md-helper-text helper">{{ helper }}</div>
	</div>
</template>

<script>

export default {
	name: 'MpFileUpload',
	data() {
		return {

		};
	},
	mounted() {
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
				loc.dataToSend = e.target.result;
				loc.$emit('input', loc.dataToSend);
				loc.$emit('changed', loc.dataToSend, fileObject.name);
			};
			reader.readAsDataURL(fileObject);
		},
		clear() {
			this.dataToSend = null;
			this.$emit('input', this.dataToSend);
			this.$emit('clear');
		}
	},
 	props: {
			label: { type: String, default: 'Importar' },
			container: Object,
			helper: String,
			accept: { type: String, default: 'text/csv' },
	},
	components: {
		},
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

.file-select > input[type="file"] {
  display: none;
}

</style>
