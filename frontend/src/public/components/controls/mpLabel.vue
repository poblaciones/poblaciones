<template>
	<span class="mpLabelItem" v-html="process(text)">
	</span>
</template>

<script>


export default {
	name: 'mpLabel',
	props: {
		text: {
			type: String,
			default: ''
		},
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
		isHref(val) {
			if (val) {
				val = ('' + val).toLowerCase();
				return val.startsWith("http://") || val.startsWith("https://");
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
</style>

