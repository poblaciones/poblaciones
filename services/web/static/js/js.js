var keepWindow = null;

function checkTextHasEmail(selectName, selectCaption) {
	if (!textHasValue(selectName)) {
		alert('Debe indicar un valor para ' + selectCaption + '.');
		setFocus(selectName);
		return false;
	}
	if (!textHasEmail(selectName)) {
		alert('Debe indicar un valor para ' + selectCaption + ' válida.');
		setFocus(selectName);
		return false;
	}
	return true;
}
function documentResized() {
	if (parent)
		notifyParentResize();
}
function notifyParentResize() {
	parent.ChildChanged();
}

function ChildChanged() {
	$('.fancybox-iframe').each(function () {
		if ($(this)[0].contentWindow)
		{
			var a = $(this).contents().find('#bottomLine');
			$(this)[0].height = a[0].offsetTop + 4;
			$(this)[0].style.height = (a[0].offsetTop + 4) + 'px';
			$(this)[0].parentElement.style.height = $(this)[0].style.height ;
		}
	});
}

function transfer(url) {
	window.setTimeout(function () {
			document.location = url;
		}, 1);
}
function toggleRead() {
	var ele = getElement("more");
	if (ele.className == 'dMoreInfoContainerHidden')
		ele.style.display = 'block';
	else
		ele.style.display = 'none';
	setTimeout(function () {
		if (ele.className == 'dMoreInfoContainerHidden')
			ele.className = 'dMoreInfoContainer';
		else
			ele.className = 'dMoreInfoContainerHidden';
	}, 50);
	return false;
}

function postUrl(url, data, successCallback) {
	//beginWait();
	$.ajax({
		url: url, data: data, dataType: 'json', type: 'post', async: true,
		success: function (result) {
		//	endWait();
			if (!result.isOk) {
				alert('Ha ocurrido un error: ' + result.error);
			} else {
				successCallback();
			}
		},
		error: function (XMLHttpRequest, textStatus, errorThrown) {
			//endWait();
			alert("No se ha podido completar la solicitud: " + errorThrown);
		}
	}
	);
}

function resetTextField(ele) {
	if (ele.placeholder != '') {
		ele.style.fontStyle = 'normal';
		ele.placeholder = "";
	}
}

function getWordCount(value) {
	if (value.length == 0) {
		return 0;
	}
	var regex = /\s+/gi;
	return value.trim().replace(regex, ' ').split(' ').length;
}

function updateBlock(items, entity) {
	if (items < 2) { items = 2; }
	for (var i = 1; i < items + 1; i++) {
		if (i % 2 == 1) {
			setVisibility('pan_' + entity + '_' + i, 'block');
		}
	}
	if (items >= 24) {
		setVisibility('btn' + entity, 'none');
	}
}

function lazyCompare(v1, v2) {
	v1 = simplifyString(v1);
	v2 = simplifyString(v2);
	return (v1 == v2);
}

function simplifyString(v1) {
	v1 = v1.toLowerCase().replace(',', ' ');
	v1 = v1.replace('(', ' ');
	v1 = v1.replace('.', ' ');
	v1 = v1.replace(')', ' ');
	v1 = v1.replace('   ', ' ');
	v1 = v1.replace('  ', ' ');
	return v1;
}

function updateCustomFieldText(txtValue, ele) {
	if (txtValue.trim() == '') {
		$('#' + ele + ' *').attr('disabled', 'disabled');
		$('#' + ele).css('color', '#999999');
	} else {
		$('#' + ele + ' *').removeAttr('disabled');
		$('#' + ele).css('color', '');
	}
}

function updateCustomFieldType(cmbValue, ele) {
	if (cmbValue == 'list') {
		setElementDisplay(ele, 'block');
	} else {
		setElementDisplay(ele, 'none');
	}
}

function focusAndSelect(id) {
	var ele = getElement('searchTextLOCAL');
	ele.focus();
	ele.select();
}

