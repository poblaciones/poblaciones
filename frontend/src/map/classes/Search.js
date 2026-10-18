import err from '@/common/framework/err';
import axios from 'axios';
import session from '@/common/framework/session';

export default Search;

function Search(view, revision, searchType, getDraftMetrics, isBackoffice = false, currentWorkId = null) {
	this.view = view;
	this.searchType = searchType;
	this.revision = revision;
	this.getDraftMetrics = getDraftMetrics;
	this.isBackoffice = isBackoffice;
	this.currentWorkId = currentWorkId;
};

Search.prototype.StartSearch = function (t) {
	if (this.preSearch(t)) {
		return;
	}
	var view = this.view;
	if(view.retCancel !== null)
	{
		view.retCancel('cancelled');
		view.retCancel = null;
	}
	var CancelToken = axios.CancelToken;
	var loc = this;
	view.loading = true;
	var facade = (this.isBackoffice ? 'backoffice' : 'frontend');
	return axios.get(window.host + '/services/' + facade + '/Search', session.AddSession(window.host, {
		params: {
			q: t, f: this.searchType, w: this.revision, b: (this.getDraftMetrics ? '1' : '0'),
				k: this.currentWorkId },
		cancelToken: new CancelToken(function executor(c) { view.retCancel = c; })
		}))
		.then(function (res) {
			session.ReceiveSession(window.host, res);
			loc.LoadResults(res.data, t);
			view.loading = false;
		}).catch(function(error) {
			// La búsqueda cancelada por una más reciente no es un error: esa
			// otra mantiene el estado de carga.
			if (axios.isCancel(error)) {
				return;
			}
			view.loading = false;
			err.errDialog('search', 'completar la búsqueda solicitada', error);
		});
};

Search.prototype.preSearch = function (text) {
	var coordParser = require('./ParseCoordinate');
	var ret = new coordParser(text);
	if (!ret.success) {
		return false;
	}
	var item = {
		Id: null,
		Caption: ret.display,
		Type: "P",
		ExtraIds: "",
		Symbol: "fas fa-map-marker-alt",
		Lat: ret.result.y,
		Lon: ret.result.x,
		Extra: "Ubicación"
	};
	this.LoadResults([item], text);
	return true;
};

Search.prototype.LoadResults = function(list, t) {
	var view = this.view;
	view.searched = t;
	view.autolist = list.map(function (el) {
		el.Highlighted = el.Caption;
		el.Class = '';
		return el;
	});
	// En la búsqueda de lugares ('p') el mensaje de "sin resultados" lo muestra
	// quien la invoca, porque puede haber resultados de otras fuentes.
	if (view.autolist.length === 0 && this.searchType !== 'p') {
		view.autolist = [{
			Type: 'N',
			Caption: 'No se encontraron resultados.',
			Highlighted: 'No se encontraron resultados.',
		}];
	}
};
