import { describe, it, expect } from './_harness.mjs';
import { setupBrowser } from './fixtures.mjs';
import str from '@/common/framework/str';

describe('str: URLs');

it('AbsoluteUrl antepone protocolo y host a una ruta, agregando la barra inicial si falta', () => {
	setupBrowser();
	expect(str.AbsoluteUrl('/mapa/1')).toBe('https://example.org/mapa/1');
	expect(str.AbsoluteUrl('mapa/1')).toBe('https://example.org/mapa/1');
});

it('AbsoluteUrl incluye el puerto cuando lo hay', () => {
	const browser = setupBrowser();
	browser.window.location.port = '8080';
	expect(str.AbsoluteUrl('/x')).toBe('https://example.org:8080/x');
});

it('AbsoluteUrl devuelve igual una URL que ya empieza con el protocolo actual', () => {
	setupBrowser();
	expect(str.AbsoluteUrl('https://otro.org/a')).toBe('https://otro.org/a');
});

it('AbsoluteUrl devuelve null para una URL vacía o nula', () => {
	setupBrowser();
	expect(str.AbsoluteUrl('')).toBeNull();
	expect(str.AbsoluteUrl(null)).toBeNull();
});

it('AppendAccessLink agrega el enlace de acceso solo si existe', () => {
	expect(str.AppendAccessLink('/obra/45', 'tok')).toBe('/obra/45/tok');
	expect(str.AppendAccessLink('/obra/45', null)).toBe('/obra/45');
});

it('PatternUrl sin enlace de acceso aplica el patrón con el último segmento como {id}', () => {
	setupBrowser();
	expect(str.PatternUrl('http://x.org/obra/45', 'https://p.org/{id}', null)).toBe('https://p.org/45');
});

it('PatternUrl con enlace de acceso arma la URL absoluta completa, sin usar el patrón', () => {
	setupBrowser();
	expect(str.PatternUrl('/obra/45', 'https://p.org/{id}', 'tok')).toBe('https://example.org/obra/45/tok');
});

it('PatternUrl sin patrón cae a la URL absoluta', () => {
	setupBrowser();
	expect(str.PatternUrl('/obra/45', null, null)).toBe('https://example.org/obra/45');
});

it('AppendParam agrega con ? o & según haya query, conservando el fragmento', () => {
	expect(str.AppendParam('http://a/b', 'p', 1)).toBe('http://a/b?p=1');
	expect(str.AppendParam('http://a/b?x=2', 'p', 1)).toBe('http://a/b?x=2&p=1');
	expect(str.AppendParam('http://a/b#frag', 'p', 1)).toBe('http://a/b?p=1#frag');
});

describe('str: texto y formato');

it('Split convierte a texto antes de dividir', () => {
	expect(str.Split('a/b/c', '/')).toEqual(['a', 'b', 'c']);
	expect(str.Split(12345, '3')).toEqual(['12', '45']);
});

it('Plural: con cantidad 1 (número o texto) devuelve el término sin cambios', () => {
	expect(str.Plural('casa', 1)).toBe('casa');
	expect(str.Plural('casa', '1')).toBe('casa');
});

it('Plural aplica las reglas por terminación', () => {
	expect(str.Plural('canción', 2)).toBe('canciones');
	expect(str.Plural('luz', 2)).toBe('luces');
	expect(str.Plural('café', 2)).toBe('cafés');
	expect(str.Plural('rubí', 2)).toBe('rubíes');
	expect(str.Plural('casa', 2)).toBe('casas');
	expect(str.Plural('color', 2)).toBe('colores');
});

it('Plural deja invariables los términos terminados en s o x', () => {
	expect(str.Plural('país', 2)).toBe('país');
	expect(str.Plural('tórax', 2)).toBe('tórax');
});

it('FormatFloat redondea, quita ceros sobrantes y usa coma decimal', () => {
	expect(str.FormatFloat(1.5, 2)).toBe('1,5');
	expect(str.FormatFloat(2, 2)).toBe('2');
	expect(str.FormatFloat(1234.5678, 1)).toBe('1234,6');
});

it('AnyToLower convierte a minúsculas y trata null/undefined como texto vacío', () => {
	expect(str.AnyToLower('AbC')).toBe('abc');
	expect(str.AnyToLower(12)).toBe('12');
	expect(str.AnyToLower(null)).toBe('');
	expect(str.AnyToLower(undefined)).toBe('');
});

it('LowerFirstIfOnlyUpper pasa a minúsculas solo si el resto ya está en minúsculas', () => {
	expect(str.LowerFirstIfOnlyUpper('A')).toBe('a');
	expect(str.LowerFirstIfOnlyUpper('Hola')).toBe('hola');
	expect(str.LowerFirstIfOnlyUpper('HOLA')).toBe('HOLA');
	expect(str.LowerFirstIfOnlyUpper('hOLA')).toBe('hOLA');
	expect(str.LowerFirstIfOnlyUpper('')).toBe('');
});

