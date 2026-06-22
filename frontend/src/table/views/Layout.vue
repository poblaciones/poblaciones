<template>
	<div class="app-singlepage">

						<dashboard></dashboard>
	</div>
</template>
<script>
import { required, email } from 'vuelidate/lib/validators';
// https://www.npmjs.com/package/vue2-animate#sassscss
import response from '@/common/framework/response';
import str from '@/common/framework/str';
	import Dashboard from './Dashboard';

export default {
	name: 'Layout',
		components: {
			Dashboard
	},
		created() {
		var loc = this;
	},
	data() {
		return {

		};
	},
	computed: {
	},
	methods: {

	}
};
</script>
<style rel="stylesheet/scss" lang="scss" scoped>


</style>
