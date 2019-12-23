// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import VueHotkey from 'v-hotkey';
import App from '@/public/App';
import axios from 'axios';
import 'vue-material-design-icons/styles.css';
import Clipboard from 'v-clipboard';

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

window.UISettings_ExtraToolbar = process.env.UISettings_ExtraToolbar;
window.ApplicationName = process.env.ApplicationName;
window.SegMap = null;

// enable axios post cookie, default false
axios.defaults.withCredentials = true;

Vue.use(Clipboard);

Vue.config.productionTip = false;
Vue.use(VueHotkey);

var app = new Vue({
	el: '#wrapper',
	components: { App },
	template: '<App/>'
});
window.app = app;


