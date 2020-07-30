<template>
	<div :class="this.classSize" style="margin-bottom: 20px;" v-on-clickaway="away">
		<div class="md-layout">
			<div v-show="editMode" class="md-layout-item md-size-75">
				<div class="md-layout">
					<div class="md-layout-item md-size-100" style="margin-bottom: 15px;">
						<label class="mpLabel">Tipo de licencia</label>
						<div>
							<md-radio ref="licenseType1" v-model="decoded.licenseType" :value="1">
								Creative Commons
								<mp-help :text="help" :large="true" />
							</md-radio>
							<md-radio v-model="decoded.licenseType" :value="0">No especificada</md-radio>
						</div>
					</div>

					<div v-show="decoded.licenseType === 1" class="md-layout">
						<div class="md-layout-item md-size-50 md-small-size-100">
								<label class="mpLabel">Versión</label>
								<div>
									<md-field style="margin-top: -8px;">
										<md-select v-model="decoded.licenseVersion" ref="versionSelect">
											<md-option v-for='i in licenseVersions' :key='i.key' :value='i.key'>
												{{ i.value }}
											</md-option>
										</md-select>
									</md-field>
								</div>
						</div>
						<div class="md-layout-item md-size-10 md-small-size-0">
						</div>
						<div class="md-layout-item md-size-40 md-small-size-100">
									<label class="mpLabel">Permitir uso comercial</label>
							<div>
								<md-radio v-model="decoded.licenseCommercial" :value="1">Sí</md-radio>
								<md-radio v-model="decoded.licenseCommercial" :value="0">No</md-radio>
							</div>
						</div>
						<div class="md-layout-item md-size-100">
							<label class="mpLabel">Permitir obras derivadas</label>
								<div>
									<md-radio v-model="decoded.licenseOpen" value="always">Sí</md-radio>
									<md-radio v-model="decoded.licenseOpen" value="never">No</md-radio>
									<md-radio v-model="decoded.licenseOpen" value="same">Sí, siempre que se comparta de la misma manera</md-radio>
								</div>
						</div>
					</div>
				</div>
			</div>

			<div v-show="!editMode" class="md-layout-item md-size-75">
				<div v-if="this.decoded.licenseType === 1">
					<div class="md-layout">
						<div class="md-layout-item md-size-100" style="padding-bottom: 10px;">
							{{ licenseCCTextualForm }}
						</div>
						<div class="md-layout-item">
							<a target="_blank" :href="ResolveUrl">
								<img :src="LicenseImageByUrl" />
							</a>
						</div>
						<div class="md-layout-item md-size-70" style="line-height: 1em; padding-left: 10px;">
							<small>
								Esta obra está bajo una licencia de Creative Commons.<br/>
								Para ver una copia de esta licencia, visite<br/>
								<a target="_blank" :href="ResolveUrl">{{ ResolveUrl }}</a>.
							</small>
						</div>
					</div>
				</div>
				<div v-else="">
					Licencia no especificada.
				</div>
			</div>

			<div v-if="canEdit" class="md-layout-item md-size-25" style="margin-top: -5px">
				<button-panel ref="buttonPanel"
			@onCancel="cancel" @onUpdate="Update" @onEditModeChange="ChangeEditableMode" @onFocus="focus"
						></button-panel>
			</div>
		</div>
	</div>
</template>

<script>

import ButtonPanel from './ButtonPanel';
import { mixin as clickaway } from 'vue-clickaway';
import str from '@/common/js/str';

