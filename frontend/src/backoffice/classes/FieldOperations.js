export default FieldOperations;

var OperandType = Object.freeze({ NUMBER: 'number', TEXT: 'text' });
var OperandSource = Object.freeze({ VALUE: 'value', NULL: 'null' });
var EncodedOperand = Object.freeze({ VALUE: 'V', NULL: 'N', COLUMN: 'C' });

var NUMBER = OperandType.NUMBER;
var TEXT = OperandType.TEXT;

// Un operando numérico puede elegirse entre estas constantes; su Id lleva el prefijo
// que permite distinguirlas de [Valor], [Nulo] y de los Ids de las columnas.
var CONSTANT_PREFIX = 'const:';
var constants = [1, 10, 100];

// Count y Types describen los operandos de cada operación; Key es el
// identificador con que se la envía al servidor. Group define el separador bajo
// el que se lista y AllowNull indica si se admite [Nulo] como operando.
// Las operaciones se separan según el tipo de su resultado: cada una solo se
// ofrece para columnas de ese tipo.
var numericOperations = [
	{
		Key: 'impute', Group: 'Aritméticas', Caption: 'Asignar(número)', Count: 1, Types: [NUMBER], Labels: ['Número'], AllowNull: true,
		Description: 'Imputa a la columna el valor numérico indicado.'
	},
	{
		Key: 'add', Group: 'Aritméticas', Caption: 'Suma(número1, número2)', Count: 2, Types: [NUMBER, NUMBER], Labels: ['Número 1', 'Número 2'],
		Description: 'Adiciona dos valores numéricos retornando su resultado.'
	},
	{
		Key: 'subtract', Group: 'Aritméticas', Caption: 'Resta(número1, número2)', Count: 2, Types: [NUMBER, NUMBER], Labels: ['Número 1', 'Número 2'],
		Description: 'Sustrae el segundo valor numérico del primero retornando su resultado.'
	},
	{
		Key: 'divide', Group: 'Aritméticas', Caption: 'Divide(número1, número2)', Count: 2, Types: [NUMBER, NUMBER], Labels: ['Número 1', 'Número 2'],
		Description: 'Divide el primer valor numérico por el segundo retornando su resultado.'
	},
	{
		Key: 'multiply', Group: 'Aritméticas', Caption: 'Multiplica(número1, número2)', Count: 2, Types: [NUMBER, NUMBER], Labels: ['Número 1', 'Número 2'],
		Description: 'Multiplica dos valores numéricos retornando su resultado.'
	},
	{
		Key: 'mod', Group: 'Aritméticas', Caption: 'Resto(número1, número2)', Count: 2, Types: [NUMBER, NUMBER], Labels: ['Número 1', 'Número 2'],
		Description: 'Retorna el resto de dividir el primer valor numérico por el segundo.'
	},
	{
		Key: 'percent', Group: 'Aritméticas', Caption: 'Porcentaje(número1, número2)', Count: 2, Types: [NUMBER, NUMBER], Labels: ['Número 1', 'Número 2'],
		Description: 'Divide el primer valor numérico por el segundo y multiplica el resultado por 100.'
	},
	{
		Key: 'int', Group: 'Aritméticas', Caption: 'Entero(número)', Count: 1, Types: [NUMBER], Labels: ['Número'],
		Description: 'Retorna la parte entera de un valor numérico, descartando sus decimales.'
	},
	{
		Key: 'abs', Group: 'Aritméticas', Caption: 'Absoluto(número)', Count: 1, Types: [NUMBER], Labels: ['Número'],
		Description: 'Retorna el valor absoluto de un valor numérico.'
	},
	{
		Key: 'equals', Group: 'Comparación', Caption: 'EsIgual(valor, contra)', Count: 2, Types: [NUMBER, NUMBER], Labels: ['Comparar', 'Contra'], AllowNull: true,
		Description: 'Retorna 1 si el primer valor es igual al segundo y 0 en caso contrario. Dos valores nulos se consideran iguales.'
	},
	{
		Key: 'notEquals', Group: 'Comparación', Caption: 'EsDistinto(valor, contra)', Count: 2, Types: [NUMBER, NUMBER], Labels: ['Comparar', 'Contra'], AllowNull: true,
		Description: 'Retorna 1 si el primer valor es distinto del segundo y 0 en caso contrario. Un valor nulo se considera distinto de cualquier valor no nulo.'
	},
	{
		Key: 'greater', Group: 'Comparación', Caption: 'EsMayor(valor, contra)', Count: 2, Types: [NUMBER, NUMBER], Labels: ['Comparar', 'Contra'],
		Description: 'Retorna 1 si el primer valor es mayor que el segundo y 0 en caso contrario. Retorna nulo si alguno de los valores es nulo.'
	},
	{
		Key: 'less', Group: 'Comparación', Caption: 'EsMenor(valor, contra)', Count: 2, Types: [NUMBER, NUMBER], Labels: ['Comparar', 'Contra'],
		Description: 'Retorna 1 si el primer valor es menor que el segundo y 0 en caso contrario. Retorna nulo si alguno de los valores es nulo.'
	},
	{
		Key: 'between', Group: 'Comparación', Caption: 'EnRango(valor, desde, hasta)', Count: 3, Types: [NUMBER, NUMBER, NUMBER], Labels: ['Valor', 'Desde', 'Hasta'],
		Description: 'Retorna 1 si el valor se encuentra entre desde y hasta, ambos inclusive, y 0 en caso contrario. Retorna nulo si alguno de los valores es nulo.'
	},
	{
		Key: 'equalsText', Group: 'Comparación', Caption: 'EsIgualCadena(cadena, contra)', Count: 2, Types: [TEXT, TEXT], Labels: ['Comparar', 'Contra'], AllowNull: true,
		Description: 'Retorna 1 si la primera cadena es igual a la segunda y 0 en caso contrario. Dos valores nulos se consideran iguales.'
	},
	{
		Key: 'notEqualsText', Group: 'Comparación', Caption: 'EsDistintoCadena(cadena, contra)', Count: 2, Types: [TEXT, TEXT], Labels: ['Comparar', 'Contra'], AllowNull: true,
		Description: 'Retorna 1 si la primera cadena es distinta de la segunda y 0 en caso contrario. Un valor nulo se considera distinto de cualquier valor no nulo.'
	},
	{
		Key: 'greaterText', Group: 'Comparación', Caption: 'EsMayorCadena(cadena, contra)', Count: 2, Types: [TEXT, TEXT], Labels: ['Comparar', 'Contra'],
		Description: 'Retorna 1 si la primera cadena es mayor que la segunda y 0 en caso contrario. Retorna nulo si alguno de los valores es nulo.'
	},
	{
		Key: 'lessText', Group: 'Comparación', Caption: 'EsMenorCadena(cadena, contra)', Count: 2, Types: [TEXT, TEXT], Labels: ['Comparar', 'Contra'],
		Description: 'Retorna 1 si la primera cadena es menor que la segunda y 0 en caso contrario. Retorna nulo si alguno de los valores es nulo.'
	},
	{
		Key: 'betweenText', Group: 'Comparación', Caption: 'EnRangoCadena(cadena, desde, hasta)', Count: 3, Types: [TEXT, TEXT, TEXT], Labels: ['Cadena', 'Desde', 'Hasta'],
		Description: 'Retorna 1 si la cadena se encuentra entre desde y hasta, ambos inclusive, y 0 en caso contrario. Retorna nulo si alguno de los valores es nulo.'
	},
	{
		Key: 'value', Group: 'Texto', Caption: 'Valor(cadena)', Count: 1, Types: [TEXT], Labels: ['Cadena'],
		Description: 'Convierte una cadena en su valor numérico. Retorna nulo si la cadena comienza con un texto, salvo que sea un \"-\", que se reconoce como número negativo.'
	},
	{
		Key: 'length', Group: 'Texto', Caption: 'Largo(cadena)', Count: 1, Types: [TEXT], Labels: ['Cadena'],
		Description: 'Retorna la cantidad de caracteres de la cadena.'
	}
];

