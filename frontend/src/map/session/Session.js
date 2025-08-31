import str from '@/common/framework/str';

import Summary from './Summary';
import ContentActions from './ContentActions';
import UIActions from './UIActions';


export default Session;

function Session(config) {
	this.Data = {
		Startup: null,
		IsMobile: null,
		IsEmbedded: null,
		Screen: { Width: null, Height: null },
		DayWeek: null,
		DayHour: null,
	};
	this.FillStartup(config);
	this.savedData = false;
	this.Actions = [];
	this.Summary = new Summary(this);
	this.Content = new ContentActions(this);
	this.UI = new UIActions(this);
	this.startSessionTime = new Date();
	this.LastActivity = 0;
	this.lastSave = -1;
	this.INTERVAL_SECS = 5;
	this.INTERVAL_SECS_SET = [5, 10, 20, 30];
	this.navigationId = config.NavigationId;
	this.navigationMonth = config.NavigationMonth;
	this.saving = false;
	var loc = this;
	setTimeout(() => {
		loc.Pulse();
	}, loc.INTERVAL_SECS * 1000);
};

Session.prototype.FillStartup = function (config) {
	this.Data.IsMobile = config.IsMobile;
	this.Data.Screen = { Width: window.innerWidth, Height: window.innerHeight };
	this.Data.Startup = window.location.href;
	this.Data.IsEmbedded = window.Embedded.Active;
	var fechaActual = new Date();
	this.Data.DayWeek = fechaActual.getDay();
	this.Data.DayHour = fechaActual.getHours();
};

Session.prototype.GetTimeMs = function () {
	var now = new Date();
	return now - this.startSessionTime;
};

Session.prototype.KeepTimer = function () {
	// Avanza el intervalo...
	var loc = this;
	loc.INTERVAL_SECS = loc.INTERVAL_SECS_SET[Math.min(loc.INTERVAL_SECS_SET.length - 1,
		loc.INTERVAL_SECS_SET.indexOf(loc.INTERVAL_SECS) + 1)];
	setTimeout(() => {
		loc.Pulse();
	}, loc.INTERVAL_SECS * 1000);
};

Session.prototype.Pulse = function () {
	// Si hubo actividad, incrementa
	if (this.lastSave != this.LastActivity)
		this.Summary.UpdateEllapsed();
	// Repone timer
	this.KeepTimer();
	// Se fija si graba...
	if (this.lastSave == this.LastActivity || this.saving)
		return;

	var lastSave = this.LastActivity;

	var data = {
		id: this.navigationId,
		m: this.navigationMonth,
		i: (this.savedData ? null : this.Data),
		a: this.Actions,
		s: this.Summary.Data
	};

	const loc = this;
	this.saving = true;
	window.SegMap.Post(window.host + '/services/session/UpdateUsage', data).then(function (res) {
		// limpia la lista
		loc.Actions = [];
		// registra primer save
		loc.savedData = true;
		// registra tiempo de update
		loc.lastSave = lastSave;
	}).finally(function () {
		loc.saving = false;
	});
};

