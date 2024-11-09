import axios from 'axios';
import err from '@/common/framework/err';
import web from '@/common/framework/web';
import session from '@/common/framework/session';

export default DataPager;

function DataPager() {
	this.cachedPages = {};
	this.lastRecordStartIndex = null;
	this.lastRecordEndIndex = null;
};

DataPager.prototype.cloneJSON = function (obj) {
	return JSON.parse(JSON.stringify(obj));
};

DataPager.prototype.Clear = function () {
	this.cachedPages = {};
	this.lastRecordStartIndex = null;
	this.lastRecordEndIndex = null;
};


DataPager.prototype.FetchDirect = function (postdata, adapter, source, callback, callback2) {
	let loc = this;
	var page = postdata.pagenum;

	this.GetPage(postdata, page, source,
		function () {
			var key = loc.getKey(postdata, page);
			var data = loc.cachedPages[key];
			var records = data.Data;
			var tonames = loc.PosFromNames(source, records);
			callback({ records: tonames, totalrecords: source.totalrecords });
		}, function () {
			adapter.loadjson(null, [], source);
			callback({ records: adapter.records, totalrecords: source.totalrecords });
			callback2();
		});
};

/*
DataPager.prototype.FetchDirect = function (postdata, adapter, source, callback) {
	let loc = this;
	axios.get(source.url, {
			params: postdata,
		}).then(function (res) {
			if (source.beforeprocessing) {
				source.beforeprocessing(res.data);
			}
			var records = res.data.Data;
			var tonames = loc.PosFromNames(source, records);
			callback({ records: tonames, totalrecords: source.totalrecords });
		}).catch(function (error) {
			err.errDialog('FetchDirect', 'obtener filas del dataset', error);
			adapter.loadjson(null, [], source);
			callback({ records: adapter.records, totalrecords: source.totalrecords });
		});
};*/


DataPager.prototype.Fetch = function (postdataGrid, adapter, source, callback, callback2) {
	let postdata = this.cloneJSON(postdataGrid);
	this.lastRecordStartIndex = postdata.recordstartindex;
	this.lastRecordEndIndex = postdata.recordendindex;
	postdata.recordstartindex = 0;
	postdata.recordendindex = 0;
	postdata.pagenum = 0;
	let loc = this;

	let finalAction = function () {
		let page1 = loc.CalculatePage(loc.lastRecordStartIndex, postdata.pagesize);
		let page2 = loc.CalculatePage(loc.lastRecordEndIndex, postdata.pagesize);
		if (loc.hasData(postdata, page1) &&
			(page1 === page2 || loc.hasData(postdata, page2))) {
			var records = loc.CutRecords(postdata);
			var tonames = loc.PosFromNames(source, records);
			callback({ records: tonames, totalrecords: source.totalrecords });
			callback2();
			loc.lastRecordStartIndex = null;
			loc.lastRecordEndIndex = null;
		}
	};
	let finalError = function () {
		adapter.loadjson(null, [], source);
		callback({ records: adapter.records, totalrecords: source.totalrecords });
	};
	let page1 = loc.CalculatePage(loc.lastRecordStartIndex, postdata.pagesize);
	let page2 = loc.CalculatePage(loc.lastRecordEndIndex, postdata.pagesize);
	this.GetPage(postdata, page1, source, finalAction, finalError);
	if (page1 !== page2) {
		this.GetPage(postdata, page2, source, finalAction, finalError);
	}
};


DataPager.prototype.PosFromNames = function(source, records) {
	let ret = [];
	for (var n = 0; n < source.datafields.length; n++) {
		if (source.datafields[n].map != n) {
			throw new Error('Los datafields deben estar definidos secuencialmente según su .map.');
		}
	}
	for (var i = 0; i < records.length; i++) {
		let ele = {};
		for (var n = 0; n < source.datafields.length; n++) {
			var value = records[i][n];
			var datafield = source.datafields[n];
			if (datafield.type === 'number' && value !== '' && value !== null) {
				// hace el reparseo porque JSON no se ocupa de números con decimales
				value = parseFloat(value);
			}
			ele[datafield.name] = value;
		}
		ret.push(ele);
	}
	return ret;
};
DataPager.prototype.CalculatePage = function (item, pagesize) {
	return Math.trunc(item / pagesize);
};

DataPager.prototype.CutRecords = function (postdata) {
	let page1 = this.CalculatePage(this.lastRecordStartIndex, postdata.pagesize);
	let page2 = this.CalculatePage(this.lastRecordEndIndex, postdata.pagesize);

	let key1 = this.getKey(postdata, page1);
	let data1 = this.cachedPages[key1];
	let start = this.lastRecordStartIndex % postdata.pagesize;

	let end = (page1 === page2 ? (this.lastRecordEndIndex % postdata.pagesize) + 1 : data1.Data.length);
	var rows = [];
	for (let i = start; i < end; i++) {
		if (i < data1.Data.length) {
			rows.push(data1.Data[i]);
		}
	}
	if (page1 !== page2) {
		let key2 = this.getKey(postdata, page2);
		let data2 = this.cachedPages[key2];
		end = (this.lastRecordEndIndex % postdata.pagesize) + 1;
		for (let i = 0; i < end; i++) {
			if (i < data2.Data.length) {
				rows.push(data2.Data[i]);
			}
		}
	}
	return rows;
};

DataPager.prototype.getKey = function (postdata, page) {
	postdata.page = page;
	return JSON.stringify(postdata);
};

DataPager.prototype.hasData = function (postdata, page) {
	let key = this.getKey(postdata, page);
	return this.cachedPages[key];
};

DataPager.prototype.GetPage = function (postdata, page, source, callback, callbackError) {
	if (this.hasData(postdata, page)) {
		callback();
		return;
	}

	postdata.page = page;
	let key = this.getKey(postdata, page);
	let loc = this;
	axios.get(source.url, session.AddSession(source.url, {
			params: postdata,
	})).then(function (res) {
			session.ReceiveSession(source.url, res);
			if (source.beforeprocessing) {
				source.beforeprocessing(res.data);
			}
			loc.cachedPages[key] = res.data;
			callback();
		}).catch(function (error) {
			var url = source.url;
			var datasetId = web.getParameterByName('k', url);
			var livedataset = null;
			if (window.Context.CurrentWork && datasetId) {
				livedataset = window.Context.CurrentWork.GetActiveDatasetById(parseInt(datasetId));
			}
			if (livedataset && !livedataset.beingDeleted) {
				err.errDialog('FetchData', 'obtener filas del dataset', error);
				callbackError();
			}
		});
};
