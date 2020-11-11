<template>
	<div class="iconPreview">
		<div class="pinPosition" :style="smallPinOffset">
			<i class="fas fa-map-marker" :class="getSize" v-if="marker.Frame == 'P'" />
			<div class="frameCircle" :class="getSize" v-if="marker.Frame == 'C'" />
			<div class="frameBox" :class="getSize" v-if="marker.Frame == 'B'" />
		</div>
		<div class="iconPosition" :style="iconOffset">
			<div :style="iconSize" v-html="resolveIcon"></div>
		</div>

		<div :class="labelPosition" :style="labelOffset + fontSize">Etiqueta</div>
	</div>
</template>

<script>
import iconManager from '@/common/js/iconManager';

export default {
  name: 'IconPreview',
	components: {

	},
	methods: {

  },
	computed: {
		resolveIcon() {
			if (this.marker.Type == 'I') {
				return iconManager.showIcon(this.symbolIcon, this.Work.Icons);
			} else {
				return this.symbolText;
			}
		},
		symbolIcon() {
			if (this.marker.Source == 'V') {
				return 'fa-star';
			} else {
				return this.marker.Symbol;
			}
		},
		symbolText() {
			if (this.marker.Source == 'V') {
				return 'T';
			} else {
				return this.marker.Text;
			}
		},
		iconOffset() {
			return (this.marker.Frame === 'P' ? 'margin-top: -4px;' : '');
		},
		smallPinOffset() {
			if (this.marker.Frame === 'P' && this.marker.Size === 'S') {
				return 'margin-left: -1.5px';
			} else {
				return '';
			}
		},
		getSize() {
			switch (this.marker.Size) {
				case 'S':
					return 'sizeSmall';
				case 'M':
					return 'sizeMedium';
				case 'L':
					return 'sizeLarge';
			}
			throw new Error('Tamaño no reconocido');
		},
		Work() {
			return window.Context.CurrentWork;
		},
		iconSize() {
			var size = .25 + (.25 * this.sizeToNumeric);
			return 'transform: scale(' + size + ', ' + size + ')';
		},
		labelPosition() {
			switch (this.marker.DescriptionVerticalAlignment) {
				case 'T':
					return 'labelTop';
				case 'B':
					return 'labelBottom';
				case 'M':
					return 'labelMiddle';
			}
			throw new Error('Posición de etiqueta no reconocida');
		},
		sizeToNumeric() {
			return (this.marker.Size === 'S' ? 1 : (this.marker.Size === 'M' ? 2 : 3));
		},
		fontSize() {
			return '; font-size: ' + (11 + this.sizeToNumeric) + 'px';
		},
		labelOffset() {
			var n = 16 - this.sizeToNumeric * 5;
			switch (this.marker.DescriptionVerticalAlignment) {
				case 'T':
					return 'top: ' + n + 'px';
				case 'B':
					return 'bottom: ' + n + 'px';
				case 'M':
					return '';
			}
			throw new Error('Posición de etiqueta no reconocida');
		}
	},
	data() {
		return {};
	},
  props: {
    marker: Object,
  },
};
</script>
<style rel="stylesheet/scss" lang="scss" scoped>
	.frameCircle {
		border: 1px solid grey;
		background-color: grey;
		border-radius: 40px;
	}

	.frameBox {
		border: 1px solid grey;
		background-color: grey;
	}

.iconPreview {
	width: 90px;
	margin-top: 10px;
	height: 90px;
	position: relative;
	background-color: #eeeeee;
	margin-bottom: -20px;
}
	.labelTop {
		position: absolute;
		left: 50%;
		transform: translate(-50%, 0);
	}
	.labelBottom {
		position: absolute;
		left: 50%;
		transform: translate(-50%, 0);
	}
	.labelMiddle {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
	}
	.pinPosition {
		position: absolute;
		left: 50%;
		text-align: center;
		top: 50%;
		transform: translate(-50%, -50%);
		color: grey;
	}
	.sizeSmall {
		width: 20px;
		height: 20px;
		font-size: 30px;
	}
	.sizeMedium {
		width: 30px;
		height: 30px;
		font-size: 40px;
	}
	.sizeLarge {
		width: 40px;
		height: 40px;
		font-size: 50px;
	}
	.iconPosition {
		position: absolute;
		left: 50%;
		color: #eeeeee;
		top: 50%;
		transform: translate(-50%, -50%);
		font-size: 24px;
	}
</style>