it('Capitalize pone en mayúscula la primera letra y respeta el vacío', () => {
	expect(str.Capitalize('hola')).toBe('Hola');
	expect(str.Capitalize('')).toBe('');
});

it('AddDot agrega el punto final si falta; null se devuelve igual', () => {
	expect(str.AddDot('Fin')).toBe('Fin.');
	expect(str.AddDot('Fin.')).toBe('Fin.');
	expect(str.AddDot(null)).toBeNull();
});

it('RemoveDot quita un único punto final; null se devuelve igual', () => {
	expect(str.RemoveDot('Fin.')).toBe('Fin');
	expect(str.RemoveDot('Fin..')).toBe('Fin.');
	expect(str.RemoveDot('Fin')).toBe('Fin');
	expect(str.RemoveDot(null)).toBeNull();
});

it('applySymbols reemplaza km2 por km² solo en la primera aparición', () => {
	expect(str.applySymbols('10 km2')).toBe('10 km²');
	expect(str.applySymbols('km2 y km2')).toBe('km² y km2');
});

it('removeAccents quita las marcas diacríticas', () => {
	expect(str.removeAccents('Canción año')).toBe('Cancion ano');
});

it('padZeros completa con ceros a la izquierda', () => {
	expect(str.padZeros(7, 3)).toBe('007');
	expect(str.padZeros('12345', 3)).toBe('12345');
});

describe('str: Wrap (corte de texto en líneas con <br>)');

it('devuelve el texto sin cambios si es vacío, nulo o el tamaño no es positivo', () => {
	expect(str.Wrap('', 5)).toBe('');
	expect(str.Wrap(null, 5)).toBeNull();
	expect(str.Wrap('hola', 0)).toBe('hola');
});

it('no corta un texto que entra en una línea', () => {
	expect(str.Wrap('hola mundo', 20)).toBe('hola mundo');
});

it('corta por palabras sin superar el tamaño de línea', () => {
	expect(str.Wrap('uno dos tres cuatro', 8)).toBe('uno dos<br>tres<br>cuatro');
});

it('parte una palabra más larga que la línea en trozos del tamaño máximo', () => {
	expect(str.Wrap('abcdefghij kl', 4)).toBe('abcd<br>efgh<br>ij<br>kl');
});

it('no separa un número de su abreviatura (pp, km, %, /)', () => {
	expect(str.Wrap('pagina 10 pp. total libro', 12)).toBe('pagina<br>10 pp. total<br>libro');
	expect(str.Wrap('mide 5 km de largo hoy', 8)).toBe('mide<br>5 km de<br>largo<br>hoy');
});

describe('str: comparación humana (números y acentos)');

it('humanPrepare quita acentos y rellena con ceros los tokens numéricos', () => {
	expect(str.humanPrepare('Canción año')).toBe('Cancion ano');
	expect(str.humanPrepare('Item 2')).toBe('Item 0000000002');
});

it('humanPrepare quita el punto final de un token', () => {
	expect(str.humanPrepare('Dr.')).toBe('Dr');
	expect(str.humanPrepare('12.')).toBe('0000000012');
});

it('humanPrepare quita los delimitadores (), [] y {} de un token antes de evaluar si es número', () => {
	expect(str.humanPrepare('(12)')).toBe('0000000012');
	expect(str.humanPrepare('[abc]')).toBe('abc');
	expect(str.humanPrepare('{abc}')).toBe('abc');
});

it('humanCompare ordena "Item 2" antes que "Item 10"', () => {
	expect(str.humanCompare('Item 2', 'Item 10') < 0).toBeTruthy();
	expect(str.humanCompare('Item 10', 'Item 2') > 0).toBeTruthy();
});

it('humanCompare ignora los acentos', () => {
	expect(str.humanCompare('árbol', 'arbol')).toBe(0);
});

describe('str: validaciones numéricas');

it('isNumeric acepta números finitos y rechaza el resto', () => {
	expect(str.isNumeric('12')).toBeTruthy();
	expect(str.isNumeric('12.5')).toBeTruthy();
	expect(str.isNumeric('1e3')).toBeTruthy();
	expect(str.isNumeric('abc')).toBeFalsy();
	expect(str.isNumeric('')).toBeFalsy();
	expect(str.isNumeric(null)).toBeFalsy();
	expect(str.isNumeric('12abc')).toBeFalsy();
	expect(str.isNumeric(Infinity)).toBeFalsy();
});

