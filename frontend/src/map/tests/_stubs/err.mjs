// Stub de @/common/framework/err. Registra las llamadas para poder asertar
// sobre ellas; nunca lanza ni muestra diálogos.
const calls = [];
export default {
	calls,
	err(code, error) { calls.push({ code, error }); },
	errDialog(code, attempt, error) { calls.push({ code, attempt, error }); },
	errMessage(code, message) { calls.push({ code, message }); },
	HandleError(e) { calls.push({ code: 'HandleError', error: e }); },
};
