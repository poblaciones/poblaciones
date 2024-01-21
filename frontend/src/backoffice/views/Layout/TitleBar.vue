<template>
	<div>
		<div class="md-elevation-1 titleBar">
			<span>
				{{ title }}
				<mp-help :text="help"></mp-help>
			</span>
			<div v-if="showReadonlyIndexedWarning" style="
          font-size: 11px;
          position: absolute;
          left: 200px;
          width: 50%;
          top: 8px;
          border-radius: 4px;
          border-color: #e39393;
          border-width: 2px;
          background-color: #ededed;
          color: #888;
          padding: 4px 8px 2px 8px;
          border-style: solid;
          text-align: center;
          text-transform: uppercase;
                ">La cartografía se encuentra indexada, por lo que no podrán hacerse cambios. Si precisa realizar modificaciones, contacte a los administradores para quitar la indexación.</div>
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
		help: String,
		showReadonlyIndexedWarning: false,
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