it('isNumericFlex acepta coma o punto decimal, con a lo sumo un separador', () => {
	expect(str.isNumericFlex('1,5')).toBeTruthy();
	expect(str.isNumericFlex(5)).toBeTruthy();
	expect(str.isNumericFlex('1.5.2')).toBeFalsy();
	expect(str.isNumericFlex('1,5,2')).toBeFalsy();
	expect(str.isNumericFlex('')).toBeFalsy();
	expect(str.isNumericFlex('abc')).toBeFalsy();
});

it('isNumericFlex toma "1,000" como 1 (la coma es decimal, no de miles)', () => {
	expect(str.isNumericFlex('1,000')).toBeTruthy();
});

it('IsIntegerGreaterThan exige entero y mayor al umbral', () => {
	expect(str.IsIntegerGreaterThan('5', 3)).toBeTruthy();
	expect(str.IsIntegerGreaterThan('5.5', 3)).toBeFalsy();
	expect(str.IsIntegerGreaterThan('abc', 0)).toBeFalsy();
	expect(str.IsIntegerGreaterThan('', 0)).toBeFalsy();
	expect(str.IsIntegerGreaterThan0('1')).toBeTruthy();
	expect(str.IsIntegerGreaterThan0('0')).toBeFalsy();
});

it('IsNumberGreaterThan admite decimales y la cadena vacía cuenta como 0', () => {
	expect(str.IsNumberGreaterThan('0.5', 0)).toBeTruthy();
	expect(str.IsNumberGreaterThan('x', 0)).toBeFalsy();
	expect(str.IsNumberGreaterThan('', -1)).toBeTruthy();
	expect(str.IsNumberGreaterThan0('0.1')).toBeTruthy();
	expect(str.IsNumberGreaterThan0('-1')).toBeFalsy();
});

it('countMatches cuenta las apariciones', () => {
	expect(str.countMatches('abcabc', 'b')).toBe(2);
	expect(str.countMatches('abc', 'z')).toBe(0);
});

describe('str: escapes y utilidades de cadena');

it('EscapeHtml escapa & < > " \' y convierte a texto', () => {
	expect(str.EscapeHtml('<a href="x">&\'</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#039;&lt;/a&gt;');
	expect(str.EscapeHtml(12)).toBe('12');
});

it('EscapeRegExp escapa los metacaracteres', () => {
	expect(str.EscapeRegExp('a.b*c')).toBe('a\\.b\\*c');
});

it('Replace reemplaza todas las apariciones de un texto literal; null devuelve null', () => {
	expect(str.Replace('a.b.c', '.', '-')).toBe('a-b-c');
	expect(str.Replace(1234, '3', 'x')).toBe('12x4');
	expect(str.Replace(null, 'a', 'b')).toBeNull();
});

it('StartsWith, EndsWith y Contains delegan en String con posición opcional', () => {
	expect(str.StartsWith('hola', 'la', 2)).toBeTruthy();
	expect(str.EndsWith('hola', 'ho', 2)).toBeTruthy();
	expect(str.Contains('hola', 'o', 2)).toBeFalsy();
	expect(str.Contains('hola', 'o')).toBeTruthy();
});

it('GetHashCode coincide con el hashCode de Java y se mantiene en 32 bits', () => {
	expect(str.GetHashCode('')).toBe(0);
	expect(str.GetHashCode('hello')).toBe(99162322);
	expect(str.GetHashCode('polygenelubricants')).toBe(-2147483648);
});

it('IsEmail acepta direcciones comunes', () => {
	expect(str.IsEmail('a@b.com')).toBeTruthy();
	expect(str.IsEmail('nombre.apellido+etiqueta@dominio.org')).toBeTruthy();
});

it('IsEmail rechaza formas inválidas y los caracteres excluidos a propósito', () => {
	expect(str.IsEmail('a@b')).toBeFalsy();
	expect(str.IsEmail('a b@c.com')).toBeFalsy();
	expect(str.IsEmail('@b.com')).toBeFalsy();
	expect(str.IsEmail('a@@b.com')).toBeFalsy();
	expect(str.IsEmail('a!b@c.com')).toBeFalsy();
	expect(str.IsEmail('a@b..com')).toBeFalsy();
});

it('QuoteAttr escapa para atributos XML y normaliza los saltos de línea a \\n', () => {
	expect(str.QuoteAttr('a&b\'c"<d>')).toBe('a&amp;b&apos;c&quot;&lt;d&gt;');
	expect(str.QuoteAttr('x\r\ny\nz')).toBe('x\ny\nz');
});

it('QuoteAttr con preserveCR reemplaza cada salto por &#13;', () => {
	expect(str.QuoteAttr('x\r\ny\nz', true)).toBe('x&#13;y&#13;z');
});
