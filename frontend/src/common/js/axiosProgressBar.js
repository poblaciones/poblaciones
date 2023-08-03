import 'nprogress/nprogress.css';

import NProgress from 'nprogress';
import axios from 'axios';

const calculatePercentage = (loaded, total) => (Math.floor(loaded * 1.0) / total);
var slots = [{ instance: null, total: 0, loaded: 0, enabled: false },
	{ instance: null, requests: 0, total: 0, loaded: 0, enabled: false }];

export function loadProgressBar(config, instance = axios, slot = 1) {
	let requestsCounter = 0;
	const setupStartProgress = () => {
		instance.interceptors.request.use(config => {
			requestsCounter++;
			slots[slot].requests = requestsCounter;
			slots[slot].enabled = true;
			if (!slots[0].enabled || !slots[1].enabled) {
				NProgress.start();
			}
			return config;
		});
	};

	const setupUpdateProgress = () => {
		const update = e => {
			slots[slot].loaded = e.loaded;
			slots[slot].total = e.total;
			var total = slots[0].total + slots[1].total;
			var loaded = slots[0].loaded + slots[1].loaded;
			NProgress.inc(calculatePercentage(loaded, total));
		};
		instance.defaults.onDownloadProgress = update;
		instance.defaults.onUploadProgress = update;
	};

	const setupStopProgress = () => {
		const responseFunc = response => {
			requestsCounter--;
			slots[slot].requests = requestsCounter;
			if (requestsCounter == 0) {
				slots[slot].total = 0;
				slots[slot].loaded = 0;
				slots[slot].enabled = false;
			}
			if (!slots[0].enabled && !slots[1].enabled) {
				NProgress.done();
			}
			return response;
		};

		const errorFunc = error => {
			requestsCounter--;
			slots[slot].requests = requestsCounter;
			if (slots[0].requests + slots[1].requests === 0) {
				NProgress.done();
			}
			return Promise.reject(error);
		};

		instance.interceptors.response.use(responseFunc, errorFunc);
	};

	NProgress.configure(config);
	setupStartProgress();
	setupUpdateProgress();
	setupStopProgress();
}
