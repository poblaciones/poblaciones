<template>
	<div style="height: 100%">
		<div style="height: 100%">
			<div id="panMain" class="split split-horizontal" style="overflow-y: hidden;">
				<sidebar  v-if="this.Work" @collapse="onCollapse" class="" ></sidebar>
			</div>
			<div id="panRight" class="split split-horizontal" style="overflow-y: hidden; position: relative">
				<div class="mainPanel" style="margin-top: 55px;">
					<app-main  v-if="this.Work"></app-main>
				</div>
			</div>
		</div>
		<Topbar  v-if="this.Work" style="padding-left: 0px !important;"/>
		<invoker ref="invoker"></invoker>
	</div>
</template>

<script>
import AppMain from './AppMain';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Split from 'split.js';

export default {
  name: 'layout',
  components: {
    Sidebar,
    Topbar,
    AppMain
  },
  mounted() {
    var workId = this.$route.params.workId;
		this.$refs.invoker.do(window.Db,
													window.Db.BindWork,
													workId);
		Split(['#panMain', '#panRight'], {
			sizes: [25, 75],
			minSize: 150,
			gutterSize: 4
		});
  },
  watch: {
  '$route.params.workId'(workId) {
      window.Db.BindWork(workId);
    },
  '$route.params.datasetId'(datasetId) {
      window.Db.BindDataset(datasetId);
    }
   },

	data() {
		return {
			collapsed: false
			};
	},
  computed: {
    sidebar() {
      return this.$store.state.app.sidebar;
    },
    Work () { return window.Context.CurrentWork; },
    device() {
      return this.$store.state.app.device;
    },
    classObj() {
      return {
        hideSidebar: !this.sidebar.opened,
        withoutAnimation: this.sidebar.withoutAnimation,
        mobile: this.device === 'mobile'
      };
    }
  },
  methods: {
    handleClickOutside() {
      this.$store.dispatch('CloseSideBar', { withoutAnimation: false });
    },
		onCollapse(collapsed) {
      this.collapsed = collapsed;
    },
  }
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>


	#mainPanel {
		padding-left: 250px;
	}
	#mainPanel.collapsed {
	padding-left: 0px;
	}


	.sidebar-container {
		transition: width 0.28s;
		width: 251px !important;
		height: 100%;
	  border-right: #dcdcdc solid 1px !important;
    position: fixed;
		font-size: 0px;
		top: 0;
		line-height: 9px;
		bottom: 0;
		left: 0;
		z-index: 1001;
		overflow: hidden;
	}



</style>
