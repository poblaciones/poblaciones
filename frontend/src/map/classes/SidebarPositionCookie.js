import Cookies from 'js-cookie';

export default SidebarPositionCookie;

const TokenKey = 'sidebarPosition';
const ValidValues = ['top', 'middle', 'bottom'];

function SidebarPositionCookie() {

};

SidebarPositionCookie.prototype.Set = function (value) {
	return Cookies.set(TokenKey, value, { expires: 180 });
};

SidebarPositionCookie.prototype.Get = function () {
	var cookie = Cookies.get(TokenKey);
	if (ValidValues.indexOf(cookie) === -1) {
		return 'middle';
	}
	return cookie;
};
