import { describe, it, expect } from './_harness.mjs';
import GeoPackageUpload from '@/packs/components/GeoPackageUpload.vue';
import { setupGlobals, makeGeoPackage, triggerWatch, axios, serve, settle } from './fixtures.mjs';

const VERIFY = 'GET /services/packs/VerifyGeoPackage';
const FIELDS = [
	{ key: 'name', label: 'Nombre', required: true },
	{ key: 'code', label: 'Código', required: false },
];

function setup(props) {
	const env = setupGlobals({ privileges: 'A' });
	const vm = makeGeoPackage(props || { fields: FIELDS });
	return { env, vm };
}

describe('GeoPackageUpload: estado inicial');

it('parte sin archivo, sin errores y con un bucket nuevo', () => {
	const { vm } = setup();
	expect(vm.hasFile).toBe(false);
	expect(vm.sending).toBe(false);
	expect(vm.verifying).toBe(false);
	expect(vm.error).toBe('');
	expect(vm.columns).toEqual([]);
	expect(vm.mapping).toEqual({});
	expect(vm.verification).toBeNull();
	expect(vm.bucketId > 0).toBe(true);
});

it('acepta un único archivo .gpkg subido por partes', () => {
	const { vm } = setup();
	expect(vm.dropzoneOptions.maxFiles).toBe(1);
	expect(vm.dropzoneOptions.acceptedFiles).toBe('.gpkg');
	expect(vm.dropzoneOptions.chunking).toBe(true);
	expect(vm.dropzoneOptions.forceChunking).toBe(true);
	expect(vm.dropzoneOptions.chunkSize).toBe(500000);
});

it('la URL de carga corresponde al bucket actual', () => {
	const { env, vm } = setup();
	expect(vm.getCreateFileUrl()).toBe(env.context.GetCreateFileUrl(vm.bucketId));
	expect(vm.dropzoneOptions.url()).toBe('http://server.test/services/backoffice/PostImportChunk?b=' + vm.bucketId);
});

it('el identificador del dropzone incluye el id de la instancia', () => {
	const { vm } = setup();
	expect(vm.dropzoneId).toBe('geopackage-dropzone-' + vm._uid);
});

describe('GeoPackageUpload: subida');

it('beforeSending marca el envío y limpia el error', () => {
	const { vm } = setup();
	vm.error = 'x';
	vm.beforeSending();
	expect(vm.sending).toBe(true);
	expect(vm.error).toBe('');
});

it('afterComplete termina el envío', () => {
	const { vm } = setup();
	vm.sending = true;
	vm.afterComplete();
	expect(vm.sending).toBe(false);
});

it('maxFilesExceeded reemplaza el archivo anterior por el nuevo', () => {
	const { vm } = setup();
	const file = { name: 'otro.gpkg' };
	vm.maxFilesExceeded(file);
	expect(vm.dropzone.removed).toBe(1);
	expect(vm.dropzone.added).toEqual([file]);
});

describe('GeoPackageUpload: verificación');

it('afterSuccess marca el archivo y pide al servidor que lo analice con el bucket actual', async () => {
	const { vm } = setup();
	serve({ [VERIFY]: { Columns: ['NOMBRE', 'COD'] } });
	vm.sending = true;
	vm.afterSuccess();
	expect(vm.sending).toBe(false);
	expect(vm.hasFile).toBe(true);
	expect(vm.verifying).toBe(true);
	await settle();
	expect(axios.calls[0].config.params).toEqual({ b: vm.bucketId });
});

it('con columnas válidas las guarda, arma el mapeo vacío de cada campo y termina de verificar', async () => {
	const { vm } = setup();
	const response = { Columns: ['NOMBRE', 'COD'], Extra: 1 };
	serve({ [VERIFY]: response });
	vm.afterSuccess();
	await settle();
	expect(vm.columns).toEqual(['NOMBRE', 'COD']);
	expect(vm.verification).toEqual(response);
	expect(vm.mapping).toEqual({ name: null, code: null });
	expect(vm.verifying).toBe(false);
	expect(vm.error).toBe('');
});

it('una respuesta sin Columns deja las columnas vacías', async () => {
	const { vm } = setup({ fields: [] });
	serve({ [VERIFY]: { MaxZoom: 12 } });
	vm.afterSuccess();
	await settle();
	expect(vm.columns).toEqual([]);
	expect(vm.verification).toEqual({ MaxZoom: 12 });
});

