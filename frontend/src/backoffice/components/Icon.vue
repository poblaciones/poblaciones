<template>
	<span>
		<span v-if="symbol" v-html="resolveIcon(symbol)"></span>
		<span v-else style="font-size: 14px;">[Ninguno]</span>
</span>
</template>

<script>
import iconManager from '@/common/js/iconManager';

export default {
  data() {
    return {
   };
  },
  methods: {
		resolveIcon(symbol) {
			return iconManager.showIcon(symbol, this.work.Icons, this.iconMaxSize);
		},
	},
		props: {
			symbol: String,
			work: Object,
			iconMaxSize: null
		}
};
</script>


<style rel="stylesheet/scss" lang="scss" scoped>


</style>
