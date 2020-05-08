<template>
	<div class="container hand" v-on:click="click">
		<img :src="image" :title="text">
		<div class="txt">{{ text }}</div>
	</div>
</template>

<script>
export default {
	name: 'imageButton',
	props: [
		'image',
		'text',
	],
	methods: {
		click(e) {
			e.preventDefault();
			this.$emit('click', e);
		},
	},
};
</script>

<style scoped>
.container {
	text-align: center;
	border: 1px solid #b9b9b9;
	padding: 20px;
	margin: 20px 10px 0 10px;
	width: 150px;
	height: 150px;
	border-radius: 4px;
	float: left;
}
.txt {
	margin-top: 15px;
}
</style>

