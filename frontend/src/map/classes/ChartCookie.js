import h from '@/map/js/helper';
import Cookies from 'js-cookie';

export default ChartCookie;

const TokenKey = 'chartState';

function ChartCookie() {

};

ChartCookie.prototype.Set = function (value) {
	return Cookies.set(TokenKey, (value ? 1 : 0), { expires: 180 });
};

ChartCookie.prototype.Get = function () {
	var cookie = Cookies.get(TokenKey);
	if (cookie == null) {
		return true;
	} else {
		// La vuelva a setear para mantener lejos la expiración
		var times = parseInt(cookie);
		return (times == 1);
	}
};
