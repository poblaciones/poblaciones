<template>
	<div class="app-singlepage">
		<div class="md-layout md-alignment-top-center">
			<div class="md-layout-item md-size-100 md-small-hide" style="height: 60px">
			</div>
			<div class="md-layout-item md-size-90">
				<div class="md-layout">
						<pivot-demo></pivot-demo>
				</div>
			</div>
		</div>
	</div>
</template>
<script>
import { required, email } from 'vuelidate/lib/validators';
// https://www.npmjs.com/package/vue2-animate#sassscss
import response from '@/common/framework/response';
import str from '@/common/framework/str';
	import PivotDemo from '../processing/PivotDemo';

export default {
	name: 'Layout',
		components: {
		PivotDemo
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
