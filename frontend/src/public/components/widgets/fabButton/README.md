# General

Componente de vue basado en [vue-fab](https://github.com/PygmySlowLoris/vue-fab).

Agrega un panel que puede cargar una lista de ítems que puede mostrarse `onMouseEnter` u `onClick` y tiene varias opciones de configuración.

El formato de la lista a pasar es un array de objetos con las siguientes propiedades:

```js
fabActions.items = [
	{Id: 1, Name: "Ítem1" },
	{Id: 2, Name: "Ítem2" },
];
```

## fabButton.vue (ex FAB.vue)

### Propiedades (nuevas):

- `usePanel` (default `true`), si es `false` no muestra el panel.
- `panelOpenMode` (valores: `'mouseenter'`, `'click'`, default `'mouseenter'`, default mobile `'click'`), cómo se abre el panel, en el evento `onMouseEnter` u `onClick`, si el valor es `'click'` el evento de click del botón (el circulito) no se emite, es decir, se deshabilita la funcionalidad, pasa a ser un botón para abrir el panel.

### Estilos (nuevos):

- `.no-highlight`, no permite seleccionar texto, se usa en los botones de desplazamiento, con click se seleccionan en Chrome. Es muy genérico se puede poner en estilos globales.

## fabPanel.vue

### Propiedades:

- `scrollButtons` (default `true`), el modo de desplazar la lista si con los botones de arriba y abajo o el scrollbar común (`false`).
- `scrollMode` (valores: `'auto'`, `'click'`, default `'click'`), el modo en que se desplaza con los botones de arriba y abajo, si es `'auto'`, en `onMouseEnter` empieza a desplazar automáticamente cada `scrollTime` milisegundos, también funciona el click, si es `'click'` desplaza en `onClick`.
- `scrollTime` (en ms) tiempo entre cada desplazamiento en modo ``auto``.
- `maxItems` (default `7`), cantidad de ítems para mostrar botones de arriba y abajo o scrollbars.
- `ellipsis` (default `false`), agrega elipsis si el texto del ítem es muy largo y muestra un tooltip, si es `false`, lo pone en dos renglones (queda bien también).
- `marginVertical` (default: `15`), margen mínimo para dejar en el panel abajo y arriba.
- `width` y `fixedWidth`, si `fixedWidth` es `false`, entonces `with` pasa a ser `'max-width'`, sino es fijo, es el valor de `'width'`.
- `bgColor`, `scrollColor`, `scrollBgColor` y `hoverColor`, se explican solos.

### Estilos:

- `.no-scroll-bar`, oculta scrollbars en todos los browsers (podría ser global).
- `.overflow-ellipsis`, agrega elipsis en overflow horizontal de texto (podría ser global).
- `.fab-panel`, estilos del div exterior contenedor de todo el panel.
- `.fab-panel-overflow`, estilos del div que contiene los ítems y puede desplazarse (mostrando o no las barras).
- `.fab-scroll-bar`, estilos de scrollbars, para todos los browsers.
- `.fab-panel-list`, estilos de la lista de ítems general (`ul`).
- `.fab-panel-item`, estilos de cada ítem de la lista (`li`).
- `.fab-triangle`, triangulo que señala al botón que abre el panel.
- `.fab-scroll-button`, estilos para los botones de arriba y abajo para desplazamiento.
- `.*-radius`, varios estilos para redondear bordes dependiendo la configuración (sólo arriba, sólo izquierda, ninguno, etc.).

