// Stub de @/common/framework/arr. Implementaciones reales mínimas: MetricsList
// y los routers dependen de su comportamiento.
export default {
	Remove(list, item) {
		const i = list.indexOf(item);
		if (i !== -1) {
			list.splice(i, 1);
		}
	},
	InsertAt(list, index, item) { list.splice(index, 0, item); },
	Clear(list) { list.splice(0, list.length); },
	Fill(list, items) { list.splice(0, list.length, ...items); },
	RemoveByKey(obj, key) { delete obj[key]; },
	RemoveAt(list, index) { list.splice(index, 1); },
	AddRange(list, items) { for (const i of items) list.push(i); },
};
