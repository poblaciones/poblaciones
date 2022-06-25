<template>
	<span class="mpLabelItem" @click="clicked" :style="(clickeable ? 'cursor: pointer': '')"
				v-html="process(text)"
				:class="(!hasSpaces(text) ? 'wrapAllPlaces' : '')">
	</span>
</template>

<script>


export default {
	name: 'mpLabel',
	props: {
		text: { type: String, default: ''	},
		clickeable: { type: Boolean, default: false }
	},
	components: {
	},
	data() {
		return {
		};
	},
	methods: {
		process(val) {
			var linkifyStr = require('linkifyjs/string');
			return linkifyStr(val, {
				defaultProtocol: 'https'
			});
		},
		clicked(e) {
			if (this.clickeable) {
				this.$emit('click', e);
			}
		},
		hasSpaces(val) {
			if (val) {
				return val.indexOf(' ') !== -1;
			} else {
				return false;
			}
		},
	},
};
</script>

<style scoped>
	.mpLabelItem {
		word-wrap: break-word;
	}
	.wrapAllPlaces {
		word-break: break-all;
	}
</style>

