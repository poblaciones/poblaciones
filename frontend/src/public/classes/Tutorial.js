import h from '@/public/js/helper';
import Cookies from 'js-cookie';

export default Tutorial;

const TokenKey = 'mapsTutorial';

function Tutorial(toolbarStates) {
	this.isOpen = false;
	this.toolbarStates = toolbarStates;
};

Tutorial.prototype.CheckOpenTutorial = function () {
	if (this.isUnsetOrExpired()) {
		this.toolbarStates.tutorialOpened = true;
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
	var cookie = Cookies.get(TokenKey);
	if (cookie == null) {
		return true;
	} else {
		// La vuelva a setear para mantener lejos la expiración
		this.setToken(true);
		return false;
	}
};

Tutorial.prototype.setToken = function (token) {
	return Cookies.set(TokenKey, token, { expires: 180 });
};

Tutorial.prototype.removeToken = function () {
	return Cookies.remove(TokenKey);
};
