/*
 * Catálogo de la página de paletas del visor (/map/paletas).
 * El texto de "code" es el que se compila para la muestra en vivo y el que se exhibe.
 *   state:      datos iniciales del ejemplo (lo que iría en data()).
 *   visible:    claves de "state" que se muestran como valor actual bajo la muestra (por defecto, todas).
 *   frame:      fondo de la muestra: 'color', 'dark', 'map', 'panel' (bloque angosto) o 'column'.
 */

const TOKEN_GROUPS = [
	{ name: 'Marca y selección', kind: 'color', names: ['--mp-primary', '--mp-selection', '--mp-selection-strong'] },
	{ name: 'Texto e íconos', kind: 'color', names: ['--mp-text', '--mp-text-muted', '--mp-text-faint', '--mp-text-ghost', '--mp-text-disabled'] },
	{
		name: 'Bordes y estados',
		kind: 'color',
		names: ['--mp-outline', '--mp-outline-soft', '--mp-hover', '--mp-pressed', '--mp-selected', '--mp-selected-hover', '--mp-hover-soft', '--mp-focus-ring']
	},
	{ name: 'Superficies', kind: 'color', names: ['--mp-surface', '--mp-surface-muted', '--mp-surface-translucent'] },
	{ name: 'Radios', kind: 'radius', names: ['--mp-radius-sm', '--mp-radius-md', '--mp-radius-pill'] },
	{ name: 'Tamaños de botones de ícono', kind: 'size', names: ['--mp-icon-xs', '--mp-icon-sm', '--mp-icon-md', '--mp-icon-lg'] },
	{ name: 'Transición', kind: 'text', names: ['--mp-transition'] }
];

const LONG_TEXT = 'Este indicador integra información del Censo Nacional de Población, Hogares y Viviendas 2022 con registros '
	+ 'administrativos de salud y educación. Las categorías se calculan por radio censal y se agregan a departamentos y provincias '
	+ 'cuando el zoom lo requiere. La metodología completa, junto con los cuadros de referencia y las notas sobre cambios de definición '
	+ 'entre relevamientos, está disponible en https://poblaciones.org. Las diferencias entre versiones se explican en el registro de '
	+ 'cambios que acompaña a cada publicación, y los valores pueden variar levemente respecto de las tabulaciones oficiales.';

