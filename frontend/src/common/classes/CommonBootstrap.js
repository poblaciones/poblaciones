import 'normalize.css/normalize.css';
import axios from 'axios';

import VueMaterial from 'vue-material';
import 'vue-material/dist/vue-material.css';
import 'vue-material/dist/theme/default.css';
import VTooltip from 'v-tooltip';
import VueHotkey from 'v-hotkey';
import VueRouter from 'vue-router';
import Clipboard from 'v-clipboard';

import '@/backoffice/styles/index.scss';

// No-mp, siguen viviendo en backoffice porque no empiezan con "Mp"
import TitleBar from '@/backoffice/views/Layout/TitleBar';
import Stepper from '@/backoffice/components/Stepper';
import Invoker from '@/backoffice/components/Invoker';

// Mp* movidos a common
import MpConfirm from '@/common/components/MpConfirm';
import MpCopy from '@/common/components/MpCopy';
import MpWait from '@/common/components/MpWait';
import MpAlert from '@/common/components/MpAlert';
import MpInput from '@/common/components/MpInput';
import MpText from '@/common/components/MpText';
import MpSearch from '@/common/components/MpSearch';
import MpColorPicker from '@/common/components/MpColorPicker';
import MpSimpleText from '@/common/components/MpSimpleText';
import MpImageUpload from '@/common/components/MpImageUpload';
import MpFileUpload from '@/common/components/MpFileUpload';
import MpLargeButton from '@/common/components/MpLargeButton';
import MpSelect from '@/common/components/MpSelect';
import MpGrid from '@/common/components/MpGrid';
import MpHelp from '@/common/components/MpHelp';

export default class CommonBootstrap {
	/** Plugins que usan los 4 módulos (VueMaterial, VTooltip, VueHotkey). */
	static InstallCorePlugins(Vue) {
		Vue.use(VueMaterial);
		Vue.use(VTooltip);
		Vue.use(VueHotkey);
	}

	/** Solo para módulos con router (todos menos table). */
	static InstallRouter(Vue) {
		Vue.use(VueRouter);
		Vue.component('router-view', Vue.options.components.RouterView);
	}

	/**
	 * Componentes/plugins mínimos que usan los módulos.
	 * Incluye Clipboard + mp-copy aunque hoy no se usen en todos,
	 * para que estén siempre disponibles sin tener que repetir el import.
	 */
	static RegisterBaseComponents(Vue) {
		Vue.use(Clipboard);
		Vue.component('invoker', Invoker);
		Vue.component('mp-confirm', MpConfirm);
		Vue.component('mp-copy', MpCopy);
		Vue.component('mp-wait', MpWait);
	}

	/** Set "completo" que comparten main / admins / packs / credentials. */
	static RegisterExtendedComponents(Vue) {
		Vue.component('title-bar', TitleBar);
		Vue.component('stepper', Stepper);
		Vue.component('mp-select', MpSelect);
		Vue.component('mp-grid', MpGrid);
		Vue.component('mp-search', MpSearch);
		Vue.component('mp-text', MpText);
		Vue.component('mp-help', MpHelp);
		Vue.component('mp-color-picker', MpColorPicker);
		Vue.component('mp-simple-text', MpSimpleText);
		Vue.component('mp-image-upload', MpImageUpload);
		Vue.component('mp-file-upload', MpFileUpload);
		Vue.component('mp-large-button', MpLargeButton);
		Vue.component('mp-alert', MpAlert);
		Vue.component('mp-input', MpInput);
	}

	static SetupWindow() {
		window.host = process.env.host;
		if (window.host === '') {
			var host = window.location.protocol + '//' + window.location.hostname;
			if (window.location.port !== '' && window.location.port !== null) {
				host += ':' + window.location.port;
			}
			window.host = host;
		}
		window.ApplicationName = process.env.ApplicationName;
	}

	static SetupAxios() {
		axios.defaults.withCredentials = true;
	}

	/**
	 * Punto de entrada único. Resuelve plugins, componentes y settings.
	 * @param {*} Vue
	 * @param {Object} options
	 * @param {boolean} options.router     - Instala VueRouter + router-view (default true).
	 * @param {boolean} options.extended   - Registra el set extendido de mp-* (default true).
	 *   Los módulos "livianos" (ej: table, sin router ni set extendido) pasan { router: false, extended: false }.
	 */
	static Init(Vue, { router = true, extended = true } = {}) {
		this.InstallCorePlugins(Vue);
		if (router) {
			this.InstallRouter(Vue);
		}
		this.RegisterBaseComponents(Vue);
		if (extended) {
			this.RegisterExtendedComponents(Vue);
		}
		this.SetupWindow();
		this.SetupAxios();
		Vue.config.productionTip = false;
	}
}
