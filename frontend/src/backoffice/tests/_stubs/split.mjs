// Doble de split.js: registra los paneles y opciones con que se lo invoca.
const calls = [];

export default function Split(panels, options) {
	calls.push({ panels: panels, options: options });
}

export function splitCalls() {
	return calls;
}
