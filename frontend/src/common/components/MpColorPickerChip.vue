<template>
	<div :style="'background-color: ' + localValue" :class="'picked' + (canEdit ? ' hand': '')"
				@click="show" ref="chip">
		<div v-show="isDisabledObject && !isDisabledObject.Visible">
			<div class="line2"></div>
		</div>
		<slot></slot>
	</div>
</template>

<script>

export default {
	name: 'MpColorPickerChip',
	components: {
	},
	methods: {
		show()
		{
			var offsetY = this.$refs.chip.getBoundingClientRect().top;
			this.$emit('show', this.isDisabledObject, offsetY);
		},
	},
	props: {
		isDisabledObject: null,
		localValue: null,
		canEdit: { type: Boolean, default: true },
	},
	};
</script>
<style rel="stylesheet/scss" lang="scss" scoped="">
.picked {
	position: relative;
	width: 30px;
	height: 23px;
	margin-right: 10px;
  margin-top: -1px;
  margin-left: -10px;
	border-radius: 15px;
	border: 2px solid #828282;
}

	.line2 {
		width: 28px;
		height: 35px;
		border-bottom: 2px solid #707170;
		-webkit-transform: translateY(20px) translateX(5px) rotate(-26deg);
		position: absolute;
		top: -42px;
		left: -13px;
	}

</style>
