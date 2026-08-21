<template>
	<md-menu class="mpDropdownButton" :md-size="size" md-align-trigger>
		<md-button md-menu-trigger :disabled="disabled">
			<md-icon v-if="icon">{{ icon }}</md-icon>
			{{ label }}
			<md-icon class="mpDropdownCaret">arrow_drop_down</md-icon>
		</md-button>
		<md-menu-content class="mpDropdownContent">
			<slot></slot>
		</md-menu-content>
	</md-menu>
</template>

<script>
	export default {
		name: 'MpDropdownButton',
		props: {
			label: { type: String, default: '' },
			// Ícono opcional a la izquierda. Conviene que no sea una flecha, para
			// no repetir la forma del triángulo del desplegable.
			icon: { type: String, default: null },
			disabled: { type: Boolean, default: false },
			size: { type: String, default: 'small' }
		}
	};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
	/* Replica el margen de los md-button vecinos para que alinee con ellos. */
	.mpDropdownButton {
		margin: 6px 8px;
		margin-left: 0px;
		display: inline-block;
		vertical-align: middle;
	}

	.mpDropdownCaret {
		min-width: 0px;
		width: 16px;
	}
</style>

<!-- El contenido del menú se monta fuera del componente, por lo que sus
		 estilos no pueden ser scoped. La clase mpDropdownContent acota las
		 reglas a estos desplegables y no altera el resto de los menús. -->
<style rel="stylesheet/scss" lang="scss">
	.mpDropdownContent .md-list-item-content {
		min-height: 36px;
		font-size: 14px;
	}
</style>
