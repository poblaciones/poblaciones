import Vue from 'vue';
import Db from '@/backoffice/classes/Db';
import Context from '@/backoffice/classes/Context';
import App from './App';
import router from './router/router.js';

import CommonBootstrap from '@/common/classes/CommonBootstrap';
import MpLargeDataItem from '@/backoffice/components/MpLargeDataItem';

CommonBootstrap.Init(Vue);

// Extras exclusivos de este módulo
Vue.component('router-link', Vue.options.components.RouterLink);
Vue.component('mp-large-data-item', MpLargeDataItem);

window.Db = new Db();

var sharedObject = new Context();
var tmpVm = new Vue({ data: { sharedObject } });
window.Context = tmpVm.sharedObject;

const store = window.Context.CreateStore();

var appBackoffice = new Vue({
	el: '#wrapper',
	router,
	store,
	template: '<App/>',
	components: { App }
});
