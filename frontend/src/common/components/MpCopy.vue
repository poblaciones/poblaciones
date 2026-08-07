<template>
	<span>
		<a href="#" v-clipboard="() => text" v-if="text"
			 v-clipboard:success="clipboardSuccessHandler"
			 v-clipboard:error="clipboardErrorHandler"
			 @click.prevent="click">
			<i class="far fa-copy"></i>
			<md-tooltip md-direction="bottom">Copiar</md-tooltip>
		</a>
	</span>
</template>
<script>

	export default {
		name: 'MpCopy',
		components: {

		},
		methods: {
			clipboardSuccessHandler({ value, event }) {
				event.preventDefault();
				event.stopPropagation();
			},
			clipboardErrorHandler({ value, event }) {
				event.preventDefault();
				event.stopPropagation();
			},
		},
		data() {
			return {
			};

		},
		props: {
			text: String,
		},
	};
</script>
