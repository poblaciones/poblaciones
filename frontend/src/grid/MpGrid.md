# MpGrid

Grilla genérica del backoffice: ordenamiento, búsqueda, paginación, jerarquías,
selección múltiple y acciones por fila.

Está registrada globalmente en `main.js`, así que se usa como `<mp-grid>` sin
importarla en cada página.

    <mp-grid :items="list" :columns="gridColumns" :actions="gridActions" />

## Principio de uso

La grilla se configura **declarando qué se quiere mostrar**, no escribiendo el
HTML de las celdas. No expone slots: todo se indica por propiedades. La razón es
que el listado se vea igual en todo el backoffice, sin que cada pantalla vuelva
a resolver a mano un tooltip, un ícono de estado o un botón de borrar.

Si aparece un caso que la API no cubre, corresponde **extender la grilla** con
el concepto genérico que falta (como se hizo con `type: 'switch'` o con `badge`
en las acciones), no resolverlo por fuera en la página.

## Ejemplo completo

```js
computed: {
    gridColumns() {
        var loc = this;
        return [
            { property: 'Caption', caption: 'Título', href: function (item) { return loc.getWorkHref(item); } },
            { property: 'Group.Caption', caption: 'Grupo' },
            { property: 'DatasetCount', caption: 'Datasets', size: 1, tooltip: function (item) { return item.DatasetNames; } },
            {
                property: 'TotalSizeBytes', caption: 'Tamaño', sortType: 'number',
                value: function (item) { return loc.formatMB(item.TotalSizeBytes); },
            },
            { property: 'IsIndexed', caption: 'Indexado', type: 'switch', onChange: function (item) { loc.onIndexedChanged(item); } },
        ];
    },
    gridActions() {
        var loc = this;
        return [
            { icon: 'public', caption: 'Publicar', onClick: function (grid, item) { loc.onPublish(item); }, isEnabled: function (item) { return !loc.publishDisabled(item); } },
        ];
    },
},
```

```html
<mp-grid
    :items="works"
    :columns="gridColumns"
    :actions="gridActions"
    :rowClick="onRowClick"
    :pageSize="50"
    canDelete
    :entityName="entityName.single"
    @itemDelete="onItemDelete" />
```

## Propiedades de la grilla

| Propiedad | Tipo | Default | Descripción |
|---|---|---|---|
| `items` | Array | (requerida) | Los objetos a listar. |
| `columns` | Array | `[]` | Definición de columnas (ver abajo). |
| `caption` | String | primera columna | Propiedad que actúa como columna descriptiva: va primera y es la que filtra el buscador. |
| `actions` | Array | `[]` | Acciones por fila (ver abajo). |
| `canEdit` | Boolean | `false` | Agrega la acción de editar, que emite `itemEdit`. |
| `canDelete` | Boolean | `false` | Agrega la acción de eliminar, que **siempre confirma** y luego emite `itemDelete`. |
| `isItemEditEnabled` | Function | `null` | `(item) => bool`; muestra u oculta la acción de editar por ítem. |
| `isItemDeleteEnabled` | Function | `null` | Ídem para la de eliminar. |
| `entityName` | String | `'elemento'` | Nombre singular de lo que se lista (`'cartografía'`), para los textos de confirmación. |
| `deleteConfirmMessage` | Function | `null` | `(itemOrItems) => string`; texto de la confirmación de borrado. |
| `pageSize` | Number | `10` | Filas por página. Toda grilla pagina por defecto; `null` desactiva. |
| `pageSizeOptions` | Array | `[10, 50, 100]` | Tamaños de página que ofrece el selector. |
| `hasChildren` | Boolean | `false` | Habilita jerarquías (ver abajo). |
| `multiSelect` | String | `'no'` | `'no'`, `'yes'` (siempre activa) u `'optional'` (con botón para activarla). |
| `rowClick` | Function | `null` | `(grid, item)` al hacer clic en una fila, fuera de los botones de acción. |
| `settingsKey` | String | `null` | Si se define, persiste columna y sentido de orden entre sesiones. |
| `defaultSortBy` | String | `caption` | Propiedad por la que ordena inicialmente. |
| `defaultSortOrder` | String | `'asc'` | `'asc'` o `'desc'`. |
| `emptyMessage` | String | `'No hay elementos para mostrar.'` | Texto cuando la lista está vacía. Si el vacío lo produjo la búsqueda, la grilla usa un mensaje propio que lo aclara. |
| `captionWidth` | String | `'400px'` | Ancho de la columna descriptiva, si no declara un `size`. |
| `maxWidth` | String | `null` | Tope opcional al ancho de la tabla. No hace falta para que no se estire. |

