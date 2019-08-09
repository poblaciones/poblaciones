module.exports = {
	Add(arr, value) {
		arr.push(value);
	},
	AddRange(arr, arrValues) {
		arr.push.apply(arr, arrValues);
	},
	InsertAt(arr, index, value) {
		arr.splice(index, 0, value);
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
	RemoveById(arr, id) {
		var index = this.IndexById(arr, id);
		return this.RemoveAt(arr, index);
	},
	ContainsById(arr, id) {
		return this.IndexById(arr, id) !== -1;
	},
	IndexById(arr, id) {
		for (var i = 0; i < arr.length; i++) {
			if (arr[i].Id === id) {
				return i;
			}
		}
		return -1;
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
		if (!this.ContainsById(arr, item.Id)){
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
			return true;
		}
		return false;
	},
	Clear(arr) {
		return arr.splice(0, arr.length);
	},
	Copy(arr) {
		return Array.from(arr);
	},
	SortCopy(arr, sortFunc) {
		var cp = this.Copy(arr);
		cp.sort(sortFunc);
		return cp;
	}
};
