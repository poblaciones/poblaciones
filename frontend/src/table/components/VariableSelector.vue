<template>
	<div class="variable-selector">
		<div class="variable-display" @click.stop="toggle" v-if="hasMultiple">
			<span class="variable-text">{{ currentName }}<span v-if="normalizationCaption" class="variable-norm">{{ normalizationCaption }}</span></span>
			<span class="variable-arrow">▾</span>
		</div>
		<span v-else class="variable-text-single">{{ currentName }}<span v-if="normalizationCaption" class="variable-norm">{{ normalizationCaption }}</span></span>

		<div v-if="open" class="variables-panel">
			<div class="variables-panel-content">
				<div v-for="(variable, index) in variables"
						 :key="'variable-' + index"
						 class="variable-option"
						 :class="{ 'active': index === selectedIndex }"
						 @click="choose(index)">
					{{ variable.Name }}
				</div>
			</div>
		</div>
	</div>
</template>

<script>
/*
 * VariableSelector — combo de la variable de un nivel. Conoce el objeto de
 * negocio (un Level con sus Variables y el índice seleccionado): sabe mostrar la
 * variable activa y listar las disponibles. No muta el activo: emite
 * 'select' (índice elegido). La propagación a otras versiones la decide el padre.
 */
export default {
	name: 'VariableSelector',
	props: {
		// Level del objeto de negocio (tiene Variables y SelectedVariableIndex).
		level: { type: Object, default: null },
		// Sufijo de normalización ya resuelto por el padre (depende de la métrica).
		normalizationCaption: { type: String, default: '' }
	},
	data() {
		return { open: false };
	},
	watch: {
		open(v) { this.$emit('open-change', v); },
		// Si cambia el nivel/variable desde afuera, se cierra el panel.
		level() { this.open = false; }
	},
	computed: {
		variables() { return this.level && this.level.Variables ? this.level.Variables : []; },
		selectedIndex() { return this.level ? this.level.SelectedVariableIndex : -1; },
		hasMultiple() { return this.variables.length > 1; },
		currentName() {
			var v = this.variables[this.selectedIndex];
			return v ? v.Name : '';
		}
	},
	mounted() {
		var loc = this;
		this.clickOutsideHandler = function (event) {
			if (!loc.open) return;
			var inside = false, t = event.target;
			while (t) {
				if (t.classList && t.classList.contains('variable-selector')) { inside = true; break; }
				t = t.parentElement;
			}
			if (!inside) loc.open = false;
		};
		document.addEventListener('click', this.clickOutsideHandler);
	},
	beforeDestroy() {
		if (this.clickOutsideHandler) document.removeEventListener('click', this.clickOutsideHandler);
		if (this.open) this.$emit('open-change', false);
	},
	methods: {
		toggle() { this.open = !this.open; },
		choose(index) {
			this.open = false;
			this.$emit('select', index);
		},
		close() { this.open = false; }
	}
};
</script>

<style scoped>
	.variable-selector {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		position: relative;
	}
	.variable-display {
		flex: 1;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 6px 10px;
		background-color: #f5f5f5;
		border: 1px solid #e0e0e0;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s ease;
		min-height: 32px;
	}
	.variable-display:hover {
		background-color: #eeeeee;
		border-color: #bdbdbd;
	}
	.variable-text,
	.variable-text-single {
		font-size: 13px;
		color: #424242;
		flex: 1;
		white-space: normal;
		word-wrap: break-word;
		line-height: 1.3;
	}
	.variable-norm {
		color: #9e9e9e;
		font-weight: 400;
		margin-left: 2px;
	}
	.variable-arrow {
		color: #757575;
		font-size: 10px;
		margin-left: 8px;
		margin-top: 2px;
		flex-shrink: 0;
	}
	.variables-panel {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		margin-top: 3px;
		background-color: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 4px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
		z-index: 1000;
	}
	.variables-panel-content {
		max-height: 300px;
		overflow-y: auto;
	}
	.variable-option {
		padding: 10px 12px;
		cursor: pointer;
		font-size: 13px;
		color: #424242;
		line-height: 1.4;
		transition: background-color 0.15s ease;
		white-space: normal;
		word-wrap: break-word;
	}
	.variable-option:hover {
		background-color: #f5f5f5;
	}
	.variable-option.active {
		background-color: #e3f2fd;
		color: #1976d2;
		font-weight: 500;
	}
	.variables-panel-content::-webkit-scrollbar {
		width: 8px;
	}
	.variables-panel-content::-webkit-scrollbar-track {
		background: #f1f1f1;
	}
	.variables-panel-content::-webkit-scrollbar-thumb {
		background: #c1c1c1;
		border-radius: 4px;
	}
	.variables-panel-content::-webkit-scrollbar-thumb:hover {
		background: #a1a1a1;
	}
</style>
