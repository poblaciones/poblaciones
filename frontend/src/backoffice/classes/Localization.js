
export default Localization;

function Localization() {
}

Localization.prototype.Get = function () {
	return {
			// separator of parts of a date (e.g. '/' in 11/05/1955)
			'/': '/',
			// separator of parts of a time (e.g. ':' in 05:44 PM)
			':': ':',
			// the first day of the week (0 = Sunday, 1 = Monday, etc)
			firstDay: 0,
			days: {
				// full day names
				names: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
				// abbreviated day names
				namesAbbr: ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'],
				// shortest day names
				namesShort: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']
			},
			months: {
				// full month names (13 months for lunar calendards -- 13th month should be '' if not lunar)
				names: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre', ''],
				// abbreviated month names
				namesAbbr: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic', '']
			},
			// AM and PM designators in one of these forms:
			// The usual view, and the upper and lower case versions
			//      [standard,lowercase,uppercase]
			// The culture does not use AM or PM (likely all standard date formats use 24 hour time)
			//      null
			AM: ['AM', 'am', 'AM'],
			PM: ['PM', 'pm', 'PM'],
			eras: [
				// eras in reverse chronological order.
				// name: the name of the era in this culture (e.g. A.D., C.E.)
				// start: when the era starts in ticks (gregorian, gmt), null if it is the earliest supported era.
				// offset: offset in years from gregorian calendar
				{ 'name': 'A.C.', 'start': null, 'offset': 0 }
			],
			twoDigitYearMax: 2029,
			patterns: {
				// short date pattern
				d: 'M/d/yyyy',
				// long date pattern
				D: 'dddd, MMMM dd, yyyy',
				// short time pattern
				t: 'h:mm tt',
				// long time pattern
				T: 'h:mm:ss tt',
				// long date, short time pattern
				f: 'dddd, MMMM dd, yyyy h:mm tt',
				// long date, long time pattern
				F: 'dddd, MMMM dd, yyyy h:mm:ss tt',
				// month/day pattern
				M: 'MMMM dd',
				// month/year pattern
				Y: 'yyyy MMMM',
				// S is a sortable format that does not vary by culture
				S: 'yyyy\u0027-\u0027MM\u0027-\u0027dd\u0027T\u0027HH\u0027:\u0027mm\u0027:\u0027ss'
			},
			percentsymbol: '%',
			currencysymbol: '$',

			currencysymbolposition: 'antes',
			decimalseparator: ',',
			thousandsseparator: '',
			pagergotopagestring: 'Ir a:',
			pagershowrowsstring: 'Mostrar filas:',
			pagerrangestring: ' de ',
			pagerpreviousbuttonstring: 'anterior',
			pagernextbuttonstring: 'siguiente',
			groupsheaderstring: 'Arrastre una columna y déjela aquí para agrupar por esa columna',
			sortascendingstring: 'Ordenar ascendente',
			sortdescendingstring: 'Ordenar descendente',
			sortremovestring: 'Quitar orden',
			groupbystring: 'Agurpar por ésta columna',
			groupremovestring: 'Remover del grupo',
			filtercancelstring: 'Cancelar',
			filterclearstring: 'Restaurar',
			filterstring: 'Filtrar',
			filtershowrowstring: 'Mostrar filas donde:',
			filtershowrowdatestring: 'Mostrar con fecha:',
			filterorconditionstring: 'o',
			filterandconditionstring: 'y',
			filterselectallstring: '(Seleccionar todo)',
			filterchoosestring: '   ',
			filterstringcomparisonoperators: ['vacío', 'no vacía', 'contiene', 'contiene(con mayúsculas)',
				'no contiene', 'no contiene (con mayús.)', 'empieza con', 'empieza con (con mayús.)',
				'termina con', 'termina con (con mayús.)', 'igual', 'igual (con mayús.)', 'nulo', 'no nulo'],
			filternumericcomparisonoperators: ['igual', 'diferente', 'menor', 'menor o igual', 'mayor', 'mayor o igual', 'nulo', 'no nulo'],
			filterdatecomparisonoperators: ['igual', 'diferente', 'menor', 'menor o igual', 'mayor', 'mayor o igual', 'nulo', 'no nulo'],
			filterbooleancomparisonoperators: ['igual', 'diferente'],
			validationstring: 'El valor ingresado no es válido',
			emptydatastring: ' ',
			filterselectstring: 'Filtro',
			loadtext: 'Cargando...',
			clearstring: 'Vaciar',
			todaystring: 'Hoy'
	};
};


