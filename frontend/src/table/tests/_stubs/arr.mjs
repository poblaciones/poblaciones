/* Stub mínimo de @/common/framework/arr para tests. */
export default {
	Clear: function (a) { if (a) a.length = 0; return a; },
	AddRange: function (a, items) { if (a && items) for (var i = 0; i < items.length; i++) a.push(items[i]); return a; },
	Remove: function (a, item) { var i = a ? a.indexOf(item) : -1; if (i >= 0) a.splice(i, 1); return a; }
};
