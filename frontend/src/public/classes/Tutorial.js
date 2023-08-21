import h from '@/public/js/helper';
import Cookies from 'js-cookie';

export default Tutorial;

const TokenKey = 'mapsTutorial';
const TokenKeyTimes = 'mapsTutorialTimes';

function Tutorial(toolbarStates, suffix = '') {
	this.suffix = suffix;
	this.isOpen = false;
	this.toolbarStates = toolbarStates;
};

Tutorial.prototype.CheckOpenTutorial = function () {
	if (this.isUnsetOrExpired() && this.tutorialFew() && !window.Embedded.Active) {
		this.toolbarStates.tutorialOpened = true;
		this.incrementTutorialTimes();
		return true;
	} else {
		return false;
	}
};

Tutorial.prototype.UpdateOpenTutorial = function () {
  // La llama para mantener lejos la expiración
	var ret = this.isUnsetOrExpired();
	return ret;
};


Tutorial.prototype.DoneWithTutorial = function () {
		this.setToken(true);
};

Tutorial.prototype.isUnsetOrExpired = function() {
	var cookie = Cookies.get(TokenKey + this.suffix);
	if (cookie == null) {
		return true;
	} else {
		// La vuelva a setear para mantener lejos la expiración
		this.setToken(true);
		return false;
	}
};

Tutorial.prototype.tutorialFew = function () {
	return this.getTutorialTimes() < 3;
};

Tutorial.prototype.incrementTutorialTimes = function () {
	var times = this.getTutorialTimes();
	this.setTutorialTimes(++times);
};

Tutorial.prototype.setTutorialTimes = function (times) {
	return Cookies.set(TokenKeyTimes + this.suffix, times, { expires: 180 });
};

Tutorial.prototype.getTutorialTimes = function () {
	var cookie = Cookies.get(TokenKeyTimes + this.suffix);
	if (cookie == null) {
		return 0;
	} else {
		// La vuelva a setear para mantener lejos la expiración
		var times = parseInt(cookie);
		this.setTutorialTimes(times);
		return times;
	}
};

Tutorial.prototype.setToken = function (token) {
	return Cookies.set(TokenKey + this.suffix, token, { expires: 180 });
};

Tutorial.prototype.removeToken = function () {
	return Cookies.remove(TokenKey + this.suffix);
};
