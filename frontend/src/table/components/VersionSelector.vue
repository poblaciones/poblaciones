<template>
	<div class="version-selector" v-if="hasMultiple">
		<div class="version-label-wrapper" ref="anchor" @click.stop="togglePanel($refs.anchor)">
			<span class="version-arrow">▾</span>
		</div>

		<div v-if="open" class="version-dropdown floating" :style="floatStyle">
			<div v-for="version in versions"
					 :key="'version-' + version.Version.Id"
					 class="version-option"
					 :class="{ 'version-option-locked': isLast(version.Version.Id) }"
					 @click.stop="onToggle(version.Version.Id)">
				<input type="checkbox" class="version-checkbox" tabindex="-1"
							 :checked="isActive(version.Version.Id)"
							 :disabled="isLast(version.Version.Id)"
							 @click.prevent />
				<span>{{ version.Version.Name }}</span>
			</div>
		</div>
	</div>
	<span v-else class="version-text-single">{{ singleName }}</span>
</template>

<script>
import floatingDropdown from '@/table/components/floatingDropdown.js';

/*
 * VersionSelector — combo de años (censos) del indicador. Ofrece solo los
 * censos donde existe la variable lógica vigente (VersionsForVariable) y emite
 * 'toggle-version' con el id; el modelo agrega o quita esa selección.
 */
export default {
	name: 'VersionSelector',
	mixins: [floatingDropdown],
	props: {
		metric: { type: Object, required: true }
	},
	computed: {
		// Censos ofrecibles: donde existe la variable vigente.
		versions() { return this.metric.VersionsForVariable(this.metric.variableName()); },
		hasMultiple() { return this.versions.length > 1; },
		activeIds() { return this.metric.Selections.map(function (s) { return s.versionId(); }); },
		singleName() {
			var v = this.versions[0];
			return v && v.Version ? v.Version.Name : '—';
		},
		// Etiqueta: lista de años activos.
		label() {
			var active = this.metric.Selections.map(function (s) { return s.versionName(); });
			return active.length ? active.join(', ') : 'Ninguno';
		}
	},
	methods: {
		rootClass() { return 'version-selector'; },
		panelWidth() { return 200; },
		isActive(versionId) { return this.activeIds.indexOf(versionId) !== -1; },
		// El último censo activo no puede destildarse: siempre debe quedar uno.
		isLast(versionId) { return this.activeIds.length === 1 && this.activeIds[0] === versionId; },
		onToggle(versionId) {
			if (this.isLast(versionId)) return;
			this.$emit('toggle-version', versionId);
		}
	}
};
</script>

<style scoped>
	.version-selector {
		display: inline-flex;
	}
	.version-label-wrapper {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 0;
		background: none;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}
	.version-label-wrapper:hover {
		background-color: #2499ef;
	}
	.version-text-single {
		font-size: 12px;
		color: #424242;
	}
	.version-arrow {
		color: #ffffff;
		font-size: 18px;
		line-height: 1;
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
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		cursor: pointer;
		font-size: 12px;
		color: #424242;
		text-align: left;
		transition: background-color 0.15s ease;
		white-space: nowrap;
	}
	.version-option:hover {
		background-color: #f5f5f5;
	}
	.version-option-locked {
		opacity: 0.55;
		cursor: default;
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
