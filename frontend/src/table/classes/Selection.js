/**
 * Selection — una selección concreta dentro de un indicador multi-censo: un censo
 * (Version) con UN nivel y UNA variable resueltos dentro de ese censo, más la
 * selección de categorías (labels) y si incluye el total.
 *
 * Cada censo es un sistema geográfico propio: su nivel "Provincias" tiene su
 * propio GeographyId, distinto del de otro censo. Por eso el drill y la resolución
 * de datos se hacen POR selección, nunca con un puntero único compartido.
 *
 * La variable se identifica lógicamente por su Name (es lo que el usuario ve como
 * "la variable"); su instancia física difiere entre censos. La Selection mantiene
 * SIEMPRE una variable cuyo Name coincide con la variable lógica pedida.
 */

export default Selection;

function Selection(version, level, variable) {
	this.version = version;
	this.level = level;
	this.variable = variable;
	this.labels = [];          // labelIds de categorías elegidas (vacío = solo total)
	this.includeTotal = true;
}

Selection.prototype.Version = function () { return this.version; };
Selection.prototype.Level = function () { return this.level; };
Selection.prototype.Variable = function () { return this.variable; };

Selection.prototype.versionId = function () { return this.version.Version.Id; };
Selection.prototype.versionName = function () { return this.version.Version.Name; };
Selection.prototype.levelName = function () { return this.level.Name; };
Selection.prototype.geographyId = function () { return this.level.GeographyId; };

// Mueve esta selección al nivel de nombre dado, dentro de SU propio censo. Si ese
// censo no tiene un nivel con ese nombre, no cambia (su columna no aplica a ese
// nivel de desagregación; el render lo marcará). Devuelve true si cambió.
Selection.prototype.moveToLevelNamed = function (levelName) {
	var levels = this.version.Levels;
	for (var i = 0; i < levels.length; i++) {
		if (levels[i].Name === levelName) {
			if (this.level === levels[i]) return false;
			this.level = levels[i];
			this._reconcileVariable();
			return true;
		}
	}
	return false;
};

// ¿Este censo tiene un nivel con ese nombre? (para saber si la selección puede
// representar ese nivel de desagregación).
Selection.prototype.hasLevelNamed = function (levelName) {
	var levels = this.version.Levels;
	for (var i = 0; i < levels.length; i++) if (levels[i].Name === levelName) return true;
	return false;
};

// Tras cambiar de nivel, reengancha la variable a una del mismo Name en el nuevo
// nivel (la instancia física cambia entre niveles). Si el nuevo nivel no tiene esa
// variable lógica, conserva la referencia anterior; la disponibilidad real de
// datos la evalúa la pivot a partir de las regiones.
Selection.prototype._reconcileVariable = function () {
	var wanted = this.variable.Name;
	var vars = this.level.Variables;
	for (var i = 0; i < vars.length; i++) {
		if (vars[i].Name === wanted) { this.variable = vars[i]; return; }
	}
};

// Índice posicional del nivel y variable dentro del censo (para serializar a URL).
Selection.prototype.levelIndex = function () {
	return this.version.Levels.indexOf(this.level);
};
Selection.prototype.variableIndex = function () {
	return this.level.Variables.indexOf(this.variable);
};