function selectComboSet(allTypes, idbase) {
	var currentCombo = null;
	for (var n = 0; n < allTypes.length; n++) {
		var tag = allTypes[n];
		var id = idbase + tag;
		if (exists(id)) {
			if (tag == sessionType) {
				setVisibility(id, 'inline');
				currentCombo = getElement(id);
			} else {
				setVisibility(id, 'none');
			}
		}
	}
	return currentCombo;
}

function disableButton(id) {
	setTimeout("getElement('" + id + "').disabled = 'disabled';", 100);
	return true;
}

function enableButton(id) {
	getElement(id).disabled = '';
	return true;
}

function setDisableElement(id, value) {
	var ele = getElement(id);
	if (!ele) {
		alert('Elemento indefinido: ' + id);
		return;
	}
	if (value) {
		ele.disabled = 'disabled';
	} else {
		ele.disabled = '';
	}
}

function getDisableElement(id) {
	return (getElement(id).disabled == 'disabled');
}

function deleteUploadImage(id) {
	// setea el hidden
	var imgHidden = getElement(id+'Delete');
	imgHidden.value = '1';
	// blanquea
	var imgPrev = getElement(id + 'Preview');
	imgPrev.style.display = 'none';
	// muestra field de upload
	// upload
	var fldup = getElement(id);
	fldup.style.display = "block";
	var imgExplain = getElement(id + 'DivExplain');
	imgExplain.style.display = "block";
	// oculta botón
	var imgBtn = getElement(id+'DeleteButton');
	imgBtn.style.display = "none";
}

function processUrl(cad) {
	cad = cad.trim();
	cad = cad.toLowerCase().replace(/ /g, '.');
	cad = cad.replace('ñ', 'n');
	cad = cad.replace('ç', 'c');
	cad = replaceGroup(cad, 'åäãâáà', 'a');
	cad = replaceGroup(cad, 'ëêéè', 'e');
	cad = replaceGroup(cad, 'ïîíì', 'i');
	cad = replaceGroup(cad, 'öõôóò', 'o');
	cad = replaceGroup(cad, 'üûúù', 'o');
	var cadret = '';
	for (var i = 0, len = cad.length; i < len; i++) {
		if (cad[i] == '.' || (cad[i] >= 'a' && cad[i] <= 'z')
			|| (cad[i] >= '0' && cad[i] <= '9')) {
			cadret += cad[i];
		}
	}
	while (cadret.indexOf('..') > -1) {
		cadret = cadret.replace('..', '.');
	}

	while (cadret.length > 0 && cadret[cadret.length - 1] == ".") {
		cadret = cadret.substring(0, cadret.length - 1);
	}
	return cadret;
}

function rightTrim(text) {
	return text.replace(/\s+$/, "");
}

function removeParenthesisEnding(text) {
	var pos = text.lastIndexOf('[');
	if (pos != -1) {
		text = text.substring(0, pos - 1);
	}
	return text;
}

function checkSize(id, maxSize, description) {
	var ele = $('#' + id);
	if (ele[0].files.length == 0) {
		return true;
	}
	var fsize = ele[0].files[0].size;
	var fileKBytes = Math.round(fsize / 1024);
	if (fsize > maxSize) {
		var maxSizeKB = Math.round(maxSize / 1024);
		ele.focus();
		alert("El archivo indicado " + description + "no puede ser mayor a "
			+ maxSizeKB + "KBytes (tamaño del archivo: " + fileKBytes + "KBytes.");
		return false;
	}
	if (fsize > 2048000) {
		var maxSizeKB = Math.round(maxSize / 1024);
		if (!confirm("El archivo indicado " + description + "tiene un tamaño mayor a 2MB. \n\n"
			+ "En consecuencia puede demorar en subir al servidor.\n\n¿Está seguro de que desea utilizar este archivo?\n\n"
			+ "Tamaño del archivo: " + fileKBytes + "KBytes.")) {
			ele.focus();
			return false;
		}
	}
	return true;
}

function checkFile(id, description, type, maxSize) {
	if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
		return true;
	}
	if (checkType(id, type, description) == false) {
		return false;
	}
	if (checkSize(id, maxSize, description) == false) {
		return false;
	}
	return true;
}