### Eventos

| Evento | Carga | Cuándo |
|---|---|---|
| `itemEdit` | `item` | Con `canEdit`, al usar la acción de editar. |
| `itemDelete` | `item` o `[items]` | Con `canDelete`, **una vez confirmado** el borrado. Llega un array si vino de una selección múltiple. |

`itemDelete` llega ya confirmado: el handler ejecuta el borrado directamente, no
vuelve a preguntar.

## Columnas

Cada columna es un objeto. Propiedades comunes a todos los tipos:

| Clave | Descripción |
|---|---|
| `property` | Propiedad del ítem. Admite notación de punto: `'Group.Caption'`. |
| `caption` | Título de la columna. Si se omite, se usa `property`. |
| `size` | `1` a `5` (80/130/180/240/400px). Sin `size`, el ancho se ajusta al título y a la cantidad de íconos. |
| `width` | Ancho en píxeles (número). Pisa a `size` si ambos están. |
| `align` | Alineación del **contenido**: `'left'`, `'center'`, `'right'`. Default: izquierda en la descriptiva, centro en las demás. |
| `sortable` | `false` para que no se pueda ordenar por ella. |
| `sortType` | `'text'` (default), `'number'`, `'date'`, `'boolean'`. |
| `sortValue` | `(item) => valor` para ordenar por algo distinto de lo que se muestra. |
| `tooltip` | Texto del tooltip. Fijo o `(item) => string`. |
| `href` | Muestra el valor como link. Fijo o `(item) => string`. |

El **título** de columna va centrado siempre, salvo el de la primera; `align` no
lo afecta.

`sortType: 'date'` hay que declararlo siempre: las fechas suelen llegar como
texto y no hay forma de distinguirlas de una columna de texto común. `'number'`
y `'boolean'` se infieren solos.

### `type: 'text'` (default)

| Clave | Descripción |
|---|---|
| `value` | `(item) => valor` a mostrar, en vez del valor crudo de `property`. |
| `html` | `true` para insertarlo como HTML en vez de texto plano. |

Los booleanos se muestran como "Sí"/"No" sin configurar nada.

### `type: 'switch'`

Un switch atado a `property`, que debe ser booleana.

| Clave | Descripción |
|---|---|
| `onChange` | `(item, value)` al cambiarlo. Es donde se guarda el cambio. |
| `disabled` | `(item) => bool`, opcional. |

```js
{
    property: 'SegmentedCrawling', caption: 'Segmentado', type: 'switch',
    onChange: function (item) { loc.onSegmentedCrawlingChanged(item); },
    disabled: function (item) { return !item.IsIndexed; },
}
```

### `type: 'icons'`

Fila de íconos en línea. Cada uno se declara en `icons`, con `icon`, `text`,
`tooltip` y `show` (todos fijos o funciones `(item)`).

Los que llevan `text` se separan con coma entre sí; los que no, van pegados.

```js
{
    property: 'Modificado', caption: 'Modificado',
    type: 'icons', sortType: 'date',
    sortValue: function (item) { return speech.GetValidaDate(item); },
    icons: [
        { icon: 'fas fa-history', show: function (item) { return !!loc.logInfo(item); }, tooltip: function (item) { return loc.logInfo(item); } },
        { icon: 'fas fa-table', text: function (item) { return item.DatasetCount; }, tooltip: 'Datasets' },
    ],
}
```

