<template>
	<div>
		<mp-confirm ref="confirmDialog" :title="confirmTitle"
								:text="confirmQuestion"
								@confirm="confirmed"></mp-confirm>
		<md-snackbar id="snackbar" class="" :md-active.sync="showDialog" md-position="left">
			<div>
				<img :src="asset" style="position: absolute; top: 11px">
				<div style="width: 220px; margin-left: 35px;">
					{{ message }}
				</div>
			</div>
		</md-snackbar>
	</div>
</template>
<script>
	import axios from 'axios';

	export default {
		name: 'Invoker',
		data() {
			return {
				showDialog: false,
				confirmTitle: '',
				confirmQuestion: '',
				confirmCallback: null,
				message: 'Aguarde por favor...',
			};
		},
		computed: {
			ErrorSignaled() {
				return window.Context.ErrorSignaled.value;
			},
			asset() {
				return require('@/backoffice/assets/spinner.gif').default;
			}
		},
		methods: {
			confirmDo(title, message, context, method, args) {
				const loc = this;
				var paramtersFromArgs = Array.prototype.slice.call(arguments, 4);
				paramtersFromArgs.unshift(context, method);
				this.confirm(title, message, function () {
					return loc.do.apply(loc, paramtersFromArgs);
				});
			},
			confirm(title, message, callback) {
				this.confirmTitle = title;
				if (message.endsWith('.') === false) {
					message += '.';
				}
				this.confirmQuestion = message;
				this.confirmCallback = callback;
				this.$refs.confirmDialog.show();
			},
			confirmed() {
				if (this.confirmCallback) {
					this.confirmCallback();
					this.confirmCallback = null;
				}
			},
			doBackground(context, method, args) {
				var paramtersFromArgs = Array.prototype.slice.call(arguments, 2);
				return this.doInvoke(false, context, method, paramtersFromArgs);
			},
			doSave(context, method, args) {
				this.message = 'Guardando...';
				var paramtersFromArgs = Array.prototype.slice.call(arguments, 2);
				return this.doInvoke(true, context, method, paramtersFromArgs);
			},
			doMessage(message, context, method, args) {
				this.message = message;
				if (!this.message.endsWith('...')) {
					this.message += "...";
				}
				var paramtersFromArgs = Array.prototype.slice.call(arguments, 3);
				return this.doInvoke(true, context, method, paramtersFromArgs);
			},
			do(context, method, args) {
				var paramtersFromArgs = Array.prototype.slice.call(arguments, 2);
				return this.doInvoke(true, context, method, paramtersFromArgs);
			},
			doInvoke(showDialog, context, method, paramtersFromArgs) {
				const loc = this;
				this.showDialog = showDialog;
				var promise = method.apply(context, paramtersFromArgs);
				if (promise === null || promise === undefined || promise.then === undefined) {
					throw new Error("La llamada no devolvió un objeto 'promise'. Invoker.do() espera que el método devuelve un 'promise'. AxiosClient.getPromise y AxiosClient.postPromise son recomendados para generar esto en forma automática.");
				}
				return promise.then(function (res) {
					loc.showDialog = false;
					return res;
				});
			},
			call(method, args) {
				const loc = this;
				this.showDialog = true;
				if (args !== null && args !== undefined) {
					method(args, () => {
						loc.showDialog = false;
					});
				} else {
					method(() => {
						loc.showDialog = false;
					});
				}
			},
		},
		watch: {
			ErrorSignaled(signaled) {
				this.showDialog = false;
			},
		}
	};
</script>
