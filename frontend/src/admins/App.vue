<template>
	<div style="height: 100%">
		<div v-if="user && user.Logged == true" id="app">
			<router-view></router-view>
		</div>
		<invoker ref="invoker" />
	</div>
</template>

<script>
import authentication from '@/common/js/authentication';
import Vue from 'vue';
import err from '@/common/framework/err';

export default {
	name: 'App',
	// components: { },
	data() {
		return {
			user: null,
			menu: [ { caption: 'Cartografías', link: 'cartographies' } ],
			works: null,
			context: window.Context
		};
	},
	mounted() {
		this.RegisterErrorHandler();
		this.InitializePage();
	},
	methods: {
		InitializePage() {
			const loc = this;
			authentication.loadHeaderBar(loc.LoadData);
		},
		LoadData(data) {
			// Inicia sesión autenticada
			this.user = data.User;
			window.Context.User = this.user;
			window.Context.Configuration = data;
			window.Context.Factory.Refresh();
		},
		RegisterErrorHandler() {
			Vue.config.errorHandler = err.HandleError;
			window.onerror = err.HandleError;
		}
	},
};

</script>

<style src="@/common/styles/popovers.css">
</style>

<style>

html, body {
	height: 100%;
	overflow-y: hidden;
	margin: 0;
	padding: 0;
}

.md-table-sortable-icon {
	right: 8px;
	left: unset!important;
}

.separator {
	font-size: 12px;
	text-transform: uppercase;
	font-weight: 500;
	color: #949494;
	margin-bottom: 7px;
}

.gm-fullscreen-control {
	transform: scale(0.8);
}
.gm-bundled-control {
	transform: scale(0.8);
	margin: 0px 0px -24px 0px !important;
}
.gm-style-mtc {
	transform: scale(0.8);
}

.md-table-cell-container {
	padding-right: 0px!important;
}
.md-tab {
	overflow-x: hidden;
}
.md-tabs.md-theme-default .md-tabs-navigation {
	background-color: unset !important;
	margin-bottom: 25px !important;
	border-bottom: #eee solid 1px !important;
}
.md-dialog-title {
	padding: 12px 12px 10px !important;
	background-color: #00A0D2;
	color: white;
}
.md-title {
	font-weight: normal ! important;
}
.md-card {
	margin-top: 8px;
	margin-bottom: 8px;
}
.md-dialog {
	min-width: 400px !important;
	border-radius: 4px !important;
}
.md-menu-content {
	max-width: 380px!important;
}
.md-dialog-actions {
	border-top: 0.5px solid #cccccc;
}
.whiteLink {
	color: white !important;
}
.whiteLink:hover {
	text-decoration: none !important;
}
.md-switch.md-disabled {
	filter: grayscale(1);
}
.md-button {
	font-weight: normal !important;
	text-transform: none !important;
}

@media print {
	.no-print, .no-print * {
		display: none !important;
	}

	.always-print {
		visible: visible;
	}
	.only-print {
		display: block!important;
	}
}

.only-print {
	display: none;
}

.topbar {
	position: fixed; overflow: hidden;
	padding: 13px; top: 0px; width: 20px;
	height: 52px; z-index: 10000;
	background-color: #00A0D2;
	color: #fff;
	-webkit-box-shadow: 0 1px 4px 0 rgba(90,90,90,.32);
	box-shadow: 0 1px 4px 0 rgba(90,90,90,.32);
	margin-bottom: 2p;
}

.topBarContainer {
}
.gridStatusBar {
	font-size: 13px;
	padding-top: 3px;
	padding-left: 2px;
	color: #777;
	min-height: 1li;
}

.jqx-widget-content {
	font-family: Roboto,Noto Sans,-apple-system,BlinkMacSystemFont,sans-serif;
}
.jqx-grid-content {
	cursor: default;
}
.jqx-widget {
	font-family: Roboto,Noto Sans,-apple-system,BlinkMacSystemFont,sans-serif;
}

.md-field.md-theme-default.md-disabled:after {
	background-image: unset ! important;
}
.md-field {
	margin-bottom: 6px!important;
}

.mp-label {
	padding-left: 0 !important;
	left: 0 !important;
	margin-bottom: 2px;
	line-height: 1.1em;
	color: #888!important;
	-webkit-text-fill-color: #888 !important;
	font-size: 14px!important;
}

.mp-area {
	left: 0 !important;
	margin-bottom: 2px;
	line-height: 1.5em;
	color: #448aff!important;
	font-size: 14px!important;
	border: 1px solid whitesmoke!important;
	margin-top: 10px;
	margin-bottom: 5px;
	padding-top: 6px;
	padding-left: 6px !important;
}

.dParagrah {
	padding-top: 0px;
	padding-left: 0px;
	padding-right: 0px;
	padding-bottom: 20px;
}

.gutterBottom {
	margin-bottom: 18px;
}

.gutterTop {
	margin-top: 18px;
}
.mpNoWrap {
	white-space: nowrap;
}

.md-dialog-container {
	max-width: 640px !important;
}
.hand {
	cursor: pointer;
}
.md-icon-button {
	cursor: pointer;
}
.md-icon-button {
	margin: 0 0px;
}
.mp-right-toolbar {
	position: absolute;
	padding-top: 12px;
	right: 9px;
}
.mp-bottom-toolbar {
	bottom: 15px;
}
.md-helper-text {
	bottom: -18px ! important;
	-webkit-text-fill-color: #888 !important;

}

.helper {
	font-size: 11.5px;
	line-height: 1.4em;
	color: #a0a0a0!important;
}

.selectable {
	cursor: pointer;
}
.mpLabel {
	position: absolute;
	line-height: 0.3em;
	font-size: 14px!important;
	color: #888 !important;
}
.userInfo {
	float: right;
	font-size: 12px;
	margin-top: -8px;
}
.md-field.md-has-textarea:not(.md-autogrow) .md-count {
	bottom: -22px!important;
}
.normalTextLink {
	color: #444444!important
}

a.normalTextLink:hover {
	text-decoration: none!important;
}

.split p, .split-flex p {
	padding: 20px;
}

.split, .split-flex {
	-webkit-box-sizing: border-box;
	-moz-box-sizing: border-box;
	box-sizing: border-box;

	overflow-y: auto;
	overflow-x: hidden;
}

.gutter {
	background-color: #eee;
	background-repeat: no-repeat;
	background-position: 50%;
}

.gutter.gutter-vertical {
	background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAFAQMAAABo7865AAAABlBMVEVHcEzMzMzyAv2sAAAAAXRSTlMAQObYZgAAABBJREFUeF5jOAMEEAIEEFwAn3kMwcB6I2AAAAAASUVORK5CYII=');
	cursor: ns-resize;
}

.gutter.gutter-horizontal {
	background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAeCAYAAADkftS9AAAAIklEQVQoU2M4c+bMfxAGAgYYmwGrIIiDjrELjpo5aiZeMwF+yNnOs5KSvgAAAABJRU5ErkJggg==');
	cursor: ew-resize;
}

.split.split-horizontal, .gutter.gutter-horizontal {
	height: 100%;
	float: left;
}
</style>
