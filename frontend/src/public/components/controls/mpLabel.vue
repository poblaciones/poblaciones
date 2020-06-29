<template>
	<span class="label">
		<template v-if="isHref(text)">
			<a target="_blank" :href="text">{{ text }}</a>
		</template><template v-else>{{ text }}</template>
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
.label {
	word-wrap: break-word;
}
</style>

