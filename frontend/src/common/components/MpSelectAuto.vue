<!--
	Desplegable de valor con un modo automático al pie.

	Se comporta como un mp-select común: el campo muestra el valor activo y la lista
	permite elegir otro. La diferencia es el elemento del pie, separado por una línea, que
	no es un valor sino un interruptor: alterna el modo automático sin tocar la selección,
	y aparece tildado cuando está activo. Elegir un valor de la lista desactiva el modo,
	que es la manera natural de tomar el control manual.

	Ese elemento NO es un md-option, a propósito. md-select trata a cada md-option como un
	valor del modelo: al tocarlo actualiza el v-model y cierra el panel, de modo que un
	interruptor implementado como opción obliga a revertir la selección después del hecho,
	pelea con el estado interno del control y termina no registrando el clic. Un nodo
	propio dentro del panel se renderiza igual pero queda fuera de esa mecánica, y el clic
	se maneja acá.

	Mientras el modo está activo, el valor se muestra atenuado y la etiqueta del campo lo
	aclara: el valor sigue existiendo y aplicándose, pero no es el usuario quien lo elige.
-->
<template>
	<div style="margin-bottom: 20px;">
		<md-field :class="{ 'mpAutoDimmed': isAuto }">
			<label class="mp-label">{{ effectiveLabel }}</label>
			<md-select :title="format(currentObjectSelected)" md-dense
								 md-class="mpAutoSelectMenu"
								 v-model="localSelectValue" ref="input"
								 :disabled="isDisabled">
				<md-option v-for="item in list" :key="item[listKey]" :value="item[listKey]">
					{{ format(item) }}
				</md-option>
				<div class="mpAutoRow" :class="{ 'mpAutoRowOn': isAuto }"
						 @click.stop="toggleAuto" @mousedown.stop>
					<span>{{ autoLabel }}</span>
					<md-icon v-if="isAuto" class="mpAutoTick">check</md-icon>
				</div>
			</md-select>
		</md-field>
		<div v-if="helper" style="line-height: 1em; margin-top: -7px;">
			<span class="md-helper-text helper">{{ helper }}</span>
		</div>
	</div>
</template>

<script>
	export default {
		name: 'MpSelectAuto',
		props: {
			label: String,
			list: Array,
			listKey: { type: String, default: 'Id' },
			listCaption: { type: String, default: 'Caption' },
			// Valor activo. Sigue existiendo y aplicándose tanto en modo manual como en
			// automático; en automático lo fija el generador de escalas.
			value: {},
			// Estado del modo automático. Se acepta cualquier valor y se normaliza, porque
			// el servidor puede enviar el booleano como 0/1.
			autoValue: { default: true },
			autoLabel: { type: String, default: 'Automático' },
			// Sufijo que se agrega a la etiqueta del campo mientras el modo está activo.
			autoLabelSuffix: { type: String, default: ' (automático)' },
			render: { type: Function, default: null },
			canEdit: { type: Boolean, default: true },
			helper: String,
		},
		data() {
			return {
				localSelectValue: ''
			};
		},
		computed: {
			isAuto() {
				// undefined significa que la propiedad todavía no llegó del servidor: vale el
				// default de la entidad, que es modo automático.
				if (this.autoValue === undefined || this.autoValue === null) {
					return true;
				}
				return this.autoValue === true || this.autoValue === 1 || this.autoValue === '1';
			},
			isDisabled() {
				return !this.canEdit || this.$attrs.disabled;
			},
			effectiveLabel() {
				return this.label + (this.isAuto ? this.autoLabelSuffix : '');
			},
			currentObjectSelected() {
				const n = this.findById(this.localSelectValue);
				return (n !== -1 ? this.list[n] : null);
			}
		},
		methods: {
			toggleAuto() {
				if (this.isDisabled) {
					return;
				}
				this.$emit('auto-change', !this.isAuto);
				this.closeDropdown();
			},
			closeDropdown() {
				// vue-material no expone un método público para cerrar el panel, y la bandera
				// que lo controla cambió de lugar entre versiones: en unas vive en el propio
				// md-select y en otras en el md-menu que usa por dentro. Se prueban las dos y
				// se ignora la que no exista.
				const select = this.$refs.input;
				if (!select) {
					return;
				}
				if (typeof select.showSelect !== 'undefined') {
					select.showSelect = false;
				}
				const menu = (select.$children || []).find(
					child => child.$options && child.$options.name === 'MdMenu');
				if (menu) {
					menu.$emit('update:mdActive', false);
				}
			},
			findById(val) {
				if (!this.list) {
					return -1;
				}
				for (let i = 0; i < this.list.length; i++) {
					if (val === this.list[i][this.listKey]) {
						return i;
					}
				}
				return -1;
			},
			format(item) {
				if (item === null || item === undefined) {
					return '';
				} else if (this.render) {
					return this.render(item);
				} else {
					return item[this.listCaption];
				}
			},
			receiveValue() {
				if (this.value !== this.localSelectValue) {
					this.localSelectValue = this.value;
				}
			}
		},
		watch: {
			'value'() {
				this.receiveValue();
			},
			'localSelectValue'(nuevo) {
				if (nuevo === this.value) {
					return;
				}
				// Elegir un valor concreto es la manera natural de tomar el control manual.
				if (this.isAuto) {
					this.$emit('auto-change', false);
				}
				this.$emit('input', nuevo);
			}
		},
		created() {
			this.receiveValue();
		}
	};
</script>

<style rel="stylesheet/scss" lang="scss">
	/* El panel del desplegable se monta fuera del componente, por lo que estos estilos no
		 pueden ser scoped. Las clases acotan las reglas a este control. */

	/* Ancho del panel. Sin esto vue-material lo dimensiona por el contenido y queda mucho
		 más ancho que el campo. Si hiciera falta ajustarlo, es este único valor. */
	.mpAutoSelectMenu.md-menu-content {
		min-width: 0 !important;
		max-width: 180px !important;
	}

	.mpAutoRow {
		display: flex;
		align-items: center;
		justify-content: space-between;
		/* Replica la métrica de los md-option vecinos para que no se note el cambio de nodo. */
		min-height: 36px;
		padding: 0 16px;
		font-size: 14px;
		cursor: pointer;
		user-select: none;
		border-top: 1px solid rgba(0, 0, 0, .12);
		color: rgba(0, 0, 0, .87);
	}

	.mpAutoRow:hover {
		background-color: rgba(0, 0, 0, .06);
	}

	.mpAutoRowOn {
		font-weight: 500;
	}

	.mpAutoTick {
		font-size: 18px !important;
		min-width: 18px !important;
		width: 18px !important;
		height: 18px !important;
		margin-right: 0px !important;
	}

	/* Valor atenuado mientras el modo automático está activo: el valor se aplica, pero no
		 es editable en el sentido de que no lo elige el usuario. */
	.mpAutoDimmed .md-input,
	.mpAutoDimmed .md-select-value {
		color: rgba(0, 0, 0, .38) !important;
		-webkit-text-fill-color: rgba(0, 0, 0, .38) !important;
	}
</style>
