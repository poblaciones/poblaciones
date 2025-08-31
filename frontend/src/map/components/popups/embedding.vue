<template>
	<Modal title="Insertar mapa" ref="dialog" :showCancel="false" :showOk="false"
				 :backgroundColor="backgroundColor" :maxWidth="900">
		<div>
			<div style="padding: 5px 0px 20px 0px">Para incluir este mapa en otro sitio puede copiar el siguiente HTML y pegarlo en el código fuente de la página.</div>
		</div>
		<div style="display: flex">
			<div v-html="localUrl" style="width: 562px; margin-bottom: 10px; height: 317px; overflow: hidden; border: 1px solid rgb(191,191,191); border-radius: 4px;">
			</div>
			<div style="padding: 0px 10px 10px 10px;">
				<div class="itemSemiRow">
					<textarea v-model="url" id="testing-code" class="textCopyArea"
										autocorrect="off"
										autocapitalize="off" spellcheck="false"
										style="resize: none; word-break: break-all; width: 285px; height: 106px;" />
				</div>
				<div class="itemRow">
					<button type="button" class="copy iframe" @click="copyIframeCode()">Copiar</button>
				</div>
				<div class="itemRow popupSubTitle">
					Opciones de inserción
				</div>
				<div class="itemRow">
					<buttonGroup v-model="size" @change="UpdateUrls" :items="{ 'Compacto (560x315)': 0, 'Grande (1120x630)': 1 }" />
				</div>
				<div class="itemRow">
					<buttonGroup v-model="isStatic" @change="UpdateUrls" :items="{ 'Navegable': false, 'Estático': true }" />
				</div>
				<div class="itemRow" v-if="size===1 && !isStatic">
					<input type="checkbox" v-model="showSearch" /> Buscar
					<input type="checkbox" v-model="showAddMetrics" /> Agregar indicadores
				</div>
				<div style="width: 285px">
					<span v-if="size===1">
						<input type="checkbox" v-model="showSidePanel" /> Panel derecho
					</span>
					<span v-if="isStatic">
						<input type="checkbox" v-model="openOnClick" /> Abrir mapa navegable al hacerse click
					</span>
				</div>
			</div>
			</div>
	</Modal>
</template>

<script>
import str from '@/common/framework/str';
import Modal from '@/map/components/popups/modal';
	import buttonGroup from '@/map/components/controls/buttonGroup';


export default {
  name: "embedded",
	components: {
		Modal,
		buttonGroup
	},
	props: [
		'backgroundColor'
	],
  data() {
		return {
			href: null,
			url: null,
			openOnClick: true,
			showAddMetrics: true,
			showSidePanel: true,
			showSearch: true,
			localUrl: null,
			size: 0,
			isStatic: false,
			sizes: [{ width: 560, height: 315 }, { width: 1120, height: 630 }],
    };
  },
  computed: {
	},
	methods: {
		UpdateUrls() {
			var href = this.href;
			if (this.size === 0) {
				href = this.changeZoom(href, -1);
			}
			var url = str.AppendParam(href, 'emb', 1);

			// agrega las demás
			var scale = '';
			if (this.size === 1) {
				if (!this.isStatic) {
					if (!this.showSearch) {
						url = str.AppendParam(url, 'ns', 1);
					}
					if (!this.showAddMetrics) {
						url = str.AppendParam(url, 'na', 1);
					}
				}
				if (!this.showSidePanel) {
					url = str.AppendParam(url, 'np', 1);
				}
				scale = 'transform: scale(0.5); transform-origin: 0 0;';
			} else {
				// compacto
				url = str.AppendParam(url, 'co', 1);
				// saca el /f= del panel abierto
				var argStart = url.indexOf('#');
				if (argStart > 0) {
					var fStart = url.indexOf('/f=', argStart);
					if (fStart > 0) {
						var fEnd = url.indexOf('/', fStart);
						if (fEnd === -1) {
							fEnd = url.length;
						}
						url = url.substr(0, fEnd);
					}
				}
			}
			var tabindex = '';
			// estático?
			if (this.isStatic) {
				url = str.AppendParam(url, 'ro', 1);
				if (this.openOnClick) {
					url = str.AppendParam(url, 'oc', 1);
				} else {
					tabindex = "tabindex='-1' ";
				}
			}
			var frame = "<iframe width='" + this.sizes[this.size].width + "' height='" + this.sizes[this.size].height + "' frameborder='0'" +
													" src='" + url + "' ";
			this.url = frame + tabindex + "></iframe>";
			this.localUrl = frame + "tabindex='-1' style='" + scale + "; pointer-events: none' />";
    },
		show() {
			this.href = window.location.href;
			this.UpdateUrls();
			this.$refs.dialog.show();
		},
		changeZoom(href, delta) {
			var z = href.lastIndexOf('z');
			var sep = href.lastIndexOf(',', z);
			var zi = parseInt(href.substr(sep + 1, z - sep - 1));
			var newHref = href.substr(0, sep + 1) + (zi + delta) + href.substr(z);
			return newHref;
		},
    copyIframeCode() {
      let testingCodeToCopy = document.querySelector("#testing-code");
      testingCodeToCopy.select();
      var successful = document.execCommand("copy");
      var msg = successful ? "successful" : "unsuccessful";
      //console.log(msg);
      window.getSelection().removeAllRanges();
		},
		},
		watch: {
			showSidePanel() {
				this.UpdateUrls();
			},
			openOnClick() {
				this.UpdateUrls();
			},
			showAddMetrics() {
				this.UpdateUrls();
			},
			showSearch() {
				this.UpdateUrls();
			},
		}
};
</script>

<style scoped lang="scss">

	.itemSemiRow {
		padding-bottom: 5px;
	}
	.itemRow {
		padding-bottom: 10px;
	}
	.textCopyArea {
		color: #606060;
		font-family: Roboto mono, monospace;

	}
</style>
