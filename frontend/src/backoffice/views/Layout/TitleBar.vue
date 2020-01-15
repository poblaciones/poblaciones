<template>
	<div>
		<div class="md-elevation-1 titleBar">
			<span>
				{{ title }}
				<mp-help :text="help"></mp-help>
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

