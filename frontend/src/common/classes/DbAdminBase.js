import axiosClient from '@/common/js/axiosClient';

export default DbAdminBase;

function DbAdminBase() {

};

// ---------------------------------------------------------------------
// Cuenta del usuario autenticado.
// ---------------------------------------------------------------------

DbAdminBase.prototype.GetCurrentUserAccount = function () {
	return axiosClient.getPromise(window.host + '/services/backoffice/GetCurrentUserAccount',
		{}, 'obtener los datos de la cuenta');
};

DbAdminBase.prototype.GetCurrentUserDiskUsage = function () {
	return axiosClient.getPromise(window.host + '/services/backoffice/GetCurrentUserDiskUsage',
		{}, 'obtener el espacio en disco');
};

DbAdminBase.prototype.UpdateUserName = function (firstname, lastname) {
	return axiosClient.postPromise(window.host + '/services/backoffice/UpdateCurrentUserName',
		{ f: firstname, l: lastname }, 'actualizar el nombre').then(function () {
			if (window.Context.User) {
				window.Context.User.Firstname = firstname;
				window.Context.User.Lastname = lastname;
			}
		});
};

DbAdminBase.prototype.ChangePassword = function (current, newPassword, verification) {
	return axiosClient.postPromise(window.host + '/services/backoffice/ChangeCurrentUserPassword',
		{ c: current, n: newPassword, v: verification }, 'cambiar la contraseña');
};

DbAdminBase.prototype.DeleteAccount = function () {
	return axiosClient.postPromise(window.host + '/services/backoffice/DeleteCurrentUserAccount',
		{}, 'eliminar la cuenta');
};

// ---------------------------------------------------------------------
// Preferencias de usuario (UserSetting).
// ---------------------------------------------------------------------

DbAdminBase.prototype.SetUserSetting = function (key, value) {
	var prevValue = window.Context.User.Settings[key];
	if (window.Context.User.Settings[key] !== value) {
		window.Context.User.Settings[key] = value;
		return axiosClient.postPromise(window.host + '/services/backoffice/SetUserSetting',
			{ k: key, v: JSON.stringify(value) }, 'guardar la preferencia de usuario').catch(error => {
				window.Context.User.Settings[key] = prevValue;
				throw error;
			});
	}
};

DbAdminBase.prototype.GetUserSetting = function (key, defaultValue) {
	var val = window.Context.User.Settings[key];
	if (val !== undefined) {
		return val;
	}
	return defaultValue;
};
