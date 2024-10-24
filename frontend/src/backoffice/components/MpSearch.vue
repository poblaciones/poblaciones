<template>

	<div style="position: absolute; z-index: 10;left: 200px; background-color: white">
		<md-button @click="focusSearch" style="float: right; margin-top: 11px; margin-left: -2px;" class="md-icon-button">
			<md-icon>search</md-icon>
			<md-tooltip md-direction="bottom">Buscar en la lista</md-tooltip>
		</md-button>
		<md-field md-clearable class="md-toolbar-section-end" style="width: 150px; margin-top: -3px">
			<md-input class="smallInput" v-model="localValue" ref="inputSearch" @input="searchOnTable" />
		</md-field>

	</div>

</template>

<script>

import str from '@/common/framework/str';

export default {
  name: 'MpSearch',
		components: {
  },
	methods: {

		focus() {
			this.$nextTick(() => {
				this.input.$el.focus();
			});
		},
		update()
		{
			this.$emit('input', this.localValue);
		},
		searchOnTable() {
			this.update();
			this.$emit('search', this.localValue);
		},
		focusSearch() {
			this.$refs.inputSearch.$el.focus();
		},

  },
		computed: {

		inputId() {
			return 'textControl' + this._uid;
		},
		input() {
			return this.$refs[this.inputId];
		}
	},
	created() {
		this.localValue = this.value;
	},
	mounted() {
		var loc = this;
	},
	data() {
		return {
			localValue: ''
		};
	},
  props: {
		value: {},
  },
	watch: {
		'value'() {
			if (this.localValue !== this.value) {
				this.localValue = this.value;
			}
		},
		'localValue'() {
			if (this.localValue !== this.value) {
				this.update();
			}
		}
	}


};
</script>
<style rel="stylesheet/scss" lang="scss" scoped>

	.smallInput {
		font-size: 13px;
		width: 100px;
	}

</style>
