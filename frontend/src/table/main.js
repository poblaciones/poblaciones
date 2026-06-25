import Vue from 'vue';

import 'normalize.css/normalize.css';

import '@/backoffice/styles/index.scss';
import 'vue2-animate/dist/vue2-animate.min.css';
import Db from './classes/Db';
import axios from 'axios';

import App from './App';
import Context from '@/table/classes/Context';

import VueMaterial from 'vue-material';
import 'vue-material/dist/vue-material.css';
import 'vue-material/dist/theme/default.css';

import VTooltip from 'v-tooltip';
import Vuelidate from 'vuelidate';

Vue.use(VueMaterial);
Vue.use(VTooltip);
Vue.use(Vuelidate);

import Invoker from '@/backoffice/components/Invoker';
import MpWait from '@/common/components/MpWait';
import MpConfirm from '@/backoffice/components/MpConfirm';

Vue.component('invoker', Invoker);
Vue.component('mp-wait', MpWait);
Vue.component('mp-confirm', MpConfirm);

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
window.Context.ServerLoaded = false;
window.Messages = tmpVm;

axios.defaults.withCredentials = true;

Vue.config.productionTip = false;

const store = window.Context.CreateStore();

var appTable = new Vue({
	el: '#wrapper',
	store,
	template: '<App/>',
	components: { App }
});