export default {
  name: 'MpLicense',
	components: {
    ButtonPanel
	},
	mixins: [ clickaway ],
	methods: {
		cancel(oldValue) {
			this.localValue = this.value;
			this.decoded = JSON.parse(this.localValue);
		},
		ProcessTip(text) {
			if (text === undefined) {
				return '';
			}
			text = str.Replace(text, "<br>", "#__BR__#");
			var encoded = this.htmlEncode(text);
			var retext = str.Replace(encoded, "#__BR__#", "<br>");
			return retext;
		},
		CheckBluring(ele) {
			if (this.$refs.buttonPanel.HasFocus() === false
				&& ele !== this.$refs.licenseType1.$el
				) {
				if (this.valueChanged) {
          this.$refs.buttonPanel.showPrompt();
        } else {
          if (this.$refs.buttonPanel && this.$refs.buttonPanel.editableMode) {
            this.$refs.buttonPanel.Cancel();
          }
        }
      }
		},
		focus() {
     	this.$refs.licenseType1.$el.focus();
		},
		away() {
      if (this.$refs.buttonPanel && this.$refs.buttonPanel.editableMode) {
				if (this.valueChanged) {
          this.$refs.buttonPanel.showPrompt();
        } else {
          this.$refs.buttonPanel.Cancel();
        }
			}
    },
		receiveValue() {
			this.localValue = this.value;
			var decoded = JSON.parse(this.localValue);
			this.decoded = decoded;
		},
		ChangeEditableMode(mode) {
      this.editMode = mode;
		},
		htmlEncode(html ) {
	   return document.createElement( 'a' ).appendChild(
        document.createTextNode( html ) ).parentNode.innerHTML;
		},
		Update() {
			const REQUIRED = 'Debe indicar un valor.';
			/*if (this.decoded.licenseType === 2 && this.decoded.licenseText === '') {
				this.localError = REQUIRED;
				return false;
			}*/
			if (this.localError === REQUIRED) {
				this.localError = '';
			}
			this.localValue = JSON.stringify(this.decoded);
			this.$emit('value', this.localValue);
			this.$emit('input', this.localValue);
			this.$emit('update', this.localValue);
			return true;
		},
		UrlIsCC(url)
		{
			return (url.startsWith('http://creativecommons.')
				|| url.startsWith('http://www.creativecommons.')
				|| url.startsWith('https://creativecommons.')
				|| url.startsWith('https://www.creativecommons.'));
		}
  },
	computed: {
		classSize() {
			return 'md-layout-item md-size-' + (this.size ? this.size : 100);
		},
		valueChanged() {
			var current = JSON.stringify(this.decoded);
			return current !== this.value;
		},
		licenseCCTextualForm() {
			var ret = 'Licencia Creative Commons con atribución';
			if (this.decoded.licenseCommercial !== 1) {
				ret += ', para usos no comerciales';
			}
			if (this.decoded.licenseOpen === 'never') {
				ret += ', no permite obras derivadas';
			} else if (this.decoded.licenseOpen === 'same') {
				ret += ', permite obras derivadas si utilizan la misma licencia';
			} else {
				ret += ', permite obras derivadas';
			}
			if (this.decoded.licenseVersion === '') {
				ret += '. Atención: debe elegir una versión';
			} else {
				ret += ', versión ' + this.licenseVersionTextualForm;
			}
			return ret + '.';
		},
		licenseVersionTextualForm() {
			var versions = this.licenseVersions;
			for(var n = 0; n < versions.length; n++) {
				var license = versions[n];
				if (license.key === this.decoded.licenseVersion) {
					return license.value;
				}
			}
			return '[no identificada]';
		},
		ResolveUrl() {
			// pattern: https://creativecommons.org/licenses/by/2.5/ar/
			var ret = "https://creativecommons.org/licenses/by";
			var licenseType = this.decoded.licenseType;
			var licenseVersion = this.decoded.licenseVersion;
			var licenseCommercial = this.decoded.licenseCommercial;
			var licenseOpen = this.decoded.licenseOpen;
			if (licenseType === 0)
				return '';
			if (licenseType === 2)
				return licenseUrl;
			if (licenseCommercial !== 1)
				ret += '-nc';
			if (licenseOpen === 'never')
				ret += '-nd';
			else
				if (licenseOpen === 'same')
					ret += '-sa';
			ret += '/' + licenseVersion;
			return ret;
		},
		LicenseImageByUrl() {
			var url = this.ResolveUrl;
			if (this.UrlIsCC(url) == false)
				return '';
			var availables = ['by', 'by-nc', 'by-nc-nd', 'by-nc-sa', 'by-nd', 'by-sa'];
			for(var n = 0; n < availables.length; n++) {
				var image = availables[n];
				if (url.includes('/' + image + '/')) {
					return window.host + '/static/img/licenses/cc/' + image + '40.png';
				}
			}
			return '';
		},
		errorMessage() {
			var ret = '';
			if (this.error) {
				ret = this.error;
			}
			if (this.error && this.localError) {
				ret += '. ';
			}
			return ret + this.localError;
		},
		helperId() {
			return 'helper' + this._uid;
		},
		inputId() {
			return 'textControl' + this._uid;
		},
		licenseVersions() {
				return [{ key: '4.0/deed.es', value: 'Internacional 4.0 (recomendada)'},
								{ key: '4.0', value: 'Internacional 4.0 (inglés)'},
								{ key: '4.0/deed.pt', value: 'Internacional 4.0 (portugués)'},
								{ key: '', value: '-------- Otras versiones  -----------'},
								{ key: '2.5/ar', value: 'Argentina 2.5'},
								{ key: '3.0/br', value: 'Brasil 3.0'},
								{ key: '3.0/cl', value: 'Chile 3.0'},
								{ key: '2.5/co', value: 'Colombia 2.5'},
								{ key: '3.0/cr', value: 'Costa Rica 3.0'},
								{ key: '3.0/ec', value: 'Ecuador 3.0'},
								{ key: '3.0/es', value: 'España 3.0'},
								{ key: '3.0/ph', value: 'Filipinas 3.0'},
								{ key: '3.0/gt', value: 'Guatemala 3.0'},
								{ key: '2.5/mx', value: 'México 2.5'},
								{ key: '2.5/pe', value: 'Perú 2.5'},
								{ key: '3.0/pr', value: 'Puerto Rico 3.0'},
								{ key: '3.0/ve', value: 'Venezuela 3.0' }];
		},
		help() {
			return `<p>Licencias Creative Commons se basan en el derecho
								de autor y sirven para llevar la postura extrema de “Todos los derechos reservados” hacia
								una más flexible, de “Algunos derechos reservados” o, en algunos casos, “Sin derechos reservados”.
							</p><p>
								Estas licencias se pueden utilizar en casi cualquier obra creativa siempre que la misma se encuentre
								bajo derecho de autor y conexos, y pueden utilizarla tanto personas como instituciones.
							</p><p>
								Fuente: <a target='_blank' href='https://creativecommons.org.ar/faq'>https://creativecommons.org.ar/faq</a>
							</p><p>
								Más información: <a target='_blank' href='https://es.wikipedia.org/wiki/Creative_Commons'>https://es.wikipedia.org/wiki/Creative_Commons</a>
							</p>`;
		},
	},
	created() {
		this.localValue = this.value;
	},
	mounted() {
		var loc = this;
		this.$refs.licenseType1.$el.onblur = () => {
     setTimeout(() => {
				this.CheckBluring(document.activeElement);
      }, 75);
    };
		this.receiveValue();
	},
	data() {
		return {
			localValue: '',
			localError: '',
			editMode: false,
			decoded: {
					licenseType: 1,
					licenseCommercial: 0,
					licenseOpen: 'always',
					licenseVersion: '4.0/deed.es'
					}
		};
	},
  props: {
    label: String,
    size: String,
    error: String,
		canEdit: { type: Boolean, default: true },
		multiline: Boolean,
		rows: Number,
		maxlength: String,
    value: String,
		helper: String,
  },
	watch: {
	'value' () {
			if (this.valueChanged) {
				this.receiveValue();
			}
		}
	}


};
</script>
<style rel="stylesheet/scss" lang="scss" scoped>

.mp-text-label{
    padding-left: 0 !important;
		left: 0 !important;
		margin-bottom: 2px;
    line-height: 1.1em;
		color: #448aff!important;
		font-size: 14px!important;
}

.mp-area{
		left: 0 !important;
		margin-bottom: 2px;
		color: #448aff!important;
		font-size: 14px!important;
		border: 1px solid rgb(243, 243, 243);
    margin-top: 10px;
    margin-bottom: 5px;
		line-height: 1.3em;
    padding-top: 6px;
    padding-left: 6px !important;
}

.error {
	font-size: 11px;
}


</style>
