// Stub de @/common/js/creativeCommons: usado solo por components/controls/
// creativeCommons.vue, que ningún test monta ni ejercita a fondo (mountLite
// no llama mounted()). Alcanza con que el import resuelva.
export default {
	ResolveUrl(entity) { return ''; },
	GetLicenseImageByUrl(url) { return ''; },
};
