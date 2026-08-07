import Vue from 'vue';
import Db from './classes/Db';
import Context from '@/admins/classes/Context';
import App from './App';
import router from './router/router.js';

import CommonBootstrap from '@/common/classes/CommonBootstrap';

CommonBootstrap.Init(Vue);

window.Db = new Db();

var sharedObject = new Context();
var tmpVm = new Vue({ data: { sharedObject } });
window.Context = tmpVm.sharedObject;

const store = window.Context.CreateStore();

var appAdmin = new Vue({
	el: '#wrapper',
	router,
	store,
	template: '<App/>',
	components: { App }
});
