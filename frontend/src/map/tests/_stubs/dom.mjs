// Stub de @/common/framework/dom. getCssRule es lo único que usa topPanel.vue
// (busca una regla CSS por selector para ajustarle el estilo); en el mock de
// document de los tests no hay stylesheets, así que alcanza con no
// encontrar ninguna, que es un caso ya contemplado por quien la llama.
export default {
	getCssRule(doc, selector) {
		return null;
	},
};
