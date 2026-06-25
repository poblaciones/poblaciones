<template>
	<div class="version-selector" v-if="hasMultiple">
		<div class="version-label-wrapper" ref="anchor" @click.stop="togglePanel($refs.anchor)">
			<span class="version-text">{{ label }}</span>
			<span class="version-arrow">▾</span>
		</div>

		<div v-if="open" class="version-dropdown floating" :style="floatStyle">
			<div v-for="(version, index) in versions"
					 :key="'version-' + index"
					 class="version-option"
					 :class="{ 'active': !multi && index === selectedIndex }"
					 @click="onOptionClick(index)">
				<input v-if="multi" type="checkbox" class="version-checkbox"
							 :checked="isActive(index)"
							 @click.stop="$emit('toggle-multi', index)" />
				<span>{{ version.Version.Name }}</span>
			</div>

			<div class="version-multi-switch">
				<label class="switch-label">
					<input type="checkbox" :checked="multi" @change="$emit('toggle-mode')" />
					<span>Elegir varios</span>
				</label>
			</div>
		</div>
	</div>
	<span v-else class="version-text-single">{{ singleName }}</span>
</template>

<script>
import floatingDropdown from '@/table/components/floatingDropdown.js';

/*
 * VersionSelector — combo de edición (versión) de un indicador. Conoce el
 * objeto de negocio (la métrica con sus Versions, el índice activo y el estado
 * multi-versión): sabe mostrar la edición o ediciones elegidas y el switch
 * "Elegir varios". No muta la métrica: emite 'select' (índice en single),
 * 'toggle-multi' (índice en multi) y 'toggle-mode' (cambiar single/multi). El
 * rematch de niveles/categorías y la invalidación de datos los hace el padre.
 */
export default {
	name: 'VersionSelector',
	mixins: [floatingDropdown],
	props: {
		metric: { type: Object, required: true }
	},
	computed: {
		versions() { return this.metric.properties.Versions; },
		hasMultiple() { return this.versions.length > 1; },
		multi() { return !!this.metric.properties.MultiVersion; },
		selectedIndex() { return this.metric.properties.SelectedVersionIndex; },
		activeIndices() { return this.metric.properties.SelectedVersionIndices; },
		// Edición actual en single (nombre seguro).
		singleName() {
			var v = this.versions[this.selectedIndex];
			return v && v.Version ? v.Version.Name : '—';
		},
		// Etiqueta del control: en single la edición; en multi, la lista elegida.
		label() {
			if (!this.multi) return this.singleName;
			var idxs = this.activeIndices;
			if (!idxs.length) return 'Ninguno';
			var versions = this.versions;
			return idxs
				.map(function (i) { var v = versions[i]; return v ? v.Version.Name : null; })
				.filter(Boolean)
				.join(', ');
		}
	},
	methods: {
		rootClass() { return 'version-selector'; },
		panelWidth() { return 200; },
		isActive(index) { return this.activeIndices.indexOf(index) !== -1; },
		// Click en una opción: en single cambia la edición (y cierra); en multi el
		// checkbox es el que togglea, así que el click en la fila no hace nada.
		onOptionClick(index) {
			if (this.multi) return;
			this.closePanel();
			this.$emit('select', index);
		}
	}
};
</script>

<style scoped>
	.version-selector {
		position: relative;
	}
	.version-label-wrapper {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 8px;
		background-color: #f5f5f5;
		border: 1px solid #e0e0e0;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	.version-label-wrapper:hover {
		background-color: #eeeeee;
		border-color: #bdbdbd;
	}
	.version-text {
		font-size: 12px;
		color: #424242;
		white-space: nowrap;
	}
	.version-text-single {
		font-size: 12px;
		color: #424242;
	}
	.version-arrow {
		color: #757575;
		font-size: 10px;
	}
	.version-dropdown {
		background-color: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 4px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
		z-index: 1000;
		min-width: 100px;
		overflow: hidden;
	}
	/* Posición fija calculada por el mixin; se resetean los offsets de la regla base. */
	.version-dropdown.floating {
		position: fixed;
		right: auto;
		top: auto;
		bottom: auto;
		margin: 0;
		width: 200px;
		min-width: 0;
		max-width: 280px;
		overflow-y: auto;
	}
	.version-option {
		padding: 8px 12px;
		cursor: pointer;
		font-size: 12px;
		color: #424242;
		transition: background-color 0.15s ease;
		white-space: nowrap;
	}
	.version-option:hover {
		background-color: #f5f5f5;
	}
	.version-option.active {
		background-color: #e3f2fd;
		color: #1976d2;
		font-weight: 500;
	}
	.version-option .version-checkbox {
		margin-right: 6px;
	}
	.version-multi-switch {
		padding: 8px 12px;
		border-top: 1px solid #e0e0e0;
		background-color: #fafafa;
	}
	.switch-label {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 11px;
		color: #424242;
		cursor: pointer;
		white-space: nowrap;
	}
</style>
