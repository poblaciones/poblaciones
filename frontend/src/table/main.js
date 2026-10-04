import Vue from 'vue';
import 'vue2-animate/dist/vue2-animate.min.css';
import '@/common/styles/tokens.css';
import '@/common/styles/buttons.css';
import '@/common/styles/list-items.css';
import '@/common/styles/chips.css';
import '@/common/styles/switch.css';
import '@/common/styles/search.css';
import Vuelidate from 'vuelidate';
import Db from './classes/Db';
import Context from '@/table/classes/Context';
import App from './App';

import CommonBootstrap from '@/common/classes/CommonBootstrap';
import AriaPlugin from '@/common/framework/ariaPlugin';

CommonBootstrap.Init(Vue, { router: false, extended: false });
Vue.use(Vuelidate);
Vue.use(AriaPlugin);

window.Db = new Db();

var sharedObject = new Context();
var tmpVm = new Vue({ data: { sharedObject } });
window.Context = tmpVm.sharedObject;
window.Context.ServerLoaded = false;
window.Messages = tmpVm;

const store = window.Context.CreateStore();

var appTable = new Vue({
	el: '#wrapper',
	store,
	template: '<App/>',
	components: { App }
});
