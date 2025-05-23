<template>
	<div v-if="Work">
		<title-bar title="Personalizar" :showReadonlyIndexedWarning="Work.ReadOnlyCausedByIndexing()"
							 :help="`<p>En esta sección se indican opciones que modifican la vista personalizada
							que se genera para la cartografía.
			</p>`+ extraHelp('CustomizeSection')" />
		<div class="app-container">

			<startup />
			<metrics />

		</div>
	</div>

</template>
<script>
import Metrics from './Metrics.vue';
import Startup from './Startup.vue';

export default {
	name: 'Customize',
	components: {
		Metrics,
		Startup
	},
	data() {
		return {
		};
	},
	computed: {
		Work() {
			return window.Context.CurrentWork;
		},
	},
	mounted() {
	},
		methods: {
			extraHelp(section) {
				if (window) {
					return window.Context.HelpLinkSection(window.Context.Configuration.Help[section]);
				} else {
					return '';
				}
			},
	}
};

</script>

<style rel="stylesheet/scss" lang="scss" scoped>

.infoRow {
	margin-left: 8px;
	margin-top: 8px;
	margin-bottom: 6px;
	color: #666;
	border: 1px solid #e4e4e4;
	background-color: #efefef;
	padding: 2px 5px;
	border-radius: 3px;
}

.paddedList {
	padding: 20px 60px 0px 60px !important;
}
.noLeftMargin {
	margin-left: 0px!important;
}

.extraInfo {
	color: #777;
	font-size: 85%;
  font-style: italic;
}
</style>
