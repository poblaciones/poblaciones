const date = require('@/common/framework/date');
const moment = require('moment');
const es = require('moment/locale/es');

module.exports = {
	GetValidaDate(item) {
		if (item.MetadataLastOnline === null && item.Updated === null) {
			return null;
		}
		if (item.MetadataLastOnline === null || item.Updated > item.MetadataLastOnline) {
			return item.Updated;
		} else {
			return item.MetadataLastOnline;
		}
	},
	FormatWorkInfo(item) {
		var action;
		var date;
		var user = null;
		if (item.MetadataLastOnline === null && item.Updated === null) {
			return '';
		}
		if (item.MetadataLastOnline === null || item.Updated > item.MetadataLastOnline) {
			date = item.Updated;
			action = 'Editada';
			user = item.UpdateUser;
		} else {
			date = item.MetadataLastOnline;
			action = 'Publicada';
			user = item.LastOnlineUser;
		}
		return this.LogInfoText(date, user, action);
	},
	LogInfoText(logDate, logUser, action) {
		var dateOf = date.DeserializeDate(logDate);
		var distanceInMinutes = date.DateDiffMinutes(dateOf);
		var textDate;

		var momentDateTime = moment(dateOf);

		dateOnly = new Date(dateOf.getTime());
		dateOnly.setHours(0, 0, 0, 0);
		var momentDateOnly = moment(dateOnly);
		moment.locale('es');

		if (distanceInMinutes < 60 * 24) {
			textDate = momentDateTime.fromNow();
		} else {
			textDate = momentDateOnly.calendar();
		}
		textDate = textDate.replace(" pasado", '');
		textDate = textDate.replace(" a las 0:00", '');
		if (textDate[0] >= '0' && textDate[0] <= '9') {
			textDate = 'el ' + textDate;
		}
		var ret =	action + ' ' + textDate + (logUser ? ' por ' + logUser : '');
		return ret;
	},
};
