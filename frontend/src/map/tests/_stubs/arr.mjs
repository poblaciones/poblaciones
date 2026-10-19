// Stub de @/common/framework/arr. Implementaciones reales mínimas: MetricsList,
// los routers y las clases de geometría dependen de su comportamiento.
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
        // Convierte una lista de strings en enteros, descartando lo no parseable.
        ToIntArray(list) {
                const out = [];
                for (const item of list) {
                        const n = parseInt(item, 10);
                        if (!isNaN(n)) out.push(n);
                }
                return out;
        },
        // Igualdad por valor: idénticos, o estructuralmente iguales (JSON). Dos
        // null/undefined son iguales entre sí; null/undefined contra objeto, no.
        AreEquals(a, b) {
                if (a === b) return true;
                if (a == null || b == null) return false;
                if (typeof a !== 'object' || typeof b !== 'object') return false;
                return JSON.stringify(a) === JSON.stringify(b);
        },
};
