<template>
	<div class="download-menu-holder" v-on-clickaway="close">
		<button ref="trigger" type="button" class="mp-btn mp-btn--solid" aria-haspopup="true"
						:aria-expanded="isOpen ? 'true' : 'false'" :disabled="disabled" @click="toggle">
			{{ caption }} <download-icon title="Descargar" />
		</button>
		<div v-show="isOpen" ref="menu" class="download-menu mp-surface" role="menu" :style="menuStyle">
			<button v-for="format in formats" :key="format.key" type="button" role="menuitem"
							class="download-menu-item" @click="select(format)">{{ format.caption }}</button>
		</div>
	</div>
</template>

<script>
import { mixin as clickaway } from 'vue-clickaway';
import DownloadIcon from 'vue-material-design-icons/Download.vue';

const MENU_GAP = 4;

// Botón con un menú de formatos. El menú es flotante (position: fixed): no queda
// recortado por el diálogo que lo contiene, se alinea a la derecha del botón y se
// abre hacia arriba cuando abajo no hay lugar.
export default {
	name: 'downloadMenu',
	mixins: [clickaway],
	props: {
		caption: {
			type: String,
			required: true
		},
		formats: {
			type: Array,
			required: true
		},
		disabled: {
			type: Boolean,
			default: false
		}
	},
	components: {
		DownloadIcon
	},
	data() {
		return {
			isOpen: false,
			menuStyle: {}
		};
	},
	beforeDestroy() {
		this.stopListening();
	},
	methods: {
		toggle() {
			if (this.isOpen) {
				this.close();
			} else {
				this.open();
			}
		},
		open() {
			var loc = this;
			this.menuStyle = { visibility: 'hidden' };
			this.isOpen = true;
			this.$nextTick(function () {
				loc.menuStyle = loc.placeMenu();
				loc.startListening();
			});
		},
		close() {
			this.isOpen = false;
			this.stopListening();
		},
		select(format) {
			this.close();
			this.$emit('select', format);
		},
		placeMenu() {
			var trigger = this.$refs.trigger.getBoundingClientRect();
			var menuHeight = this.$refs.menu.offsetHeight;
			var style = {
				right: (window.innerWidth - trigger.right) + 'px'
			};
			var spaceBelow = window.innerHeight - trigger.bottom;
			if (spaceBelow >= menuHeight + MENU_GAP) {
				style.top = (trigger.bottom + MENU_GAP) + 'px';
			} else {
				style.bottom = (window.innerHeight - trigger.top + MENU_GAP) + 'px';
			}
			return style;
		},
		// El menú está fijo en pantalla: si algo se desplaza o cambia de tamaño se cierra.
		startListening() {
			window.addEventListener('resize', this.close);
			window.addEventListener('scroll', this.close, true);
		},
		stopListening() {
			window.removeEventListener('resize', this.close);
			window.removeEventListener('scroll', this.close, true);
		}
	}
};
</script>

<style scoped>
.download-menu-holder {
	display: inline-block;
}

.download-menu {
	position: fixed;
	z-index: 10;
	min-width: 200px;
	display: flex;
	flex-direction: column;
	padding: 4px 0;
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
}

.download-menu-item {
	background: transparent;
	border: 0;
	text-align: left;
	padding: 7px 12px;
	font-size: 14px;
	cursor: pointer;
}

.download-menu-item:hover,
.download-menu-item:focus {
	background: #f1f1f1;
}
</style>
