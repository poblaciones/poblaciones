<template>
  <div>
		<mp-confirm ref="confirmDialog" :title="confirmTitle"
				:text="confirmQuestion"
				@confirm="confirmed"></mp-confirm>

		<md-dialog :md-active.sync="showDialog" style="min-width: 280px !important"
							 :md-click-outside-to-close="false">
      <md-dialog-title>Aguarde por favor...</md-dialog-title>
      <md-progress-bar md-mode="indeterminate"></md-progress-bar>
    </md-dialog>
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
			confirmCallback: null
    };
  },
	computed: {
		ErrorSignaled() {
			return window.Context.ErrorSignaled.value;
		}
	},
  methods: {
		confirmDo(title, message, context, method, args) {
			var loc = this;
      var paramtersFromArgs = Array.prototype.slice.call(arguments, 4);
			paramtersFromArgs.unshift(context, method);
			this.confirm(title, message, function() {
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
			if (this.confirmCallback !== null) {
				this.confirmCallback();
				this.confirmCallback = null;
			}
		},
		doBackground(context, method, args) {
      var paramtersFromArgs = Array.prototype.slice.call(arguments, 2);
			return this.doInvoke(false, context, method, paramtersFromArgs);
		},
		do(context, method, args) {
      var paramtersFromArgs = Array.prototype.slice.call(arguments, 2);
			return this.doInvoke(true, context, method, paramtersFromArgs);
		},
		doInvoke(showDialog, context, method, paramtersFromArgs) {
      var self = this;
			this.showDialog = showDialog;
			var promise =	method.apply(context, paramtersFromArgs);
			if (promise === null || promise === undefined || promise.then === undefined) {
				throw new Error("La llamada no devolvió un objeto 'promise'. Mapas->Invoker.do() espera que el método devuelve un 'promise'. AxiosClient.getPromise y AxiosClient.postPromise son recomendados para generar esto en forma automática.");
			}
			return promise.then(function (res) {
					self.showDialog = false;
					return res;
				});
		},
    call(method, args){
      var self = this;
      this.showDialog = true;
      if (args !== null && args !== undefined) {
        method(args, () => {
            self.showDialog = false;
          }
        );
      } else {
        method(() => {
            self.showDialog = false;
          }
        );
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

<style lang='scss' scoped>
.md-progress-bar {
  margin: 24px;
}
</style>
