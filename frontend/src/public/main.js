// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import VueHotkey from 'v-hotkey';
import App from '@/public/App';
import axios from 'axios';
import 'vue-material-design-icons/styles.css';
import VTooltip from 'v-tooltip';
import Clipboard from 'v-clipboard';

import "leaflet/dist/leaflet.css";
import 'axios-progress-bar/dist/nprogress.css';

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

import MpCloseButton from '@/public/components/controls/mpCloseButton';
import MpFilterBadge from '@/public/components/controls/mpFilterBadge';
import MpPartitionBadge from '@/public/components/controls/mpPartitionBadge';
import MpDropdownMenu from '@/public/components/controls/mpDropdownMenu';
import MpColorPicker from '@/common/components/MpColorPicker';
import MpLabel from '@/public/components/controls/mpLabel';
import VueMobileDetection from 'vue-mobile-detection';

Vue.component('mp-dropdown-menu', MpDropdownMenu);

Vue.component('mp-close-button', MpCloseButton);
Vue.component('mp-filter-badge', MpFilterBadge);
Vue.component('mp-partition-badge', MpPartitionBadge);
Vue.component('mp-label', MpLabel);
Vue.component('mp-color-picker', MpColorPicker);

Vue.use(Clipboard);
Vue.use(VTooltip);
Vue.use(VueMobileDetection);

Vue.config.productionTip = false;
Vue.use(VueHotkey);

var app = new Vue({
	el: '#wrapper',
	components: { App },
	template: '<App/>'
});
window.app = app;