var textOperations = [
	{
		Key: 'imputeText', Group: 'Texto', Caption: 'AsignarCadena(cadena)', Count: 1, Types: [TEXT], Labels: ['Cadena'], AllowNull: true,
		Description: 'Imputa a la columna la cadena indicada, tal cual se recibe.'
	},
	{
		Key: 'concat', Group: 'Texto', Caption: 'Concatenar(cadena1, cadena2)', Count: 2, Types: [TEXT, TEXT], Labels: ['Cadena 1', 'Cadena 2'],
		Description: 'Une dos cadenas en una sola, retornando su resultado.'
	},
	{
		Key: 'left', Group: 'Texto', Caption: 'Izquierda(cadena, longitud)', Count: 2, Types: [TEXT, NUMBER], Labels: ['Cadena', 'Longitud'],
		Description: 'Retorna los primeros caracteres de la cadena, en la cantidad indicada en longitud.'
	},
	{
		Key: 'right', Group: 'Texto', Caption: 'Derecha(cadena, longitud)', Count: 2, Types: [TEXT, NUMBER], Labels: ['Cadena', 'Longitud'],
		Description: 'Retorna los últimos caracteres de la cadena, en la cantidad indicada en longitud.'
	},
	{
		Key: 'substring', Group: 'Texto', Caption: 'Subcadena(cadena, desde, longitud)', Count: 3, Types: [TEXT, NUMBER, NUMBER], Labels: ['Cadena', 'Desde', 'Longitud'],
		Description: 'Retorna la porción de la cadena que comienza en la posición desde (base cero) y abarca la cantidad de caracteres indicada en longitud.'
	},
	{
		Key: 'trim', Group: 'Texto', Caption: 'Trim(cadena)', Count: 1, Types: [TEXT], Labels: ['Cadena'],
		Description: 'Elimina los espacios del inicio y del final de la cadena.'
	},
	{
		Key: 'string', Group: 'Texto', Caption: 'Cadena(número)', Count: 1, Types: [NUMBER], Labels: ['Número'],
		Description: 'Convierte un valor numérico en una cadena.'
	}
];

