import FrameRouter from '@/public/router/FrameRouter';
import ClippingRouter from '@/public/router/ClippingRouter';

export default RestoreRoute;

function RestoreRoute() {

};

RestoreRoute.prototype.LoadRoute = function (route, updateRoute = false) {
	this.subscribers = window.SegMap.SaveRoute.subscribers;
	window.SegMap.Session.UI.isRegisterEnabled = false;

	// Restaura desde subscribers
	for (var n = 0; n < this.subscribers.length; n++) {
		var subscriber = this.subscribers[n];
		var arr = this.parseRoute(route, subscriber);
		if (arr) {
			subscriber.FromRoute(arr, updateRoute);
		}
	}

	window.SegMap.Session.UI.isRegisterEnabled = true;
};

RestoreRoute.prototype.parseRoute = function (route, subscriber) {
	var config = subscriber.GetSettings();

	var part = this.getPart(route, config);
	if (!part) {
		return null;
	}
	// Resuelve el desde-hasta
	if (config.startChar) {
		var n = part.indexOf(config.startChar);
		if (n !== -1) {
			part = part.substr(n + 1);
		}
	}
	if (config.endChar) {
		var n = part.indexOf(config.endChar);
		if (n !== -1) {
			part = part.substr(0, n);
		}
	}
	// Si fija si viene empaquetado en grupos
	var groups;
	if (config.groupSeparator) {
		groups = part.split(config.groupSeparator);
	} else {
		groups = [part];
	}
	// Hace la separación intragrupos
	var retGroups = [];
	for (var n = 0; n < groups.length; n++) {
		if (groups[n]) {
			var groupParts = groups[n].split(config.itemSeparator);
			var retGroup = (config.useKeyValue ? {} : []);
			for (var i = 0; i < groupParts.length; i++) {
				if (config.useKeyValue) {
					// si empieza con una letra, lo separa
					if (groupParts[i].length > 0 && groupParts[i][0] >= 'a' && groupParts[i][0] <= 'z') {
						retGroup[groupParts[i][0]] = groupParts[i].substr(1);
					} else {
						retGroup[''] = groupParts[i];
					}
				} else {
					retGroup.push(groupParts[i]);
				}
			}
			retGroups.push(retGroup);
		}
	}
	//
	if (config.groupSeparator) {
		return retGroups;
	} else {
		return retGroups[0];
	}
};

RestoreRoute.prototype.getPart = function (route, config) {
	// Obtiene la parte
	var parts = route.split('/');
	var blockSignatures = (Array.isArray(config.blockSignature) ? config.blockSignature : [config.blockSignature]);
	for (var partKey in parts) {
		var part = parts[partKey];
		for (var blockSignatureKey in blockSignatures) {
			var blockSignature =  blockSignatures[blockSignatureKey];
			if (part.startsWith(blockSignature)) {
				return part.substr(blockSignature.length);
			}
		}
	}
	return null;
};

RestoreRoute.prototype.RouteHasLocation = function (route) {
	var subscriber = new FrameRouter();
	var arr = this.parseRoute(route, subscriber);
 	if (subscriber.frameFromRoute(arr) !== null) {
		return true;
	}
	subscriber = new ClippingRouter();
	arr = this.parseRoute(route, subscriber);
	return arr && Object.keys(arr).length > 0;
};

