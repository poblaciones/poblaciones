module.exports = {
	SerializeDate(dateTime) {
		return dateTime.toISOString();
		/*
		var date = dateTime.getFullYear() + '-' + ('00' + (dateTime.getMonth() + 1)).slice(-2) + '-' + ('00' + dateTime.getDate()).slice(-2);
		var time = dateTime.getHours() + ":" + dateTime.getMinutes() + ":" + dateTime.getSeconds();
		var dateTimeAsString = date + 'T' + time;
		return dateTimeAsString;*/
	},
	DeserializeDate(dateTimeAsString) {
		return new Date(dateTimeAsString);
	},
	FormateDateTime(dateTime) {
		var date = dateTime.getFullYear() + '-' + ('00' + (dateTime.getMonth() + 1)).slice(-2) + '-' + ('00' + dateTime.getDate()).slice(-2);
		var time = dateTime.getHours() + ":" + dateTime.getMinutes() + ":" + dateTime.getSeconds();
		var dateTimeAsString = date + ' ' + time;
		return dateTimeAsString;
	},
	DateDiffMinutes(date, dateMax = null) {
		if (!dateMax) {
			dateMax = new Date();
		}
		var dif = (dateMax - date) / 1000 / 60;
		return dif;
	},
	GetCurrentYear() {
		return new Date().getFullYear();
	},
	DateDiffDays(date, dateMax = null) {
		if (!dateMax) {
			dateMax = new Date();
			dateMax.setHours(0, 0, 0, 0);
		}
		var dif = (dateMax - date) / 1000 / 60 / 60 / 24;
		return dif;
	},
	AddHours(date, hours) {
		var copiedDate = new Date(date.getTime());
    copiedDate.setHours(copiedDate.getHours()+hours);
    return copiedDate;
	},
	CalculateUTOffset(date) {
		var offset = (date - new Date()) / 1000 / 3600;
		return Math.round(offset);
	},
	FormatLabelMonth(yearMonth, includeYear = true) {
		if (yearMonth.substr(4, 1) !== '-') {
			return yearMonth;
		}
		var year = yearMonth.substr(0, 4);
		var month = parseInt(yearMonth.substr(5, 2));
		return (includeYear ? year + " - " : '') + this.GetMonthLabel(month - 1);
	},
	FormatLabelQuarter(yearQuarter, includeYear = true) {
		if (yearQuarter.substr(4, 2) !== '-T') {
			return yearQuarter;
		}
		var year = yearQuarter.substr(0, 4);
		var quarter = parseInt(yearQuarter.substr(6, 1));
		return (includeYear ? year + " - " : '') + this.GetQuarterLabel(quarter - 1);
	},
	GetQuarterLabel(q) {
		switch (q + 1) {
			case 1:
				return 'Primer trimestre';
			case 2:
				return 'Segundo trimestre';
			case 3:
				return 'Tercer trimestre';
			case 4:
				return 'Cuarto trimestre';
		}
	},
	GetMonthLabel(m) {
		switch(m + 1)
		{
			case 1:
				return 'Enero';
			case 2:
				return 'Febrero';
			case 3:
				return 'Marzo';
			case 4:
				return 'Abril';
			case 5:
				return 'Mayo';
			case 6:
				return 'Junio';
			case 7:
				return 'Julio';
			case 8:
				return 'Agosto';
			case 9:
				return 'Septiembre';
			case 10:
				return 'Octubre';
			case 11:
				return 'Noviembre';
			case 12:
				return 'Diciembre';
			default:
				return '';
		}
	},
};

