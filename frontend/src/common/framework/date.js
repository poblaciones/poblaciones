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
	DateDiffMinutes(date, dateMax = null) {
		if (!dateMax) {
			dateMax = new Date();
		}
		var dif = (dateMax - date) / 1000 / 60;
		return dif;
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
	FormateDate(d) {

	}
};

