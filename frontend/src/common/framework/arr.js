module.exports = {
	Add(arr, value) {
		arr.push(value);
	},
	Crop(arr, itemsLeft) {
		arr.splice(itemsLeft, arr.length - itemsLeft);
	},
	Fill(arr, arrValues) {
		this.Clear(arr);
		this.AddRange(arr, arrValues);
	},
	FillAssoc(arr, arrValues) {
		this.ClearAssoc(arr);
		this.AddRangeAssoc(arr, arrValues);
	},
	AddRangeAssoc(arr, arrValues) {
		var keys = Object.keys(arrValues);
		for (var key of keys) {
			arr[key] = arrValues[key];
		}
	},
	AddRange(arr, arrValues) {
		arr.push.apply(arr, arrValues);
	},
	InsertAt(arr, index, value) {
		arr.splice(index, 0, value);
	},
	InsertSortedByValue(arr, newElement, attribute) {
		// Buscar la posición de inserción
		var pos = arr.findIndex(element => element[attribute] > newElement[attribute]);
		// Si no se encontró una posición mayor, agregar al final
		if (pos === -1) {
			pos = arr.length;
		}
		// Insertar el nuevo elemento en la posición encontrada
		arr.splice(pos, 0, newElement);
	},
	Remove(arr, element) {
		var index = arr.indexOf(element);
		return this.RemoveAt(arr, index);
	},
	RemoveAt(arr, index) {
		if (index > -1) {
			// borra del array
			arr.splice(index, 1);
		}
		return (index >= 0);
	},
	GetUniqueValues(arr, attribute) {
		var ret = [];
		for(var n = 0; n < arr.length; n++) {
			var val = arr[n][attribute];
			if (!ret.includes(val)) {
				ret.push(val);
			}
		}
		return ret;
	},
	FilterByValue(arr, attribute, value) {
		return arr.filter(function(element) { return element[attribute] === value; });
	},
	ToDictionaryByValue(arr, attribute) {
		var ret = {};
		for (var item of arr) {
			ret[item[attribute]] = item;
		}
		return ret;
	},
	ToDictionaryPairGroupedByValue(arr, attribute, attributeToIndexKey, attributeToIndexValue) {
		var ret = {};
		for (var item of arr) {
			var attributeValue = item[attribute];
			if (!ret[attributeValue]) {
				ret[attributeValue] = {};
			}
			ret[attributeValue][item[attributeToIndexKey]] = item[attributeToIndexValue];
		}
		return ret;
	},

	ToDictionaryValueGroupedByValue(arr, attribute, attributeToIndex) {
		var ret = {};
		for (var item of arr) {
			var attributeValue = item[attribute];
			if (!ret[attributeValue]) {
				ret[attributeValue] = [];
			}
			ret[attributeValue].push(item[attributeToIndex]);
		}
		return ret;
	},
	ToDictionaryGroupedByValue(arr, attribute) {
		var ret = {};
		for (var item of arr) {
			var attributeValue = item[attribute];
			if (!ret[attributeValue]) {
				ret[attributeValue] = [];
			}
			ret[attributeValue].push(item);
		}
		return ret;
	},
	ToDictionaryGroupedByDictionary(arr, attributeList) {
		var ret = {};
		for (var item of arr) {
			var attributeValueList = item[attributeList];
			if (attributeValueList) {
				var ids = Object.keys(attributeValueList);
				for (var i = 0; i < ids.length; i++) {
					var attributeValue = ids[i];
					if (!ret[attributeValue]) {
						ret[attributeValue] = [];
					}
					ret[attributeValue].push(item);
				}
			}
		}
		return ret;
	},
	DictionaryIdToDictionaryProperty(collection, dictionary, property, def = {}) {
		return this.DictionaryIdToCollectionProperty(collection, dictionary, property, def);
	},
	DictionaryIdToCollectionProperty(collection, dictionary, property, def = []) {
		for (var n = 0; n < collection.length; n++) {
			var value = dictionary[collection[n].Id];
			if (value) {
				collection[n][property] = value;
			} else {
				collection[n][property] = def;
			}
		}
	},
	SearchByCaption(items, term) {
		var loc = this;
		if (term != '') {
			return items.filter(item => this.AnyToLower(item.Caption).includes(this.AnyToLower(term)));
		}
		return items;
	},
	AnyToLower(cad) {
		if (cad === null || cad === undefined) {
			return "";
		}
		return cad.toString().toLowerCase();
	},
	ToIntArray(arr) {
		return arr.map(function (x) {
			return parseInt(x, 10);
		});
	},
	GetIds(arr) {
		return arr.map(function (x) {
			return x.Id;
		});
	},
	AreEquals(a, b) {
		if (a === b) return true;
		if (a == null || b == null) return false;
		if (a.length !== b.length) return false;
		for (var i = 0; i < a.length; ++i) {
			if (a[i] !== b[i]) return false;
		}
		return true;
	},
	RemoveByKey(arr, key) {
		if (arr.hasOwnProperty(key)) {
			delete arr[key];
			return true;
		} else {
			return false;
		}
	},
	RemoveById(arr, id) {
		var index = this.IndexById(arr, id);
		return this.RemoveAt(arr, index);
	},
	ContainsById(arr, id) {
		return this.IndexById(arr, id) !== -1;
	},
	IndexById(arr, id, property) {
		for (let i = 0; i < arr.length; i++) {
			let itemId = null;
			if(property === undefined) {
				itemId = arr[i].Id;
			} else {
				itemId = arr[i][property].Id;
			}
			if (itemId === id) {
				return i;
			}
		}
		return -1;
	},
	IndexByKey(arr, key) {
		var keys = Object.keys(arr);
		return keys.indexOf(key);
	},
	IndexByProperty(arr, property, value) {
		for (let i = 0; i < arr.length; i++) {
			let item = arr[i][property];
			if (item == value) {
				return i;
			}
		}
		return -1;
	},
	GetByProperty(arr, property, value) {
		var i = this.IndexByProperty(arr, property, value);
		if (i !== -1) {
			return arr[i];
		} else {
			return null;
		}
	},
	GetById(arr, id, defaultValue) {
		var i = this.IndexById(arr, id);
		if (i !== -1) {
			return arr[i];
		} else if (defaultValue === undefined) {
			throw new Error('Item not found.');
		} else {
			return defaultValue;
		}
	},
	ReplaceByIdOrAdd(arr, item) {
		if (!this.ContainsById(arr, item.Id)) {
			this.Add(arr, item);
		} else {
			this.ReplaceById(arr, item.Id, item);
		};
	},
	ReplaceById(arr, id, newValue) {
		var index = this.IndexById(arr, id);
		return this.ReplaceAt(arr, index, newValue);
	},
	ReplaceAt(arr, index, newValue) {
		if (index !== -1) {
			arr.splice(index, 1);
			arr.splice(index, 0, newValue);
			return true;
		}
		return false;
	},
	MoveUp(arr, item) {
		var index = arr.indexOf(item);
		return this.MoveUpAt(arr, index);
	},
	MoveUpAt(arr, index) {
		if (index > 0) {
			// borra
			var tmp = arr[index];
			this.RemoveAt(arr, index);
			// inserta
			this.InsertAt(arr, index - 1, tmp);
			// intercambia los valores de order
			var orderTmp = arr[index].Order;
			arr[index].Order = arr[index - 1].Order;
			arr[index - 1].Order = orderTmp;
			return true;
		}
		return false;
	},
	MoveDown(arr, item) {
		var index = arr.indexOf(item);
		return this.MoveDownAt(arr, index);
	},
	MoveDownAt(arr, index) {
		if (index > -1 && index < arr.length - 1) {
			// borra
			var tmp = arr[index];
			this.RemoveAt(arr, index);
			// inserta
			this.InsertAt(arr, index + 1, tmp);
			// intercambia los valores de order
			var orderTmp = arr[index].Order;
			arr[index].Order = arr[index + 1].Order;
			arr[index + 1].Order = orderTmp;
			return true;
		}
		return false;
	},
	Clear(arr) {
		return arr.splice(0, arr.length);
	},
	ClearAssoc(arr) {
		var keys = Object.keys(arr);
		for (var key of keys) {
			delete arr[key];
		}
	},
	Copy(arr) {
		return Array.from(arr);
	},
	SortCopy(arr, sortFunc) {
		var cp = this.Copy(arr);
		cp.sort(sortFunc);
		return cp;
	},
	SortByValue(arr, attribute) {
		arr.sort(function (a, b) {
			return (a[attribute] > b[attribute]) - (b[attribute] > a[attribute]);
		});
		return arr;
	}
};
