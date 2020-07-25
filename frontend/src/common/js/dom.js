module.exports = {
	getCssRule(d, name) {
		for (var i = 0; i<d.styleSheets.length; ++i) {
			var cssRules = null;
			if (d.styleSheets[i].ownerNode
				&& d.styleSheets[i].ownerNode.localName == 'style') {
				if (d.styleSheets[i]['cssRules'] !== undefined) {
					cssRules = d.styleSheets[i].cssRules;
				} else if (d.styleSheets[i]['rules'] !== undefined) {
					cssRules = d.styleSheets[i].rules;
				}
			}
			if (cssRules) {
				for (var j = 0; j < cssRules.length; ++j) {
					if (name === cssRules[j].selectorText) {
						return cssRules[j];
					}
				}
			}
		}
		return null;
	},
	addClassesByList(addClasses) {
		for (var i = 0; i < addClasses.length; i++) {
			var item = addClasses[i];
			this.addClass(item.class, item.extraclass);
		}
	},
	removeClassesByList(removeClasses) {
		for (var i = 0; i < removeClasses.length; i++) {
			var item = removeClasses[i];
			this.removeClass(item.class, item.extraclass);
		}
	},
	setStyleAttributesByList(classSet) {
		for (var i = 0; i < classSet.length; i++) {
			var item = classSet[i];
			if (item.class.startsWith('#')) {
				this.setStyleAttributeById(item.class.substring(1), item.attribute, item.set);
			} else {
				this.setStyleAttributeByClass(item.class, item.attribute, item.set);
			}
		}
	},
	unsetStyleAttributesByList(classSet) {
		for (var i = 0; i < classSet.length; i++) {
			var item = classSet[i];
			if (item.class.startsWith('#')) {
				this.setStyleAttributeById(item.class.substring(1), item.attribute, item.restore);
			} else {
				this.setStyleAttributeByClass(item.class, item.attribute, item.restore);
			}
		}
	},
	setStyleAttributeById(id, attributeName, newValue) {
		var idObj = document.getElementById(id);
		idObj.style[attributeName] = newValue;
	},
	setDisplayByClass(classname, newValue) {
		return this.setStyleAttributeByClass(classname, 'display', newValue);
	},
	setDisplayByClassNotActive(classname, newValue) {
		return this.setStyleAttributeByClass(classname, 'display', newValue, "active");
	},
	setStyleAttributeByClass(classname, attributeName, newValue, filter) {
		var classObjs = document.getElementsByClassName(classname);
		for (var i = 0; i < classObjs.length; i++) {
			if (!filter || !classObjs[i].classList.contains(filter)) {
				classObjs[i].style[attributeName] = newValue;
			}
		}
		return classObjs;
	},
	setVisibilityByClass(classname, newValue) {
		return this.setStyleAttributeByClass(classname, 'visibility', newValue);
	},
	swapClasses(classname, classToAdd, classToRemove) {
		var classObjs = document.getElementsByClassName(classname);
		for (var i = 0; i < classObjs.length; i++) {
			classObjs[i].classList.add(classToAdd);
			classObjs[i].classList.remove(classToRemove);
		}
	},
	removeClass(classname, classToRemove) {
		var classObjs = document.getElementsByClassName(classname);
		for (var i = 0; i < classObjs.length; i++) {
			classObjs[i].classList.remove(classToRemove);
		}
		return classObjs;
	},
	removeClassAddText(classname, classToRemove, textToAdd) {
		var classObjs= document.getElementsByClassName(classname);
		for (var i = 0; i < classObjs.length; i++) {
			classObjs[i].classList.remove(classToRemove);
			classObjs[i].innerHTML = textToAdd;
		}
		return classObjs;
	},
	addClass(classname, classToAdd) {
		var classObjs = document.getElementsByClassName(classname);
		for (var i = 0; i < classObjs.length; i++) {
			classObjs[i].classList.add(classToAdd);
		}
	},
	addClassRemoveText(classname, classToAdd){
		var classObjs = document.getElementsByClassName(classname);
		for (var i = 0; i < classObjs.length; i++) {
			classObjs[i].classList.add(classToAdd);
			classObjs[i].innerHTML = '';
		}
	},
};