### `type: 'status'`

Un ícono principal (`icon`, `color`, `tooltip`) más una lista opcional de íconos
satélite condicionales en `icons` (igual que en `'icons'`, pero sin `text`), que
se superponen en la esquina.

```js
{
    property: 'Estado', caption: 'Estado', type: 'status', sortable: false,
    icon: function (item) { return loc.status(item).icon; },
    color: function (item) { return loc.status(item).color; },
    tooltip: function (item) { return loc.status(item).label; },
    icons: [
        { icon: 'lock', show: function (item) { return item.IsPrivate; }, tooltip: 'Privado' },
    ],
}
```

### Íconos

Un ícono es Material Design (`'lock'`, `'edit'`) salvo que empiece con `'fas '`
o `'fa '`, en cuyo caso se toma como clase de Font Awesome tal cual
(`'fas fa-history'`). No hay que declarar de qué set es.

## Acciones

Cada acción es un objeto:

| Clave | Descripción |
|---|---|
| `icon` | Ícono. Fijo o `(item)`. |
| `caption` | Texto del tooltip. Fijo o `(item)`. |
| `onClick` | `(grid, itemOrItems)`. Recibe la grilla como primer parámetro. |
| `isEnabled` | `(item) => bool`; muestra u oculta la acción para ese ítem. |
| `multiSelect` | `true` si además puede operar sobre una selección de varios ítems. |
| `iconStyle` | Estilo del ícono. Fijo o `(item)`. |
| `badge` | Rótulo corto superpuesto en la esquina del botón (por ejemplo, un id). Fijo o `(item)`. |

Las de `multiSelect: true` son las que se ofrecen al activar la selección
múltiple; las demás solo aparecen en la fila. Una acción puede funcionar en
ambos casos (típicamente, eliminar). Cuando `onClick` recibe una selección
múltiple, `itemOrItems` es un array.

Las acciones que agregan `canEdit`/`canDelete` van **al final**, después de las
personalizadas.

Si no queda ninguna acción, la columna no se muestra.

### `grid.clearSelection()`

`onClick` recibe la grilla justamente para poder cerrar la selección múltiple
cuando la operación se completa:

```js
{
    icon: 'archive', caption: 'Archivar', multiSelect: true,
    onClick: function (grid, itemOrItems) {
        if (Array.isArray(itemOrItems)) {
            loc.startBulkArchive(itemOrItems, function () { grid.clearSelection(); });
        } else {
            loc.onArchive(itemOrItems);
        }
    },
}
```

## Jerarquías

Con `hasChildren`, la grilla busca los hijos de cada ítem en su propiedad
`Items`, los muestra indentados debajo del padre y le agrega a este un ícono
para expandir o colapsar. Se suma un botón para expandir o colapsar todo.

Los nombres `Items` (hijos) e `Id` (identidad del ítem, para recordar cuáles
están expandidos) son fijos, no configurables.

Buscar y ordenar respetan la jerarquía: los hijos nunca pierden su relación con
el padre. Si un hijo coincide con la búsqueda, se muestran también todos sus
ancestros; y el ordenamiento se aplica dentro de cada nivel.

### Listados planos

Si el servidor entrega el listado plano con un nivel de profundidad por ítem, se
reconstruye la jerarquía con el helper:

```js
import MpGridHelper from '@/backoffice/components/MpGrid.helper';

computed: {
    treeList() {
        return MpGridHelper.BuildTreeFromLevels(this.list, 'Level', 'Items');
    },
},
```

`BuildTreeFromLevels(items, levelProperty, childrenProperty)` espera el listado
en orden (cada padre antes que sus hijos) y con la profundidad de cada ítem
(0 = raíz). No clona los ítems, y puede volver a llamarse tras recargar datos
sin duplicar hijos.