export default [
	{
		id: 'paleta',
		title: 'Colores y medidas',
		summary: 'Variables --mp-* de common/styles/tokens.css. Se usan con var(--mp-nombre); no se escriben colores ni radios sueltos.',
		tokenGroups: TOKEN_GROUPS,
		examples: []
	},
	{
		id: 'botones',
		title: 'Botones con texto',
		summary: 'Salen de common/styles/buttons.css. No se definen botones en estilos locales ni se usan btn, btn-default, close o lightButton.',
		examples: [
			{
				title: 'Grupo de opciones',
				note: 'El estado seleccionado es is-selected junto con aria-pressed; $ariaPressed entrega la cadena "true" o "false".',
				state: { mode: 'absolute' },
				code: `<div class="mp-btn-group">
	<button type="button" class="mp-btn" :class="{ 'is-selected': mode === 'absolute' }"
					:aria-pressed="$ariaPressed(mode === 'absolute')" @click="mode = 'absolute'">Absoluto</button>
	<button type="button" class="mp-btn" :class="{ 'is-selected': mode === 'percent' }"
					:aria-pressed="$ariaPressed(mode === 'percent')" @click="mode = 'percent'">Porcentaje</button>
	<button type="button" class="mp-btn" :class="{ 'is-selected': mode === 'density' }"
					:aria-pressed="$ariaPressed(mode === 'density')" @click="mode = 'density'">Densidad</button>
</div>`
			},
			{
				title: 'Con borde visible',
				note: 'mp-btn--solid para acciones como descargas; mp-btn--sm en barras densas; mp-btn--soft para selectores con caret.',
				code: `<button type="button" class="mp-btn mp-btn--solid">Descargar</button>
<button type="button" class="mp-btn mp-btn--solid mp-btn--sm">Compacto</button>
<button type="button" class="mp-btn mp-btn--soft">Partición <i class="fas fa-caret-down"></i></button>
<button type="button" class="mp-btn mp-btn--solid" disabled>Deshabilitado</button>`
			},
			{
				title: 'Sobre fondo de color',
				note: 'mp-btn--on-dark es para el panel superior, cuyo fondo toma el color de la obra.',
				frame: 'color',
				code: `<button type="button" class="mp-btn mp-btn--on-dark">Agregar indicadores</button>
<button type="button" class="mp-btn mp-btn--on-dark"><i class="fas fa-play"></i> Recorrido</button>`
			},
			{
				title: 'Solo ícono',
				note: 'mp-btn--icon mide 32 px dentro de un grupo; mp-btn--float, 40 px sobre el mapa. Todo botón de solo ícono lleva title y aria-label iguales.',
				frame: 'map',
				code: `<div class="mp-btn-group">
	<button type="button" class="mp-btn mp-btn--icon" title="Lista" aria-label="Lista"><i class="fas fa-list"></i></button>
	<button type="button" class="mp-btn mp-btn--icon is-selected" title="Cuadrícula" aria-label="Cuadrícula"><i class="fas fa-th"></i></button>
</div>
<button type="button" class="mp-btn mp-btn--float" title="Ubicación actual" aria-label="Ubicación actual"><i class="far fa-dot-circle"></i></button>
<button type="button" class="mp-btn mp-btn--float" title="Compartir" aria-label="Compartir"><i class="fas fa-share-alt"></i></button>`
			}
		]
	},
	{
		id: 'iconos',
		title: 'Botones de ícono',
		summary: 'mp-icon-btn es el botón circular de un solo glifo, sin borde. Los tamaños, tonos y usos se combinan con modificadores.',
		examples: [
			{
				title: 'Tamaños',
				note: 'Por defecto 32 px; --sm mide 24 px y --lg, 40 px.',
				code: `<button type="button" class="mp-icon-btn mp-icon-btn--sm" title="Buscar" aria-label="Buscar"><i class="fas fa-search"></i></button>
<button type="button" class="mp-icon-btn" title="Buscar" aria-label="Buscar"><i class="fas fa-search"></i></button>
<button type="button" class="mp-icon-btn mp-icon-btn--lg" title="Buscar" aria-label="Buscar"><i class="fas fa-search"></i></button>`
			},
			{
				title: 'Tonos y estados',
				note: '--muted y --faint aclaran el glifo en reposo; is-selected marca el estado activo.',
				state: { filtering: true },
				code: `<button type="button" class="mp-icon-btn" title="Filtrar" aria-label="Filtrar"><i class="fas fa-filter"></i></button>
<button type="button" class="mp-icon-btn mp-icon-btn--muted" title="Filtrar" aria-label="Filtrar"><i class="fas fa-filter"></i></button>
<button type="button" class="mp-icon-btn mp-icon-btn--faint" title="Filtrar" aria-label="Filtrar"><i class="fas fa-filter"></i></button>
<button type="button" class="mp-icon-btn" :class="{ 'is-selected': filtering }" :aria-pressed="$ariaPressed(filtering)"
				title="Filtrar" aria-label="Filtrar" @click="filtering = !filtering"><i class="fas fa-filter"></i></button>
<button type="button" class="mp-icon-btn" disabled title="Filtrar" aria-label="Filtrar"><i class="fas fa-filter"></i></button>`
			},
			{
				title: 'Cierre y limpieza',
				note: 'Para cerrar paneles y diálogos se usa <mp-close-button>, que ya está registrado.',
				state: { closed: false },
				code: `<button type="button" class="mp-icon-btn mp-icon-btn--dismiss" title="Cerrar" aria-label="Cerrar" @click="closed = true">×</button>
<button type="button" class="mp-icon-btn mp-icon-btn--sm mp-icon-btn--dismiss mp-icon-btn--muted"
				title="Borrar búsqueda" aria-label="Borrar búsqueda" @click="closed = true">×</button>
<mp-close-button title="Cerrar" @click="closed = true" />`
			},
			{
				title: 'Botón principal de la barra lateral',
				note: '--accent usa el color primario; el resto de la barra son mp-icon-btn--lg.',
				state: { panel: 'indicators' },
				code: `<button type="button" class="mp-icon-btn mp-icon-btn--lg mp-icon-btn--accent"
				:class="{ 'is-selected': panel === 'indicators' }" :aria-pressed="$ariaPressed(panel === 'indicators')"
				title="Explorar indicadores" aria-label="Explorar indicadores" @click="panel = 'indicators'"><i class="fas fa-plus"></i></button>
<button type="button" class="mp-icon-btn mp-icon-btn--lg"
				:class="{ 'is-selected': panel === 'search' }" :aria-pressed="$ariaPressed(panel === 'search')"
				title="Buscar" aria-label="Buscar" @click="panel = 'search'"><i class="fas fa-search"></i></button>`
			},
			{
				title: 'Cabecera de panel',
				note: '--ghost y --label se flotan a la derecha de la cabecera; el contenedor decide el resto de la ubicación.',
				frame: 'panel',
				code: `<button type="button" class="mp-icon-btn mp-icon-btn--sm mp-icon-btn--ghost" title="Información" aria-label="Información"><i class="fas fa-info"></i></button>
<button type="button" class="mp-icon-btn mp-icon-btn--label">Opciones</button>
<strong>Población total</strong>`
			}
		]
	},
	{
		id: 'chips',
		title: 'Chips, etiquetas e insignias',
		summary: 'Salen de common/styles/chips.css y de map/styles/lists.css. La cruz de quitar es mp-chip-remove, de buttons.css.',
		examples: [
			{
				title: 'Chip de selección',
				state: { chips: ['Población total', 'Hogares con NBI', 'Densidad'] },
				code: `<div class="fld-chips">
	<div v-for="(chip, index) in chips" :key="chip" class="mp-chip">
		<span class="mp-chip-label">{{ chip }}</span>
		<button type="button" class="mp-chip-remove" :aria-label="'Quitar ' + chip" @click="chips.splice(index, 1)">×</button>
	</div>
</div>`
			},
			{
				title: 'Etiqueta de filtro',
				note: 'mp-filter-badge ya está registrado; emite click al quitar.',
				state: { regions: ['Tandil', 'Azul'] },
				code: `<mp-filter-badge v-for="region in regions" :key="region" :title="region" tooltip="Quitar el recorte"
								 @click="regions.splice(regions.indexOf(region), 1)" />`
			},
			{
				title: 'Etiqueta sobre fondo oscuro',
				frame: 'dark',
				code: `<span class="mp-chip-tag">Censo 2022</span>
<span class="mp-chip-tag">Departamentos</span>`
			},
			{
				title: 'Insignia',
				code: `<span class="mp-badge">12</span>
<span class="mp-badge">98% relevancia</span>`
			}
		]
	},
	{
		id: 'opciones',
		title: 'Interruptores, casillas y radios',
		summary: 'Se prefiere el interruptor a la casilla para las opciones activables.',
		examples: [
			{
				title: 'Interruptor',
				note: 'Sale de common/styles/switch.css.',
				state: { labels: true, pinned: false },
				code: `<label class="mp-switch">
	<input type="checkbox" v-model="labels" />
	<span class="mp-switch-track"><span class="mp-switch-thumb"></span></span>
	<span>Mostrar etiquetas</span>
</label>
<label class="mp-switch">
	<input type="checkbox" v-model="pinned" />
	<span class="mp-switch-track"><span class="mp-switch-thumb"></span></span>
	<span>Fijar el nivel</span>
</label>`
			},
			{
				title: 'Casilla',
				note: 'Queda para listas de opciones múltiples, como las del diálogo de incrustación.',
				state: { search: true, addMetrics: false },
				code: `<label><input type="checkbox" v-model="search" /> Buscar</label>
<label><input type="checkbox" v-model="addMetrics" /> Agregar indicadores</label>`
			},
			{
				title: 'Radios en línea',
				note: 'mp-radio-inline está en map/styles/fields.css.',
				state: { descriptions: true },
				code: `<label class="mp-radio-inline">
	<input type="radio" name="pal-descriptions" :value="true" v-model="descriptions" />Sí
</label>
<label class="mp-radio-inline">
	<input type="radio" name="pal-descriptions" :value="false" v-model="descriptions" />No
</label>`
			}
		]
	},
	{
		id: 'combos',
		title: 'Combos',
		summary: 'El combo es un select nativo dentro de un renglón fld (etiqueta y valor), de map/styles/fields.css.',
		examples: [
			{
				title: 'Combo con etiqueta',
				state: { level: 2, levels: [{ Id: 1, Name: 'Provincias' }, { Id: 2, Name: 'Departamentos' }, { Id: 3, Name: 'Radios censales' }] },
				visible: ['level'],
				code: `<div class="fld">
	<div class="fld-label">Nivel</div>
	<div class="fld-value">
		<select v-model="level">
			<option v-for="item in levels" :key="item.Id" :value="item.Id">{{ item.Name }}</option>
		</select>
	</div>
</div>`
			},
			{
				title: 'Combo deshabilitado',
				frame: 'column',
				state: { enabled: false, level: 1, levels: [{ Id: 1, Name: 'Provincias' }, { Id: 2, Name: 'Departamentos' }] },
				visible: ['enabled', 'level'],
				code: `<label class="mp-switch">
	<input type="checkbox" v-model="enabled" />
	<span class="mp-switch-track"><span class="mp-switch-thumb"></span></span>
	<span>Permitir cambiar el nivel</span>
</label>
<div class="fld">
	<div class="fld-label">Nivel</div>
	<div class="fld-value">
		<select :disabled="!enabled" v-model="level">
			<option v-for="item in levels" :key="item.Id" :value="item.Id">{{ item.Name }}</option>
		</select>
	</div>
</div>`
			}
		]
	},
	{
		id: 'menus',
		title: 'Menús desplegables',
		summary: '<mp-dropdown-menu> ya está registrado. Cada ítem acepta label, icon, separator, level, href, target e items (submenú); el evento itemClick entrega el ítem.',
		examples: [
			{
				title: 'Variantes del disparador',
				note: 'variant: ghost (por omisión, glifo de cabecera), icon (32 px), float (40 px sobre el mapa) y pill (texto con fondo al pasar el mouse).',
				frame: 'map',
				state: {
					chosen: '',
					items: [
						{ label: 'Imagen (.PNG)', icon: 'fas fa-image' },
						{ label: 'Documento (.PDF)', icon: 'fas fa-file-pdf' },
						{ separator: true },
						{ label: 'Copiar enlace', icon: 'fas fa-link' }
					]
				},
				visible: ['chosen'],
				code: `<mp-dropdown-menu :items="items" :floatRight="false" icon="fas fa-ellipsis-v" tooltip="Más acciones"
									@itemClick="chosen = $event.label" />
<mp-dropdown-menu :items="items" :floatRight="false" variant="icon" icon="fas fa-share-alt" tooltip="Compartir"
									@itemClick="chosen = $event.label" />
<mp-dropdown-menu :items="items" :floatRight="false" variant="float" icon="fas fa-camera" tooltip="Guardar como"
									@itemClick="chosen = $event.label" />
<mp-dropdown-menu :items="items" :floatRight="false" variant="pill" label="Partición" icon="fas fa-caret-down"
									@itemClick="chosen = $event.label" />`
			},
			{
				title: 'Texto propio en el disparador',
				note: 'El slot trigger reemplaza la etiqueta; icon agrega el caret.',
				state: {
					level: 'Departamentos',
					levels: [{ label: 'Provincias' }, { label: 'Departamentos' }, { label: 'Radios censales' }]
				},
				visible: ['level'],
				code: `<mp-dropdown-menu :items="levels" :floatRight="false" icon="fas fa-caret-down" tooltip="Nivel de agregación"
									@itemClick="level = $event.label">
	<template slot="trigger">{{ level }}</template>
</mp-dropdown-menu>`
			},
			{
				title: 'Submenús',
				state: {
					chosen: '',
					items: [
						{ label: 'Descargar', items: [{ label: 'Datos (.CSV)' }, { label: 'Cartografía (.GPKG)' }] },
						{ label: 'Compartir', items: [{ label: 'Enlace' }, { label: 'Incrustar' }] },
						{ separator: true },
						{ label: 'Ayuda' }
					]
				},
				visible: ['chosen'],
				code: `<mp-dropdown-menu :items="items" :floatRight="false" variant="icon" icon="fas fa-bars" tooltip="Menú"
									@itemClick="chosen = $event.label" />`
			}
		]
	},
	{
		id: 'busqueda',
		title: 'Campo de búsqueda',
		summary: 'Salen de common/styles/search.css. El contenedor define position: relative y los márgenes.',
		examples: [
			{
				title: 'Búsqueda con botón de limpiar',
				state: { text: '' },
				code: `<div style="position: relative; width: 340px; padding: 12px 20px">
	<i class="fas fa-search mp-search-icon"></i>
	<input type="text" class="mp-search-input" v-model="text" placeholder="Buscar indicadores" autocomplete="off" />
	<button v-if="text" type="button" class="mp-icon-btn mp-icon-btn--sm mp-icon-btn--dismiss mp-icon-btn--muted mp-search-clear"
					title="Borrar búsqueda" aria-label="Borrar búsqueda" @click="text = ''">×</button>
</div>`
			}
		]
	},
	{
		id: 'listas',
		title: 'Listas',
		summary: 'Salen de common/styles/list-items.css. La disposición interna de cada renglón la define el componente.',
		examples: [
			{
				title: 'Ítem en pastilla',
				note: 'Selector de indicadores y resultados de búsqueda. mp-list-item--muted es para agrupadores.',
				state: { chosen: 'Población total', items: ['Población total', 'Hogares con NBI', 'Densidad'] },
				visible: ['chosen'],
				code: `<div style="width: 340px">
	<div v-for="item in items" :key="item" class="mp-list-item hand" :class="{ 'is-selected': chosen === item }" @click="chosen = item">
		<span>{{ item }}</span>
		<span class="mp-text-small">Censo 2022</span>
	</div>
	<div class="mp-list-item mp-list-item--muted">Grupo sin selección</div>
</div>`
			},
			{
				title: 'Renglón compacto',
				note: 'Capas del mapa base y sugerencias. mp-list-row--strong es para listas sobre fondo gris.',
				state: { chosen: '', layers: ['Calles', 'Satélite', 'Relieve'] },
				visible: ['chosen'],
				code: `<div style="width: 340px">
	<div v-for="layer in layers" :key="layer" class="mp-list-row hand" style="padding: 6px 12px" @click="chosen = layer">{{ layer }}</div>
</div>`
			}
		]
	},
	{
		id: 'superficies',
		title: 'Superficies, diálogos y campos',
		summary: 'mp-surface y mp-modal* tienen sus textos internos en map/styles/surfaces.css.',
		examples: [
			{
				title: 'Tarjeta',
				code: `<div class="mp-surface mp-surface--padded" style="width: 320px">
	<h4 class="title">Población total</h4>
	<div class="stats"><i class="fas fa-users"></i> 1.234.567 habitantes</div>
	<label>Fuente</label>
	<div>Censo Nacional 2022</div>
</div>`
			},
			{
				title: 'Diálogo',
				note: "Se importa donde se usa (import Modal from '@/map/components/popups/modal') y se declara en components. show() lo abre y close() lo cierra.",
				code: `<button type="button" class="mp-btn mp-btn--solid" @click="$refs.dialog.show()">Abrir diálogo</button>
<Modal ref="dialog" title="Descargar indicador" okText="Descargar" cancelText="Cerrar" :maxWidth="520"
			 @ok="$refs.dialog.close()">
	<div class="fld">
		<div class="fld-label">Formato</div>
		<div class="fld-value">Datos tabulares (.CSV)</div>
	</div>
</Modal>`
			},
			{
				title: 'Campos etiqueta y valor',
				code: `<div style="width: 420px">
	<div class="fld">
		<div class="fld-label">Nivel</div>
		<div class="fld-value">Departamentos</div>
	</div>
	<div class="fld">
		<div class="fld-label">Recortes</div>
		<div class="fld-value fld-chips">
			<mp-filter-badge title="Tandil" />
			<mp-filter-badge title="Azul" />
		</div>
	</div>
</div>`
			}
		]
	},
	{
		id: 'texto',
		title: 'Texto largo',
		summary: '<mp-label> ya está registrado: recorta el texto, convierte los enlaces y ofrece "más" y "menos".',
		examples: [
			{
				title: 'Texto con "más" y "menos"',
				state: { description: LONG_TEXT },
				visible: [],
				code: `<div style="width: 360px">
	<mp-label :text="description" />
</div>`
			}
		]
	},
	{
		id: 'tooltips',
		title: 'Tooltips',
		summary: 'v-tooltip ya está registrado. La clase fab-tooltip da el estilo oscuro de los botones flotantes.',
		examples: [
			{
				title: 'Tooltip simple y de botón flotante',
				frame: 'map',
				code: `<button type="button" class="mp-btn mp-btn--solid" v-tooltip="'Guarda el mapa como imagen'">Guardar</button>
<button type="button" class="mp-btn mp-btn--float" aria-label="Ubicación actual"
				v-tooltip="{ content: 'Ubicación actual', placement: 'top', classes: 'fab-tooltip' }"><i class="far fa-dot-circle"></i></button>`
			}
		]
	},
	{
		id: 'utilidades',
		title: 'Utilidades de texto',
		summary: 'Salen de common/styles/utilities.css.',
		examples: [
			{
				title: 'Tamaño, atenuado y flotado',
				frame: 'panel',
				code: `<span class="mp-text-small">Texto al 85 %</span>
<span class="mp-dimmed">Atenuado</span>
<span class="mp-float-right">Flotado a la derecha</span>`
			}
		]
	}
];