function checkType(id, type, description) {
	if (description != "") {
		description = "como " + description + " ";
	}
	var ele = $('#' + id);
	// valida tipo
	if (ele[0].files.length == 0) {
		return true;
	}
	var ftype = ele[0].files[0].type;
	var validTypes = new Array();
	var message = '';
	switch (type) {
		case 'img':
			validTypes = new Array('image/png', 'image/gif', 'image/jpeg', 'image/pjpeg');
			message = "El archivo indicado " + description + "debe ser de tipo PNG, GIF o JPG.";
			break;
		case 'xls':
			validTypes = new Array('application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
			message = "El archivo indicado " + description + "debe ser un documento de tipo Microsoft Excel (xls/xlsx).";
			break;
		case 'pdf':
			validTypes = new Array('application/pdf', 'image/pdf');
			message = "El archivo indicado " + description + "debe ser un documento de tipo Actobat PDF (pdf).";
			break;
		case 'pdfdoc':
			validTypes = new Array('application/pdf', 'image/pdf', 'application/msword',
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
			message = "El archivo indicado " + description + "debe ser un documento de tipo Acrobat PDF (pdf) o Microsoft Word (doc/docx).";
			break;
		case 'pdfdocppt':
			validTypes = new Array('application/pdf', 'image/pdf', 'application/msword',
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
				"application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
				"application/vnd.openxmlformats-officedocument.presentationml.slideshow");
			message = "El archivo indicado " + description
				+ "debe ser un documento de tipo Acrobat PDF (pdf), Microsoft Word (doc/docx) o Microsoft PowerPoint (ppt, pptx, pps o ppsx).";
			break;
		default:
			alert('Invalid validation type');
			return false;
	}
	if (in_array(ftype, validTypes)) {
		return true;
	}
	var ext = getFileExtension(ele[0].files[0].name).toLowerCase();
	var ftypeExt = getMimeTypeByExtension(ext);
	if (in_array(ftypeExt, validTypes)) {
		return true;
	}
	ele.focus();
	alert(message);
	return false;
}

function getMimeTypeByExtension(ext) {
	switch (ext) {
		case 'gif':
			return 'image/gif';
		case 'png':
			return 'image/png';
		case 'xls':
			return 'application/vnd.ms-excel';
		case 'xlsx':
			return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
		case 'jpeg':
		case 'jpg':
			return 'image/jpeg';
		case 'doc':
			return 'application/msword';
		case 'docx':
			return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
		case 'pdf':
			return 'application/pdf';
		default:
			return 'unrecognized';
	}
}

function in_array(obj, a) {
	for (var i = 0; i < a.length; i++) {
		if (a[i] === obj) {
			return true;
		}
	}
	return false;
}

function getFileExtension(filename) {
	var a = filename.split(".");
	if (a.length === 1 || (a[0] === "" && a.length === 2)) {
		return "";
	}
	return a.pop();
}

function endsWith(cad, suffix) {
	var a = (cad + "");
	var b = (suffix + "");
	return a.lastIndexOf(b, a.length - b.length) !== -1;
}


function replaceGroup(cad, str, s2) {
	for (var i = 0, len = str.length; i < len; i++) {
		cad = cad.replace(str[i], s2);
	}
	return cad;
}

function openEvent(url) {
	window.open(url);
	return false;
}

function openDoc(url) {
	window.open(url);
	return false;
}

function confirmDelete() {
	return confirm('Se procederá a eliminar en forma permanente el ítem seleccionado.\n\n¿Está seguro de que desea hacer esto?');
}

function confirmManyDelete(n) {
	if (n == 1)
		return confirmDelete();
	else
		return confirm('Se procederá a eliminar en forma permanente los ' + n + ' items seleccionados.\n\n¿Está seguro de que desea hacer esto?');
}

function setElementHide(ele, value) {
	if (value) {
		setElementDisplay(ele, 'none');
	} else {
		setElementDisplay(ele, 'inline');
	}
}

function setElementDisplay(eleId, visibility) {
	var ele = getElement(eleId);
	if (!ele) {
		alert('No existe el elemento ' + eleId);
		return;
	}

	ele.style.display = visibility;
}

function getElementDisplay(eleId) {
	var ele = getElement(eleId);
	return ele.style.display;
}

function setElementVisiblity(eleId, visibility) {
	var ele = getElement(eleId);
	ele.style.visibility = visibility;
}

function setVisibility(eleId, visibility) {
	var ele = getElement(eleId);
	if (ele == null) { alert('no encontrado: ' + eleId); }
	ele.style.display = visibility;
}

function setOrderIdAndSetVisibility(id) {
	var minItemCount = 3;
	var sel = document.getElementById('orderId');
	if (!selectSetByValue('orderId', id)) {
		if (id == -2) {
			sel.selectedIndex = 0;
		} else {
			sel.selectedIndex = sel.options.length - 1;
		}
		minItemCount--;
	}
	if (sel.options.length == minItemCount) {
		var loc = document.getElementById('location');
		loc.style.display = "none";
	}
}

function deletePDF() {
	// setea el hidden
	var imgHidden = getElement('pdfDelete');
	imgHidden.value = '1';
	// blanquea
	var imgPrev = getElement('pdfPreview');
	imgPrev.style.display = "none";
	// upload
	var fldup = getElement('pdf');
	fldup.style.display = "block";
}

function deletePPT() {
	// setea el hidden
	var imgHidden = getElement('pptDelete');
	imgHidden.value = '1';
	// blanquea
	var imgPrev = getElement('pptPreview');
	imgPrev.style.display = "none";
	// upload
	var fldup = getElement('ppt');
	fldup.style.display = "block";
}

function setSelectByText(selectName, optionText) {
	var sel = document.getElementById(selectName);
	for(var i, j = 0; i = sel.options[j]; j++) {
		if(i.text == optionText) {
			sel.selectedIndex = j;
			break;
		}
	}
}

function parentCloseAndReload() {
	var loc = parent.document.location.href;
	loc = removeURLParameter(loc + "", "vs");
	if (loc.indexOf("?") == -1) { loc += "?"; }
	parent.document.location.href = loc + getvs() + "&r=" + Math.random();
	$.fancybox.close();
}

function appendParam(url, param, value) {
	var ret = url + "";
	if (ret.indexOf("?") == -1) {
		ret += "?";
	} else {
		ret += "&";
	}
	ret += param;
	if (value != "") {
		ret += "=" + encodeURIComponent(value);
	}
	return ret;
}

function closeAndSubmit(frameTarget, extraParam) {
	var loc = document.location.href;
	loc = removeURLParameter(loc + "", "vs");
	if (loc.indexOf("?") == -1) { loc += "?"; }
	var target = loc + getvs() + "&r=" + Math.random() + "&" + extraParam;
	if (frameTarget) {
		var element = getElement(frameTarget);
		if (element) {
			target = appendParam(target, "frame", frameTarget);
			$("#" + frameTarget).load(target);
		} else {
			document.location.href = target;
		}
	} else {
		document.location.href = target;
	}
	$.fancybox.close();
}

function removeURLParameter(url, parameter) {
	var i = url.indexOf("&" + parameter + "=");
	if (i > 0) {
		return url.substring(0, i);
	} else {
		return url;
	}
}

function setFocusPopup(ele) {
	setTimeout(function () {
		getElement(ele).focus();
	}, 50);
}

function setvs(y) {
	window.scrollTo(0, y);
}

function getvs() {
	return "&vs=" + ((window.pageYOffset !== undefined) ? window.pageYOffset :
		(document.documentElement || document.body.parentNode || document.body).scrollTop);
}

function getRadioValue(radioName) {
	var radios = document.getElementsByName(radioName);
	var length = radios.length;
	for (var i = 0; i < length; i++) {
		if (radios[i].checked) {
			return (radios[i].value);
		}
	}
}

function getCheckValue(radioName) {
	var radios = document.getElementsByName(radioName);
	var length = radios.length;
	for (var i = 0; i < length; i++) {
		if (radios[i].checked) {
			return (radios[i].value);
		}
	}
}

function trimString(cad) {
	cad = '' + cad;
	return cad.replace(/\s/g, "");
}
function isHidden(element) {
	var el = getElement(element);
	return (el.offsetParent === null);
}
// Obtener selección
function getElement(element) {
	var ele = document.getElementById(element);
	if (!ele) { ele = document.getElementsByName(element)[0]; }
	return ele;
}

function exists(element) {
	var ele = document.getElementById(element);
	if (!ele) {
		return false;
	} else {
		return true;
	}
}

function setFocus(selectName) {
	var sel = getElement(selectName);
	if (sel) {
		sel.focus();
	}
}

function getSelectValueOrEmpty(selectName) {
	var sel = getElement(selectName);
	if (!sel) {
		return "";
	}
	if (sel.options.length == 0) { return "-1"; }
	if (sel.selectedIndex == -1) { return ""; }
	return sel.options[sel.selectedIndex].value;
}

function setSelectValue(sel, val) {
	var selectbox = getElement(sel);
	if (!selectbox) {
		alert('Elemento no encontrado: ' + sel);
		return;
	}
	var i = selectGetIndexByValue(sel, val);
	if (i != -1) {
		selectbox.selectedIndex = i;
	}
}

function getSelectValue(selectName) {
	var sel = getElement(selectName);
	if (!sel) {
		alert('No existe el elemento ' + selectName);
		return "-1";
	}
	if (sel.options.length == 0) { return "-1"; }
	if (sel.selectedIndex == -1) { return ""; }
	return sel.options[sel.selectedIndex].value;
}

function getSelectElementValue(sel) {
	if (sel.options.length == 0) { return "-1"; }
	if (sel.selectedIndex == -1) { return ""; }
	return sel.options[sel.selectedIndex].value;
}

function getSelectText(selectName) {
	var sel = getElement(selectName);
	if (!sel) {
		alert('No existe el elemento ' + selectName);
		return "-1";
	}
	if (sel.options.length == 0) { return ""; }
	return sel.options[sel.selectedIndex].text;
}

function getOptionValue(selectName) {
	for (var n = 1; n < 100; n++) {
		var sel = getElement(selectName + "_" + n);
		if (!sel) { return ""; }
		if (sel.checked) {
			return sel.value;
		}
	}
}

function getTextValue(textName) {
	var sel = getElement(textName);
	if (!sel) {
		alert('La validación sobre el campo ' + textName + ' no pudo realizarse.');
		return '';
	}
	return sel.value.trim();
}

function validateEmail(text) {
	var atpos = text.indexOf("@");
	var dotpos = text.lastIndexOf(".");

	var commapos = text.lastIndexOf(",");
	var quotepos = text.lastIndexOf("'");
	var doublequote = text.lastIndexOf("\"");

	if (atpos < 1 || dotpos < atpos + 2 || dotpos + 2 >= text.length || commapos >= 0
		|| quotepos >= 0 || doublequote >= 0) {
		return false;
	} else {
		return true;
	}
}

// Validation
function checkSelectHasValue(selectName, selectCaption) {
	if (!selectHasNotNullValue(selectName)) {
		alert('Debe indicar un valor para ' + selectCaption + '.');
		setFocus(selectName);
		return false;
	}
	return true;
}

function checkSelectHasNotNullValue(selectName, selectCaption) {
	if (!selectHasNotNullValue(selectName)) {
		alert('Debe indicar un valor para ' + selectCaption + '.');
		setFocus(selectName);
		return false;
	}
	return true;
}

function checkSelectHasNonLine(selectName, selectCaption) {
	if (!selectHasNonLine(selectName)) {
		alert('Debe indicar un valor para ' + selectCaption + '.');
		setFocus(selectName);
		return false;
	}
	return true;
}

function checkOptionHasValue(selectName, selectCaption) {
	if (!optionHasValue(selectName)) {
		alert('Debe indicar un valor para ' + selectCaption + '.');
		setFocus(selectName);
		return false;
	}
	return true;
}

function checkLink(textName) {
	var link = getTextValue(textName);
	if(link.length < 5
		|| link.indexOf('.') === -1
		|| link.indexOf(' ') !== -1) {
		alert('La dirección externa no es válida, debe ser un link a una página web.');
		setFocus(textName);
		return false;
	}
	return true;
}

function selectHasNonLine(selectName) {
	return (getSelectValue(selectName).substring(0,2) != '--');
}

function selectHasValue(selectName) {
	return (getSelectValue(selectName) != '-1');
}

function selectHasNotNullValue(selectName) {
	return (getSelectValue(selectName) != '');
}

function checkCheckHasValue(selectName) {
	var sel = getElement(selectName);
	return sel.checked;
}

function textHasValue(selectName) {
	return (getTextValue(selectName) != '');
}

function optionHasValue(selectName) {
	return (getOptionValue(selectName) != '');
}

function textHasEmail(selectName) {
	return validateEmail(getTextValue(selectName));
}

function checkSearch() {
	if (checkTextHasValue("q", "un criterio de búsqueda") == false) {
		return false;
	}
	if (getTextValue("q").length < 4) {
		alert('El criterio de búsqueda debe tener al menos 4 caracteres.');
		return false;
	}
	return true;
}

function clearPassword(selectName) {
	setTimeout("getElement('" + selectName + "').value = '';", 50);
	var ele = getElement(selectName);
	ele.value = '';
}

function checkFileHasValue(selectName, selectCaption) {
	if (!textHasValue(selectName) && getElementDisplay(selectName) != 'none') {
		alert('Debe indicar un valor para ' + selectCaption + '.');
		setFocus(selectName);
		return false;
	}
	return true;
}

function checkModerateRange(element, selectCaption) {
	var eleTo = 'accept' + element + 'To';
	var eleFrom = 'moderate' + element + 'From';

	var to = getTextValue(eleTo);
	var from = getTextValue(eleFrom);

	if (dateFromText(from) <= dateFromText(to)) {
		alert('La fecha de inicio para la moderación de '
			+ selectCaption + ' es anterior a la fecha '
			+ 'de finalización de la recepción de ' + selectCaption
			+ '.\n\nEsto no está permitido ya que los períodos de recepción y evaluación no deben superponerse.');
		setFocus(eleFrom);
		return false;
	}
	return true;
}

function checkRangeHasValue(element, selectCaption) {
	var eleFrom = element + 'From';
	var eleTo = element + 'To';
	if (!checkTextHasValue(eleFrom, 'una fecha de inicio (desde) en el plazo para ' + selectCaption)) {
		return false;
	}
	if (!checkTextHasValue(eleTo, 'una fecha de finalización (hasta) en el plazo para ' + selectCaption)) {
		return false;
	}
	var from = getTextValue(eleFrom);
	var to = getTextValue(eleTo);
	if (from == '') {
		alert ("La fecha de inicio (desde) en el plazo para " + selectCaption + " no tiene el formato 'dd/mm/aaaa'.");
		setFocus(eleFrom);
		return false;
	}
	if (to == '') {
		alert("La fecha de finalización (hasta) en el plazo para " + selectCaption + " no tiene el formato 'dd/mm/aaaa'.");
		setFocus(eleTo);
		return false;
	}

	if (dateFromText(from) > dateFromText(to)) {
		alert('La fecha de inicio (desde) es posterior a la fecha de finalización (hasta).');
		setFocus(eleFrom);
		return false;
	}
	return true;
}

function dateFromText(date) {
	date = date.replace('-', '/');
	var parts = date.split("/");
	if (parts.length < 3) {
		return "";
	} else {
		return new Date(parts[2], parts[1] - 1, parts[0]);
	}
}

function checkCheckChecked(selectName, selectCaption) {
	if (!checkCheckHasValue(selectName)) {
		alert('Debe ' + selectCaption + '.');
		setFocus(selectName);
		return false;
	}
	return true;
}

function checkTextHasValue(selectName, selectCaption, size) {
	if (!textHasValue(selectName)) {
		alert('Debe indicar un valor para ' + selectCaption + '.');
		setFocus(selectName);
		return false;
	}
	if (typeof size !== 'undefined') {
		if (!checkTextHasLength(selectName, selectCaption, size)) {
			return false;
		}
	}
	return true;
}

function checkTextHasLength(selectName, selectCaption, size) {
	if (getTextValue(selectName).length < size) {
		alert('Debe indicar un valor para ' + selectCaption + ' de al menos ' + size + ' caracteres de longitud.');
		setFocus(selectName);
		return false;
	}
	return true;
}

function arrayContains(arr, k) {
	var i = arr.length;
	while (i--) {
		if (arr[i] + "" == k + "") {
			return true;
		}
	}
	return false;
}

function checkHasValue(eleName, selectCaption) {
	var ele = getElement(eleName);
	if (ele.type == 'text' || ele.type == 'textarea' ) {
		return checkTextHasValue(eleName, selectCaption);
	} else {
		return checkSelectHasValue(eleName, selectCaption);
	}
}

function validateNamesAndEmails(field, fieldCount, usePreffix) {
	var preffix = '';
	if (usePreffix) { preffix = field; }
	for (var n = 1; n <= fieldCount; n++)
		{
		var hasAffiliation = getElement(preffix + 'affiliation' + n) && textHasValue(preffix + 'affiliation' + n);
		if (textHasValue(preffix + 'email' + n) && !checkTextHasEmail(preffix + 'email' + n, 'una dirección de correo electrónico'))
		{
			return false;
		}
		if ((textHasValue(preffix + 'email' + n) ||
			hasAffiliation) && !textHasValue(field + n)) {
			setFocus(field + n);
			alert('Debe indicar un nombre.');
			return false;
		}
	}
	return true;
}

function validateHasOneEmail(fieldCount) {
	var hasMail = false;
	for (var n = 1; n <= fieldCount; n++) {
		if (textHasValue('email' + n)) {
			hasMail = true;
		}
	}
	if (hasMail == false) {
		setFocus('email1');
		alert('Debe indicar al menos una dirección electrónico de contacto.');
		return false;
	}
	return true;
}

function hasValue(eleName) {
	var ele = getElement(eleName);
	if (ele.type == 'text' || ele.type == 'textarea') {
		return textHasValue(eleName);
	} else {
		return selectHasNotNullValue(eleName);
	}
}

function fillSelect(cmb, valores) {
	removeOptions(cmb);
	var sel = document.getElementById(cmb);

	for (var i = 0; i < valores.length; i++) {
		var opt = document.createElement('option');
		opt.value = valores[i++];
		opt.innerHTML = valores[i];
		sel.appendChild(opt);
	}
}

function selectValueExists(sel, val) {
	var selectbox = getElement(sel);
	var i;
	for (i = selectbox.options.length - 1; i >= 0; i--) {
		if (selectbox.options[i].value == val) {
			return true;
		}
	}
	return false;
}

function selectGetIndexByValue(sel, val) {
	var selectbox = getElement(sel);
	if (!selectbox) {
		alert('Elemento no encontrado: ' + sel);
		return;
	}
	var i;
	for (i = selectbox.options.length - 1; i >= 0; i--) {
		if (selectbox.options[i].value == val) {
			return i;
		}
	}
	return -1;
}

function selectGetTextByValue(sel, val) {
	var selectbox = getElement(sel);
	if (!selectbox) {
		alert('Elemento no encontrado: ' + sel);
		return;
	}
	var i;
	for (i = selectbox.options.length - 1; i >= 0; i--) {
		if (selectbox.options[i].value == val) {
			return selectbox.options[i].text;
		}
	}
	return '(Eliminado)';
}

function removeOptions(sel) {
	var selectbox = getElement(sel);
	var i;
	for (i = selectbox.options.length - 1; i >= 0; i--) {
		selectbox.remove(i);
	}
}

function removeOptionSelected(sel, val) {
	var selectbox = getElement(sel);
	if (selectbox.selectedIndex < 0) { return; }
	val = getSelectValue(sel);
	removeOptionByValue(sel, val);
}

function removeOptionByValue(sel, val) {
	var selectbox = getElement(sel);
	var i;
	var keep = selectbox.selectedIndex;
	for (i = selectbox.options.length - 1; i >= 0; i--) {
		if (selectbox.options[i].value == val) {
			selectbox.remove(i);
		}
	}
	if (keep < selectbox.options.length) {
		selectbox.selectedIndex = keep;
	}
}

function selectSetByValue(cmb, valor) {
	var sel = document.getElementById(cmb);
	for (var i, j = 0; i = sel.options[j]; j++) {
		if (i.value == valor) {
			sel.selectedIndex = j;
			return true;
		}
	}
	return false;
}

function subscribeToRadioItems(form, field, fn) {
	var rad = document.forms[form][field];
	for (var i = 0; i < rad.length; i++) {
		rad[i].onclick = fn;
	}
}

function selectSelectItemByValue(cmb, valor, newValue) {
	var sel = document.getElementById(cmb);
	for (var i, j = 0; i = sel.options[j]; j++) {
		if (i.value == valor) {
			i.selected = newValue;
			return true;
		}
	}
	return false;
}

function startRichEdits() {
	bkLib.onDomLoaded(function () { nicEditors.allTextAreas({ maxHeight: 200 }); });
}

function startNewRichEdits(cwidth) {
	if(typeof cwidth === "undefined") {
		cwidth = 842;
	}
	bkLib.onDomLoaded(function () {
		CKEDITOR.replace('content', {
			width: cwidth	});
	});
}

function detectIE() {
	var ua = window.navigator.userAgent;
	var msie = ua.indexOf('MSIE ');
	var trident = ua.indexOf('Trident/');

	if (msie > 0) {
		// IE 10 or older => return version number
		return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
	}

	if (trident > 0) {
		// IE 11 (or newer) => return version number
		var rv = ua.indexOf('rv:');
		return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
	}

	// other browser
	return false;
}

function isIE() {
	var ua = window.navigator.userAgent;
	var msie = ua.indexOf('MSIE ');
	var trident = ua.indexOf('Trident/');

	if (msie > 0) {
		// IE 10 or older => return version number
		return true;
	}

	if (trident > 0) {
		// IE 11 (or newer) => return version number
		return true;
	}

	// other browser
	return false;
}

function getPlural(n) {
	return (n == 1 ? "" : "s");
}

function startAutoCompleteLocal(field, possible) {
	$('#' + field).devbridgeAutocomplete({
		lookup: possible,
		lookupLimit: 8
	});
}

function htmlEscape(str) {
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

function escapeRegExChars(value) {
	return value.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function highlightStrong(text, currentValue) {
	var pattern = '(' + escapeRegExChars(currentValue) + ')';

	return text.replace(new RegExp(pattern, 'gi'), '<strong>$1<\/strong>');
}

function startAutoCompleteRemote(field, url) {
	$('#' + field).devbridgeAutocomplete({
		serviceUrl: url,
		formatResult: function (suggestion, currentValue) {
			return "<div class='autocomplete-data'>" + highlightStrong(htmlEscape(suggestion.data), currentValue)
				+ "<div class='autocomplete-fading'>&nbsp;</div></div>" + highlightStrong(htmlEscape(suggestion.value), currentValue);
		},
		lookupLimit: 8
	});
}

function bindRadio(ele, fn) {
	var rad = getElement(ele);
	for (var i = 0; i < rad.length; i++) {
		rad[i].onclick = fn;
	}

}

function onOauthClick(form, url, terms) {
	if(terms && !checkCheckChecked('reg_terms', "aceptar los 'Términos y condiciones' para poder continuar")) {
		return false;
	}

	var keepAction = form.attr('action');
	var keepOnsubmit = form.attr('onsubmit');
	var keepTarget = form.attr('target');
	if (!keepTarget) { keepTarget = ''; }

	form.attr('action', url);
	form.attr('onsubmit', 'return true;');
	form.attr('target', 'openAuthWin');
	if (keepWindow != null) { keepWindow.close(); }
	var w = window.open('about:blank','openAuthWin',
		'toolbar=0,scrollbars=1,location=0,statusbar=0,menubar=0,resizable=0,width=600,height=450,'
		// + 'left = 312,top = 234'
	);
	keepWindow = w;
	form.submit();

	form.attr('action', keepAction);
	form.attr('onsubmit', keepOnsubmit);
	form.attr('target', keepTarget);

	return false;
}
