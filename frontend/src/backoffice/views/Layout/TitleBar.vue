<template>
	<div>
		<div class="md-elevation-1 titleBar">
			<span>
				{{ title }}
				<help-icon v-if="help" :size="14"
									class="md-icon-button hand md-small-hide"
									style="margin-top: 10px;
									    margin-left: 3px;
											color: #888;
											position: absolute;"
									v-tooltip.bottom-start="{ content: help, autoHide: false,
									classes : 'tooltipInTitleBar' }"  />

		</span>
		</div>
		<div style="height: 52px;"></div>
	</div>
</template>

<script>

export default {
	name: 'titleBar',
	components: {

	},
	props: {
		title: String,
		help: String
	},
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

.titleBar {
	position: fixed;
  padding-top: 15px;
  font-size: 23px;
  line-height: 1.25;
  color: #676767;
  padding-left: 13px;
  padding-bottom: 10px;
  width: 100%;
  margin-top: -3px;
  z-index: 10;
  background-color: #fdfdfd;
}

</style>