// El desplegable identifica sus ítems por Id, igual que los separadores.
numericOperations.concat(textOperations).forEach(function (operation) {
	operation.Id = operation.Key;
});

function FieldOperations() {
};

FieldOperations.OperandType = OperandType;
FieldOperations.OperandSource = OperandSource;
FieldOperations.EncodedOperand = EncodedOperand;

FieldOperations.prototype.GetAll = function (dataset, isText) {
	var source = (isText ? textOperations : numericOperations);
	var ret = [];
	var group = null;
	for (var n = 0; n < source.length; n++) {
		if (source[n].Group !== group) {
			group = source[n].Group;
			ret = ret.concat(dataset.GetSeparator(group));
		}
		ret.push(source[n]);
	}
	return ret;
};

FieldOperations.prototype.GetByKey = function (key) {
	var all = numericOperations.concat(textOperations);
	for (var n = 0; n < all.length; n++) {
		if (all[n].Key === key) {
			return all[n];
		}
	}
	throw new Error("No existe la operación '" + key + "'.");
};

FieldOperations.prototype.GetDefault = function (isText) {
	return this.GetByKey(isText ? 'concat' : 'add');
};

FieldOperations.prototype.NewOperands = function (operation) {
	var operands = [];
	for (var n = 0; n < operation.Count; n++) {
		operands.push({ Source: OperandSource.VALUE, Value: '' });
	}
	return operands;
};

// Las variables especiales (población, hogares, etc.) solo se ofrecen para
// operandos numéricos de un dataset georreferenciado.
FieldOperations.prototype.GetOperandOptions = function (dataset, operation, index) {
	var type = operation.Types[index];
	var options = [].concat(dataset.GetSeparator('Valores'));
	var datasetColumns = [];
	if (type === NUMBER) {
		for (var n = 0; n < constants.length; n++) {
			options.push({ Id: CONSTANT_PREFIX + constants[n], Caption: String(constants[n]) });
		}
		options.push({ Id: OperandSource.VALUE, Caption: '[Valor]' });
		datasetColumns = dataset.GetNumericColumns();
	} else {
		options.push({ Id: OperandSource.VALUE, Caption: '[Texto]' });
		datasetColumns = dataset.GetTextColumns();
	}
	if (operation.AllowNull) {
		options.push({ Id: OperandSource.NULL, Caption: '[Nulo]' });
	}
	options = this.AppendGroup(options, dataset, 'Variables', datasetColumns);
	/*if (type === NUMBER && dataset.properties.Geocoded) {
		options = this.AppendGroup(options, dataset, 'Otras variables', dataset.GetRichColumns());
	}*/
	return options;
};

FieldOperations.prototype.AppendGroup = function (options, dataset, label, columns) {
	if (columns.length === 0) {
		return options;
	}
	return options.concat(dataset.GetSeparator(label), columns);
};

FieldOperations.prototype.Validate = function (operation, operands) {
	for (var n = 0; n < operation.Count; n++) {
		var operand = operands[n];
		if (operand.Source === OperandSource.VALUE && operation.Types[n] === NUMBER) {
			var text = String(operand.Value).trim();
			if (text === '' || isNaN(Number(text))) {
				return "Indique un valor numérico para '" + operation.Labels[n] + "'.";
			}
		}
	}
	return '';
};

FieldOperations.prototype.BuildOperands = function (operation, operands) {
	var ret = [];
	for (var n = 0; n < operation.Count; n++) {
		ret.push(this.EncodeOperand(operands[n], operation.Types[n]));
	}
	return ret;
};

FieldOperations.prototype.EncodeOperand = function (operand, type) {
	if (operand.Source === OperandSource.NULL) {
		return { t: EncodedOperand.NULL, v: null };
	}
	if (operand.Source === OperandSource.VALUE) {
		if (type === NUMBER) {
			return { t: EncodedOperand.VALUE, v: Number(operand.Value) };
		}
		return { t: EncodedOperand.VALUE, v: String(operand.Value) };
	}
	if (typeof operand.Source === 'string' && operand.Source.indexOf(CONSTANT_PREFIX) === 0) {
		return { t: EncodedOperand.VALUE, v: Number(operand.Source.substring(CONSTANT_PREFIX.length)) };
	}
	return { t: EncodedOperand.COLUMN, v: operand.Source };
};
