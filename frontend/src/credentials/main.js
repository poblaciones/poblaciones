import Vue from 'vue';
import 'vue2-animate/dist/vue2-animate.min.css';
import Vuelidate from 'vuelidate';
import Db from './classes/Db';
import Context from '@/credentials/classes/Context';
import App from './App';
import router from './router/router.js';

import CommonBootstrap from '@/common/classes/CommonBootstrap';

CommonBootstrap.Init(Vue);

// Extras exclusivos de este módulo
Vue.use(Vuelidate);

window.Db = new Db();

var sharedObject = new Context();
var tmpVm = new Vue({ data: { sharedObject } });
window.Context = tmpVm.sharedObject;
window.Context.ServerLoaded = false;
window.Messages = tmpVm;

const store = window.Context.CreateStore();

var appCred = new Vue({
	el: '#wrapper',
	router,
	store,
	template: '<App/>',
	components: { App }
});
