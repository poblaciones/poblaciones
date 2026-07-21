// Cálculo centralizado de qué puede hacer el usuario actual con una
// Cartografía/Dato público (Work), a partir de sus privilegios y el
// contexto en el que se muestra. Punto único de verdad: antes esta lógica
// estaba duplicada, con diferencias reales entre sí, en la tabla (dentro
// del WorkItems ya eliminado) y en el menú de acciones de las tarjetas
// (WorkItemActions).
module.exports = {

	CanEdit(item, filter) {
		if (window.Context.User.Privileges === 'A') {
			return true;
		}
		if (filter === 'P' && window.Context.User.Privileges === 'E') {
			return true;
		}
		if (item.IsIndexed) {
			return false;
		}
		return item.Privileges !== 'V';
	},
	CanAdmin(item) {
		if (window.Context.User.Privileges === 'A') {
			return true;
		}
		return item.Privileges === 'A';
	},
	PublishDisabled(item) {
		return !(item.MetadataLastOnline === null || item.HasChanges !== 0);
	},
	RevokeDisabled(item) {
		return item.MetadataLastOnline === null;
	},
	CanCreatePublic() {
		return window.Context.CanCreatePublicData();
	},
	IsAdmin() {
		return window.Context.IsAdmin();
	},
	IsExamplesManager(actions) {
		return actions === 'S' && this.IsAdmin();
	},

	// Los estados de "actions" son: I (activo), A (archivado), D (papelera),
	// S (ejemplo). La tabla (Works.vue) solo trabaja con I y A; el menú de
	// tarjetas (WorkItemActions) además con D y S.
	CanModify(item, filter, actions) {
		return this.CanEdit(item, filter) && actions !== 'D' && actions !== 'S';
	},
	CanDuplicate(item, filter, actions) {
		return this.CanEdit(item, filter) && actions !== 'D' && actions !== 'S';
	},
	CanDuplicateExample(actions) {
		return actions === 'S';
	},
	CanArchive(actions) {
		return actions !== 'D' && actions !== 'S' && actions !== 'A';
	},
	CanUnarchive(actions) {
		return actions === 'A';
	},
	CanDelete(item, actions) {
		return ((this.CanAdmin(item) && actions !== 'D') || actions === 'S') && !this.IsExamplesManager(actions);
	},
	CanRestore(item, actions) {
		return this.CanAdmin(item) && actions === 'D';
	},
	CanPurge(item, actions) {
		return this.CanAdmin(item) && actions === 'D';
	},
	CanDemoteExample(actions) {
		return this.IsExamplesManager(actions);
	},
	CanPromoteExample(item) {
		return this.IsAdmin() && item.Type !== 'P';
	},
	CanPromotePublic(item) {
		return this.CanCreatePublic() && item.Type !== 'P';
	},
	CanDemotePublic(item) {
		return this.CanCreatePublic() && item.Type === 'P';
	},
};
