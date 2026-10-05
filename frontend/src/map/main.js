// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import '@/map/styles/foundation';
import Vue from 'vue';
import VueHotkey from 'v-hotkey';
import App from '@/map/App';
import axios from 'axios';
import 'vue-material-design-icons/styles.css';
import VTooltip from 'v-tooltip';
import Clipboard from 'v-clipboard';

import '@/map/styles';

// Bus para comunicación entre componentes
// usar window.bus.$emit y window.bus.$on
window.bus = new Vue();

// Settings
window.host = process.env.host;
if (window.host === '') {
	var host = window.location.protocol + '//' + window.location.hostname;
	if (window.location.port !== '' && window.location.port !== null) {
		host += ':' + window.location.port;
	}
	window.host = host;
}

window.ApplicationName = process.env.ApplicationName;
window.SegMap = null;

// enable axios post cookie, default false
axios.defaults.withCredentials = true;

import MpCloseButton from '@/map/components/controls/mpCloseButton';
import MpFilterBadge from '@/map/components/controls/mpFilterBadge';
import MpPartitionBadge from '@/map/components/controls/mpPartitionBadge';
import MpDropdownMenu from '@/map/components/controls/mpDropdownMenu';
import MpColorPicker from '@/common/components/MpColorPicker';
import MpLabel from '@/map/components/controls/mpLabel';
import VueMobileDetection from 'vue-mobile-detection';
import Vue2TouchEvents from 'vue2-touch-events';
import AriaPlugin from '@/common/framework/ariaPlugin';


Vue.component('mp-dropdown-menu', MpDropdownMenu);

Vue.component('mp-close-button', MpCloseButton);
Vue.component('mp-filter-badge', MpFilterBadge);
Vue.component('mp-partition-badge', MpPartitionBadge);
Vue.component('mp-label', MpLabel);
Vue.component('mp-color-picker', MpColorPicker);

Vue.use(Clipboard);
Vue.use(VTooltip);
Vue.use(VueMobileDetection);
Vue.use(Vue2TouchEvents);
Vue.use(AriaPlugin);

Vue.config.productionTip = false;
Vue.use(VueHotkey);

// La página de paletas se carga en un fragmento aparte para que no pese en el arranque del visor.
function isPalettePage() {
	var path = window.location.pathname.replace(/\/+$/, '');
	return path.endsWith('/paletas') || window.location.hash.startsWith('#/paletas');
}

function mountRoot(rootComponent) {
	var app = new Vue({
		el: '#wrapper',
		components: { App: rootComponent },
		template: '<App/>'
	});
	window.app = app;
}

if (isPalettePage()) {
	import('@/map/components/paletas/paletas').then(function (module) {
		mountRoot(module.default);
	});
} else {
	mountRoot(App);
}


