import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite } from './fixtures.mjs';
import fontAwesomeIconsList from '@/common/js/fontAwesomeIconsList';
import mapIconsList from '@/common/js/mapIconsList';
import MpIconFontPanel from '@/backoffice/components/MpIconFontPanel.vue';

function setup(collection, value, customList) {
	const browser = setupBackoffice('P');
	browser.window.Context.CurrentWork = { Icons: [{ Caption: 'usu-casa', Image: 'data:image/png;base64,xx' }] };
	const vm = mountLite(MpIconFontPanel, { propsData: { collection: collection, value: value, customList: customList } });
	MpIconFontPanel.created.call(vm);
	return { vm: vm };
}

const CUSTOM = [{ Id: 3, Caption: 'usu-casa' }, { Id: 4, Caption: 'usu-escuela' }];

describe('MpIconFontPanel: colecciones');

it('currentIcons toma la lista de la colección elegida', () => {
	expect(setup('fontawesome', '').vm.currentIcons === fontAwesomeIconsList.icons).toBe(true);
	expect(setup('flaticons', '').vm.currentIcons === mapIconsList.icons).toBe(true);
	expect(setup('custom', '', CUSTOM).vm.currentIcons === CUSTOM).toBe(true);
});

it('currentIcons falla con una colección desconocida', () => {
	let message = null;
	try {
		setup('otra', '').vm.currentIcons;
	} catch (e) {
		message = e.message;
	}
	expect(message).toBe('Colección de íconos no reconocida');
});

it('searchPlaceholder usa el texto recibido o uno por defecto', () => {
	expect(setup('custom', '', CUSTOM).vm.searchPlaceholder).toBe('search box');
	const browser = setupBackoffice('P');
	const vm = mountLite(MpIconFontPanel, { propsData: { searchBox: 'Buscar ícono', collection: 'custom' } });
	expect(browser).toBeTruthy();
	expect(vm.searchPlaceholder).toBe('Buscar ícono');
});

describe('MpIconFontPanel: presentación de cada ícono');

it('resolveIcon y resolveTitle usan la clave, o el título en las colecciones propias', () => {
	const standard = setup('fontawesome', '').vm;
	expect(standard.resolveTitle('fa-star', '\uf005')).toBe('fa-star');
	expect(standard.resolveIcon('fa-star', '\uf005').startsWith('<span style="font-family:')).toBe(true);
	const custom = setup('custom', '', CUSTOM).vm;
	expect(custom.resolveTitle(0, CUSTOM[0])).toBe('usu-casa');
	expect(custom.resolveIcon(0, CUSTOM[0]).startsWith("<img src='data:image/png;base64,xx'")).toBe(true);
});

it('getIsSelectedClass marca el ícono elegido según la clave, o el título en las colecciones propias', () => {
	const standard = setup('fontawesome', 'fa-star').vm;
	expect(standard.getIsSelectedClass('fa-star', 'x')).toBe(' selected');
	expect(standard.getIsSelectedClass('fa-user', 'x')).toBe('');
	const custom = setup('custom', 'usu-casa', CUSTOM).vm;
	expect(custom.getIsSelectedClass(0, CUSTOM[0])).toBe(' selected');
	expect(custom.getIsSelectedClass(1, CUSTOM[1])).toBe('');
});

describe('MpIconFontPanel: selección');

it('al crearse y al cambiar el valor recibido, lo toma como seleccionado', () => {
	const { vm } = setup('fontawesome', 'fa-star');
	expect(vm.selected).toBe('fa-star');
	vm.value = 'fa-user';
	MpIconFontPanel.watch.value.call(vm);
	expect(vm.selected).toBe('fa-user');
});

it('iconClicked selecciona el ícono y lo informa con input y selectIcon', () => {
	const { vm } = setup('fontawesome', '');
	vm.iconClicked('fa-star', '\uf005');
	expect(vm.selected).toBe('fa-star');
	expect(vm.$emitted).toEqual([['input', 'fa-star'], ['selectIcon', 'fa-star']]);
});

it('iconClicked en las colecciones propias selecciona por título y recuerda el identificador', () => {
	const { vm } = setup('custom', '', CUSTOM);
	vm.iconClicked(1, CUSTOM[1]);
	expect(vm.selected).toBe('usu-escuela');
	expect(vm.selectedId).toBe(4);
	expect(vm.$emitted).toEqual([['input', 'usu-escuela'], ['selectIcon', 'usu-escuela']]);
});

it('iconDoubleClicked informa el ícono', () => {
	const { vm } = setup('fontawesome', '');
	vm.iconDoubleClicked('fa-star');
	expect(vm.$emitted).toEqual([['selectIconDoubleClick', 'fa-star']]);
});
