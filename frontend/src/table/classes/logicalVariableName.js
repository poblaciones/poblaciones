/**
 * logicalVariableName — nombre lógico de una variable física dentro de su nivel.
 *
 * El servidor genera el Name de cada variable a partir de su columna de datos y su
 * normalización, de modo que dos variables del MISMO nivel pueden terminar con el
 * mismo Name (p. ej. la misma columna con y sin normalización, o dos fórmulas que
 * el usuario creó para probar). Para que cada una sea una variable lógica distinta
 * —y no se combinen en una sola entrada del combo, ni se mezclen sus datos— se las
 * desambigua por ORDEN de aparición entre sus homónimas del nivel: la primera
 * conserva el Name; la segunda recibe " #2"; la tercera " #3"; y así.
 *
 * El merge entre censos (años) sigue siendo por este nombre lógico, así que la
 * primera "Población" de un año empareja con la primera del otro, y una eventual
 * "Población #2" queda como variable lógica separada. En el caso sano (sin
 * homónimas en el nivel) devuelve el Name tal cual y nada cambia.
 *
 * Vive en su propio módulo para que lo compartan ActiveMultiselectedMetric y
 * Selection sin crear un ciclo de imports entre ellos.
 */

export default function logicalVariableName(level, variable) {
	if (!variable) return '';
	if (!level || !level.Variables) return variable.Name;
	var vars = level.Variables;
	var ordinal = 0;
	for (var i = 0; i < vars.length; i++) {
		if (vars[i] === variable) break;
		if (vars[i].Name === variable.Name) ordinal++;
	}
	return ordinal === 0 ? variable.Name : variable.Name + ' #' + (ordinal + 1);
}
