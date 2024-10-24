import Vue from 'vue';

import 'normalize.css/normalize.css'; // A modern alternative to CSS resets

import '@/backoffice/styles/index.scss'; // global css
import Db from '@/backoffice/classes/Db';
import axios from 'axios';

import App from './App';
import router from './router/router.js';
import Context from '@/backoffice/classes/Context';

//Material Design
import VueMaterial from 'vue-material';
import 'vue-material/dist/vue-material.css';
import 'vue-material/dist/theme/default.css';

Vue.use(VueMaterial);
Vue.component('router-link', Vue.options.components.RouterLink);
Vue.component('router-view', Vue.options.components.RouterView);

// Globales propios
import TitleBar from '@/backoffice/views/Layout/TitleBar';
import Stepper from '@/backoffice/components/Stepper';
import Invoker from '@/backoffice/components/Invoker';
import MpText from '@/backoffice/components/MpText';
import MpSearch from '@/backoffice/components/MpSearch';
import MpColorPicker from '@/common/components/MpColorPicker';
import MpConfirm from '@/backoffice/components/MpConfirm';
import MpCopy from '@/backoffice/components/MpCopy';
import MpSimpleText from '@/backoffice/components/MpSimpleText';
import MpImageUpload from '@/backoffice/components/MpImageUpload';
import MpFileUpload from '@/backoffice/components/MpFileUpload';
import MpLargeButton from '@/backoffice/components/MpLargeButton';
import MpLargeDataItem from '@/backoffice/components/MpLargeDataItem';

import MpSelect from '@/backoffice/components/MpSelect';
import MpHelp from '@/backoffice/components/MpHelp';
import Clipboard from 'v-clipboard';

Vue.component('title-bar', TitleBar);
Vue.component('invoker', Invoker);
Vue.component('stepper', Stepper);
Vue.component('mp-select', MpSelect);
Vue.component('mp-confirm', MpConfirm);
Vue.component('mp-large-button', MpLargeButton);
Vue.component('mp-large-data-item', MpLargeDataItem);
Vue.component('mp-search', MpSearch);
Vue.component('mp-text', MpText);
Vue.component('mp-help', MpHelp);
Vue.component('mp-copy', MpCopy);
Vue.component('mp-color-picker', MpColorPicker);
Vue.component('mp-simple-text', MpSimpleText);
Vue.component('mp-image-upload', MpImageUpload);
Vue.component('mp-file-upload', MpFileUpload);

Vue.use(Clipboard);

import VTooltip from 'v-tooltip';
import VueRouter from 'vue-router';

Vue.use(VTooltip);
Vue.use(VueRouter);

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

var appBackoffice = new Vue({
	el: '#wrapper',
	router,
	store,
	template: '<App/>',
	components: { App }
});
