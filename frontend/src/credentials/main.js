import Vue from 'vue';

import 'normalize.css/normalize.css'; // A modern alternative to CSS resets

import '@/backoffice/styles/index.scss'; // global css
import Db from './classes/Db';
import axios from 'axios';

import App from './App';
import router from './router/router.js';
import Context from '@/credentials/classes/Context';

//Material Design
import VueMaterial from 'vue-material';
import 'vue-material/dist/vue-material.css';
import 'vue-material/dist/theme/default.css';

import VTooltip from 'v-tooltip';
import VueRouter from 'vue-router';
import Vuelidate from 'vuelidate';

Vue.use(VueMaterial);
Vue.use(VTooltip);
Vue.use(VueRouter);

Vue.use(Vuelidate);

Vue.component('router-view', Vue.options.components.RouterView);

// Globales propios
import Invoker from '@/backoffice/components/Invoker';
import MpText from '@/backoffice/components/MpText';
import MpColorPicker from '@/common/components/MpColorPicker';
import MpInput from '@/common/components/MpInput';
import MpWait from '@/common/components/MpWait';
import MpAlert from '@/backoffice/components/MpAlert';
import MpConfirm from '@/backoffice/components/MpConfirm';
import MpLargeButton from '@/backoffice/components/MpLargeButton';
import MpSimpleText from '@/backoffice/components/MpSimpleText';
import MpHelp from '@/backoffice/components/MpHelp';
import MpSelect from '@/backoffice/components/MpSelect';

Vue.component('invoker', Invoker);
Vue.component('mp-input', MpInput);
Vue.component('mp-select', MpSelect);
Vue.component('mp-confirm', MpConfirm);
Vue.component('mp-alert', MpAlert);
Vue.component('mp-wait', MpWait);
Vue.component('mp-text', MpText);
Vue.component('mp-large-button', MpLargeButton);
Vue.component('mp-help', MpHelp);
Vue.component('mp-color-picker', MpColorPicker);
Vue.component('mp-simple-text', MpSimpleText);

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
window.Db = new Db();

var sharedObject = new Context();
var tmpVm = new Vue({ data: { sharedObject } });
window.Context = tmpVm.sharedObject;

// enable axios post cookie, default false
axios.defaults.withCredentials = true;

Vue.config.productionTip = false;

const store = window.Context.CreateStore();

var appCred = new Vue({
	el: '#wrapper',
	router,
	store,
	template: '<App/>',
	components: { App }
});
