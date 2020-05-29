<template>
	<md-button class="largeButton" :class="(toggled ? 'mdtoggled' : 'md-raised')" @click="onClick">
		<i :class="ico" class="largeIco"></i>
		<br />
		{{
		text
		}}
	</md-button>
</template>

<script>

export default {
  name: 'MpLargeButton',
	components: {
	},
	methods: {
		onClick(e) {
			this.$emit('click', e);
		},
	},
  props: {
    text: String,
		ico: String,
		toggled: Boolean
  },
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

	.largeButton {
		width: 150px;
		height: 150px;
	}
	.largeIco {
		font-size: 50px;
		padding-bottom: 12px;
	}
	.mdtoggled {
		background-color: #ddd;
	}

</style>
