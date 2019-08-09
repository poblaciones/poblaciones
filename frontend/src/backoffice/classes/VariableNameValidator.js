import axios from 'axios';
import err from '@/common/js/err';
import str from '@/common/js/str';

export default VariableNameValidator;

function VariableNameValidator() {
};

VariableNameValidator.prototype.Validate = function (name) {
	var err = this.CheckContent(name);
	if (err !== '') return err;
	err = this.CheckRules(name);
	if (err !== '') return err;
	err = this.CheckEnding(name);
	if (err !== '') return err;
	err = this.CheckLength(name);
	return err;
};

VariableNameValidator.prototype.CheckEnding = function (name) {
	if (str.EndsWith(name, ".")) {
		return "El nombre de la variable no puede finalizar en '.'";
	}
	if (str.EndsWith(name, "_")) {
		return "El nombre de la variable no puede finalizar con '_'.";
	}
	return '';
};

VariableNameValidator.prototype.CheckRules = function (name) {
	// inicios
	var forbiddenStarts = [".", "_", "#", "$"];
	for (var n = 0; n < forbiddenStarts.length; n++) {
		if (name[0] === forbiddenStarts[n]) {
			return "El nombre de la variable no puede comenzar con '" + name[0] + "'.";
		}
	}
	var keywords = ["ALL", "AND", "BY", "EQ", "GE", "GT", "LE", "LT", "NE", "NOT", "OR", "TO", "WITH"];
	for (var n = 0; n < keywords.length; n++) {
		if (name.toUpperCase() === keywords[n]) {
			return "El nombre de la variable no puede coincidir con una palabra reservada (ALL, AND, BY, EQ, GE, GT, LE, LT, NE, NOT, OR, TO, WITH).";
		}
	}
	return '';
};

VariableNameValidator.prototype.CheckContent = function (name) {
	var validChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑŎÒÓÔÕÖØÙÚÛÜÝßàáâãäåæçèéêëìíîïðñòóôõöŏōøùúûüýÿabcdefghijklmnopqrstuvwxyz1234567890_@#.$';
	for (var i = 0; i < name.length; i++) {
		if (validChars.includes(name[i]) == false) {
			if (name[i] === ')' || name[i] === '(') {
				return "El nombre de la variable no puede contener paréntesis.";
			} else if (name[i] === ' ') {
				return "El nombre de la variable no puede contener espacios.";
			} else {
				return "El nombre de la variable no puede contener el caracter '" + name[i] + "'";
			}
		}
	}
	return '';
};

VariableNameValidator.prototype.CheckLength = function (name) {
	// cuenta la longitud de la cadena. Caracters no estándar cuentan como 2.
	var SPSS_LIMIT = 64;
	var effectiveLength = 0;
	for (var n = 0; n < name.length; n++) {
		if ((name[n] >= 'a' && name[n] <= 'z') || (name[n] >= 'A' && name[n] <= 'Z') ||
			(name[n] >= '0' && name[n] <= '9') || name[n] === '.' || name[n] === '_' || name[n] === '$' || name[n] === '@' || name[n] === '#') {
			effectiveLength++;
		} else {
			effectiveLength += 2;
		}
	}
	if (effectiveLength > SPSS_LIMIT) {
		return "El nombre de la variable no puede tener más de 64 caracteres. Los caracteres especiales (ej. acentuados, eñes) contabilizan como 2 caracteres.";
	}
	return '';
};