it('si el servidor informa un error lo muestra y no deja columnas ni verificación', async () => {
	const { vm } = setup();
	serve({ [VERIFY]: { Error: 'El archivo contiene más de una capa.' } });
	vm.afterSuccess();
	await settle();
	expect(vm.error).toBe('El archivo contiene más de una capa.');
	expect(vm.columns).toEqual([]);
	expect(vm.verification).toBeNull();
	expect(vm.verifying).toBe(false);
});

it('usa el método de verificación recibido por propiedad en lugar del predeterminado', async () => {
	const calls = [];
	const { vm } = setup({
		fields: [],
		verifyMethod: function (bucketId) { calls.push(bucketId); return Promise.resolve({ Columns: [] }); },
	});
	vm.afterSuccess();
	await settle();
	expect(calls).toEqual([vm.bucketId]);
	expect(axios.calls).toHaveLength(0);
});

describe('GeoPackageUpload.columnOptions');

it('ofrece cada columna como opción con el mismo Id y Caption', () => {
	const { vm } = setup();
	vm.columns = ['A', 'B'];
	expect(vm.columnOptions).toEqual([{ Id: 'A', Caption: 'A' }, { Id: 'B', Caption: 'B' }]);
});

describe('GeoPackageUpload.isReady');

function verified(vm) {
	vm.hasFile = true;
	vm.columns = ['NOMBRE'];
	vm.mapping = { name: 'NOMBRE', code: null };
}

it('no está listo sin archivo', () => {
	const { vm } = setup();
	expect(vm.isReady()).toBe(false);
});

it('no está listo mientras hay error, se verifica o se envía', () => {
	const flags = ['error', 'verifying', 'sending'];
	const values = { error: 'x', verifying: true, sending: true };
	flags.forEach(function (flag) {
		const { vm } = setup();
		verified(vm);
		vm[flag] = values[flag];
		expect(vm.isReady()).toBe(false);
	});
});

it('exige el mapeo de los campos obligatorios y no el de los opcionales', () => {
	const { vm } = setup();
	verified(vm);
	expect(vm.isReady()).toBe(true);
	vm.mapping = { name: null, code: 'COD' };
	expect(vm.isReady()).toBe(false);
});

it('sin campos a mapear alcanza con tener el archivo verificado', () => {
	const { vm } = setup({ fields: [] });
	vm.hasFile = true;
	expect(vm.isReady()).toBe(true);
});

describe('GeoPackageUpload.getPayload / clear');

it('getPayload entrega el bucket, el mapeo y la verificación', () => {
	const { vm } = setup();
	vm.mapping = { name: 'N' };
	vm.verification = { Columns: ['N'] };
	expect(vm.getPayload()).toEqual({ bucketId: vm.bucketId, mapping: { name: 'N' }, verification: { Columns: ['N'] } });
});

it('clear descarta el archivo, reinicia el estado, genera otro bucket y avisa con cleared', () => {
	const { vm } = setup();
	verified(vm);
	vm.error = 'x';
	vm.verification = {};
	vm.bucketId = 1;
	vm.clear();
	expect(vm.dropzone.removed).toBe(1);
	expect(vm.hasFile).toBe(false);
	expect(vm.error).toBe('');
	expect(vm.columns).toEqual([]);
	expect(vm.mapping).toEqual({});
	expect(vm.verification).toBeNull();
	expect(vm.bucketId === 1).toBe(false);
	expect(vm.$emitted).toEqual([{ name: 'cleared', args: [] }]);
});

describe('GeoPackageUpload: watcher de fields');

it('al cambiar los campos con columnas ya cargadas rearma el mapeo vacío', () => {
	const { vm } = setup();
	vm.columns = ['A'];
	vm.mapping = { name: 'A', code: null };
	vm.fields = [{ key: 'otro', label: 'Otro', required: false }];
	triggerWatch(GeoPackageUpload, vm, 'fields');
	expect(vm.mapping).toEqual({ otro: null });
});

it('al cambiar los campos sin columnas cargadas no toca el mapeo', () => {
	const { vm } = setup();
	vm.mapping = { name: 'A' };
	vm.fields = [{ key: 'otro', label: 'Otro', required: false }];
	triggerWatch(GeoPackageUpload, vm, 'fields');
	expect(vm.mapping).toEqual({ name: 'A' });
});
