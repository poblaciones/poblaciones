<template>
	<div id="iconPicker" v-if="showPicker" v-on-clickaway="hide">
		<div class="iconPicker__header">
			<input type="text" :placeholder="searchPlaceholder" @keyup="filterIcons($event)">
		</div>
		<mp-icon-font-panel v-model="selected" @selectIcon="selectIcon" collection="flaticons"></mp-icon-font-panel>
		<mp-icon-font-panel v-model="selected" @selectIcon="selectIcon" collection="fontawesome"></mp-icon-font-panel>
	</div>
</template>

<script>
// From: https://github.com/laistomazz/font-awesome-picker/blob/master/src/components/fontAwesomePicker.vue

import MpIconFontPanel from './MpIconFontPanel';

import { mixin as clickaway } from 'vue-clickaway';

export default {
	name: 'mpIconFontPicker',
	components: {
    MpIconFontPanel
	},
	props: {
					'searchBox': String,
					'value': String },
	mixins: [ clickaway ],
	data () {
		return {
			selected: '',
			showPicker: false,
		};
	},
	computed: {
		searchPlaceholder () {
			return this.searchBox || 'search box';
		},
	},
	created() {
		this.receiveValue();
	},
	methods: {
		receiveValue() {
			this.selected = this.value;
		},
		hide() {
			this.showPicker = false;
		},
		show() {
			this.showPicker = true;
		},
		selectIcon (value) {
			this.$emit('input', value);
			this.$emit('selectIcon', value);
			this.hide();
		},
	},
	watch: {
		'value'() {
			this.receiveValue();
		}
	}
};
</script>

<style>
	#iconPicker {
		position: relative;
    max-width: 725px;
    margin-top: -5px;
    margin-left: 8px;
    background: #ffffff;
    border-radius: 4px 4px 4px 4px;
    border: 1px solid #ccc!important;
	}
	.iconPicker__header {
		padding: 1em;
		display: none;
		border-radius: 8px 8px 0 0;
		border: 1px solid #ccc;
	}
	.iconPicker__header input {
		width: 100%;
		padding: 1em;
	}
</style>