## Selección múltiple

`multiSelect` tiene tres estados: `'no'`, `'yes'` (siempre activa) y
`'optional'` (aparece un botón para activarla, y ESC la cancela). Al activarla
se muestran los checkboxes y, arriba, las acciones con `multiSelect: true`.

Mientras está activa, los links de las celdas y `rowClick` quedan inhibidos,
para no navegar cuando se quiere seleccionar.

## Anchos

La tabla mide la suma de sus columnas: no se estira ni reparte espacio sobrante.

- Columna descriptiva: `captionWidth` (400px).
- Columnas con `size`: 80/130/180/240/400px (`1` a `5`).
- Columnas con `width`: ese ancho en píxeles, por encima de `size`.
- Columnas sin `size`: se ajustan al largo del título y, en las de íconos, a la
  cantidad de íconos declarados. Por eso las de conteos, códigos o booleanos
  quedan angostas sin configurar nada.
- Columna de acciones: según la cantidad de acciones.

Si una columna necesita más lugar del que le toca por su título (un texto largo,
contenido HTML), se le declara un `size`.

## Paginación

La grilla pagina de a 10 filas por defecto (`pageSize`); con `pageSize="null"` se
desactiva. La barra de paginación tiene tres zonas: el rango visible ("1 a 10 de
151") centrado entre los botones "← Anterior" y "Siguiente →" (esa zona central
ocupa el 50% del ancho de la grilla y siempre está centrada, aunque los botones
se oculten por no haber más de una página), y a la derecha un selector
"Mostrar:" para cambiar el tamaño de página. Las opciones se configuran con
`pageSizeOptions` (por defecto `[10, 50, 100]`; el valor de `pageSize` se
incluye aunque no figure en la lista), más una opción fija "Todo" que muestra
la lista completa sin paginar.

La barra entera se oculta si el propio `pageSize` es `null` (la grilla no pagina
en absoluto), o si ni siquiera el menor tamaño ofrecido llega a partir la lista.
Si en cambio el usuario eligió "Todo" desde el selector, la barra se mantiene
visible, para poder volver a paginar.

En jerarquías, la paginación es por nodos raíz: cada página trae esa cantidad de
ítems de primer nivel con todos sus descendientes.

El buscador filtra sobre **todos** los ítems, no solo los de la página actual,
así que encuentra cualquier elemento aunque no esté a la vista.

## Búsqueda

El buscador filtra por la columna descriptiva (`caption`), ignorando acentos y
mayúsculas. Cada palabra que se escribe debe ser **prefijo de alguna palabra**
del valor: `edu` encuentra "Nivel educativo" pero no "Medusa". Con varias
palabras, cada una se evalúa por separado (`edu niv` encuentra "Nivel
educativo"), no como un bloque.

Cualquier símbolo (`>`, `-`, `/`, paréntesis, etc.) separa palabras igual que un
espacio, sin descartar letras: `>Rosario` o `San Martín (Cba.)` matchean por
`ros` y por `cba` respectivamente.

En jerarquías, si un hijo coincide se muestran también todos sus ancestros.

## Lista vacía

La grilla ya muestra un mensaje cuando no hay elementos (`emptyMessage`), y
aclara sola el caso de que el vacío lo haya producido la búsqueda.

Por eso **no** hay que envolverla en un `v-if="list.length > 0"`: eso hace
desaparecer también el buscador y el mensaje, y la pantalla queda en blanco,
como si algo se hubiera roto.

```html
<mp-grid :items="works" :columns="gridColumns"
         :emptyMessage="'No hay cartografías para este período.'" />
```

## Persistencia

Con `settingsKey`, la grilla recuerda entre sesiones la columna y el sentido de
orden, en `window.Db` (`{settingsKey}Sort` y `{settingsKey}SortOrder`). La clave
debe ser distinta por grilla:

    :settingsKey="'works-' + filter + '-I'"
