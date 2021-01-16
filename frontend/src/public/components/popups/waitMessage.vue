<template>
	<Modal :title="text" id="waitMessage" ref="dialog" :backgroundColor="backgroundColor"
				 :hasBody="false" :showCancel="false" :showOk="false" :showClose="false" :clickOutsideToClose="false">
		<div class="popupSubTitle">
				{{ text }}
		</div>
	</Modal>
</template>

<script>
import Modal from '@/public/components/popups/modal';

export default {
	name: 'waitMessage',
	components: {
		Modal
	},
	props: [
		'backgroundColor'
	],
	data() {
		return {
			text: ''
		};
	},
	methods: {
		show(text) {
			if (text) {
				this.text = text;
			}
			this.$refs.dialog.show();
		},
		close(text) {
			this.$refs.dialog.close();
		},
	},
};
</script>

