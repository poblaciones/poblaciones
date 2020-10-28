<template>
	<div v-if="showDialog" :transition="transition">
		<div class="modal" @click.self="clickMask">
			<div class="modal-dialog" :class="modalClass" @click.self="clickMask" ref="dialog">
				<div class="modal-content card">
					<!--Header-->
					<div class="modal-header mpHeader unselectable">
						<slot name="header">
						<a v-if="showClose" type="button" class="close" style="padding: 3px; margin-right: 2px;" @click="cancel">x</a>
						<h5 class="title">
							<slot name="title">
								<img src="/static/img/spinner.gif" class="waitImg" v-if="!hasBody" />
								{{ title }}
							</slot>
						</h5>
						</slot>
					</div>
					<!--Container-->
					<div class="modal-body" v-if="hasBody">
						<slot></slot>
					</div>
					<!--Footer-->
					<div class="modal-footer" v-if="showOk">
						<slot name="footer">
						<button v-if="showCancel" type="button" :class="cancelClass" @click="cancel">{{ cancelText }}</button>
						<button type="button" :class="okClass" @click="ok">{{ okText }}</button>
						</slot>
					</div>
				</div>
			</div>
		</div>
		<div class="modal-backdrop in"></div>
	</div>
</template>

<script>
/**
 * Bootstrap Style Modal Component for Vue
 * Depend on Bootstrap.css
 */
export default {
	props: {
		showCancel: {
			type: Boolean,
			default: true
		},
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
		small: {
			type: Boolean,
			default: false
		},
		large: {
			type: Boolean,
			default: false
		},
		full: {
			type: Boolean,
			default: false
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
			default: 'btn blue'
		},
		cancelClass: {
			type: String,
			default: 'btn red btn-outline'
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
	computed: {
		modalClass () {
			return {
				'modal-lg': this.large,
				'modal-sm': this.small,
				'modal-full': this.full
			};
		}
	},
	created () {
		if (this.showDialog) {
			document.body.className += ' modal-open';
		}
		window.addEventListener('keydown', this.keyProcess);
	},
	beforeDestroy () {
		window.removeEventListener('keydown', this.keyProcess);
		document.body.className = document.body.className.replace(/\s?modal-open/, '');
	},
	watch: {
		showDialog (value) {
			if (value) {
				document.body.className += ' modal-open';
			} else {
				if (!this.duration) {
					this.duration = window.getComputedStyle(this.$refs.dialog)['transition-duration'].replace('s', '') * 1000;
				}

				window.setTimeout(() => {
					document.body.className = document.body.className.replace(/\s?modal-open/, '');
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
		keyProcess(e) {
			if (this.showDialog) {
				if (e.key === "Escape") {
					this.showDialog = false;
				}
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
.modal {
	display: table;
  height: 100%;
	width: 100%;
}
.modal-dialog {
	display: table-cell;
	vertical-align: middle;
  max-width: 610px;
	width: 610px;
}
.modal-content {
	max-height: 100%;
  overflow-y: auto;
	overflow-x: hidden;
  margin: 0 auto;
  max-width: 610px;
}

.modal-enter .modal-backdrop, .modal-leave .modal-backdrop {
	opacity: 0;
}

.mpHeader {
	padding: 8px!important;
  padding-left: 12px!important;
}
.mpHeaderClose {
	margin-top: 0px;
	padding: 3px;
  margin-right: 2px;
}
.modal-transition {
	transition: all .6s ease;
}
.modal-leave {
	border-radius: 1px !important;
}
.modal-transition .modal-dialog, .modal-transition .modal-backdrop {
	transition: all .5s ease;
}
.modal-enter .modal-dialog, .modal-leave .modal-dialog {
	opacity: 0;
	transform: translateY(-30%);
}

.waitImg {
	float: left;
	padding-right: 8px;
  padding-bottom: 1px;
  margin-top: 1px;
  margin-bottom: -1px;
}
</style>

