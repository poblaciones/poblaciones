<template>
	<div v-if="showDialog" :transition="transition">
		<div class="mp-modal" @click.self="clickMask">
			<div class="mp-modal__dialog" @click.self="clickMask" ref="dialog">
				<div class="mp-modal__content mp-surface" :style="(maxHeight ? 'height: ' + maxHeight + ';': '') + (maxWidth ? 'max-width: ' + maxWidth + 'px' : '')">
					<!--Header-->
					<div class="mp-modal__header unselectable">
						<slot name="header">

							<h5 class="titleDialog">
								<mp-close-button @click="cancel" title="Cerrar"
																 v-if="showClose" class="exp-hiddable-block" />
								<slot name="title">
									<img src="/static/img/spinner.gif" class="waitImg" v-if="!hasBody" />
									{{ title }}
								</slot>
							</h5>
						</slot>
					</div>
					<!--Container-->
					<div class="mp-modal__body" :class="bodyClass" v-if="hasBody">
						<slot></slot>
					</div>
					<!--Footer-->
					<div class="mp-modal__footer" v-if="showOk">
						<slot name="footer">
						<button v-if="showCancel" type="button" :class="cancelClass" @click="cancel">{{ cancelText }}</button>
						<button type="button" :class="okClass" @click="ok">{{ okText }}</button>
						</slot>
					</div>
				</div>
			</div>
		</div>
		<div class="mp-modal__backdrop" @click="clickMask"></div>
	</div>
</template>

<script>
/**
 * Diálogo modal. Los estilos están en map/styles/surfaces.css (.mp-modal*).
 */
	import EscapeCloseHandler from '@/map/classes/EscapeCloseHandler';

	export default {
		props: {
			maxWidth: {
				type: Number,
			},
			maxHeight: {
				type: String,
				default: ''
			},
			bodyClass: {
				type: String,
				default: ''
			},
		showCancel: {
			type: Boolean,
			default: true
		},
		backgroundColor: {},
		showOk: {
			type: Boolean,
			default: true
		},
		showClose: {
			type: Boolean,
			default: true
		},
		hasBody: {
			type: Boolean,
			default: true
		},
		title: {
			type: String,
			default: 'Modal'
		},
		clickOutsideToClose: {
			type: Boolean,
			default: true
		},
		transition: {
			type: String,
			default: 'modal'
		},
		okText: {
			type: String,
			default: 'Aceptar'
		},
		cancelText: {
			type: String,
			default: 'Cancelar'
		},
		okClass: {
			type: String,
			default: 'mp-btn'
		},
		cancelClass: {
			type: String,
			default: 'mp-btn'
		},
		closeWhenOK: {
			type: Boolean,
			default: false
		}
	},
	data () {
		return {
			duration: null,
			showDialog: false,
		};
	},
	created () {
		this.escapeHandler = new EscapeCloseHandler(() => {
			if (this.showDialog) {
				this.showDialog = false;
			}
		}, { useHistory: true });
		if (this.showDialog) {
			document.body.className += ' mp-modal-open';
			this.escapeHandler.Open();
		}
	},
	beforeDestroy () {
		this.escapeHandler.Close();
		document.body.className = document.body.className.replace(/\s?mp-modal-open/, '');
	},
	watch: {
		showDialog (value) {
			if (value) {
				this.escapeHandler.Open();
				document.body.className += ' mp-modal-open';
			} else {
				this.escapeHandler.Close();
				if (!this.duration) {
					this.duration = window.getComputedStyle(this.$refs.dialog)['transition-duration'].replace('s', '') * 1000;
				}

				window.setTimeout(() => {
					document.body.className = document.body.className.replace(/\s?mp-modal-open/, '');
				}, this.duration || 0);
			}
		}
	},
	methods: {
		ok () {
			this.$emit('ok');
			if (this.closeWhenOK) {
				// this.showDialog = false;
			}
		},
		cancel () {
			this.$emit('cancel');
			this.showDialog = false;
		},
		show() {
			this.showDialog = true;
		},
		close() {
			this.showDialog = false;
		},
		hide() {
			this.showDialog = false;
		},
		clickMask () {
			if (this.clickOutsideToClose) {
				this.cancel();
			}
		}
	}
};
</script>

<style scoped>
.waitImg {
	float: left;
	padding-right: 8px;
	padding-bottom: 1px;
	margin-top: 1px;
	margin-bottom: -1px;
}
</style>
