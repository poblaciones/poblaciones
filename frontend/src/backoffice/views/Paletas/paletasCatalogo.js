/*
 * Catálogo de la página de paletas del backoffice (/users/#/paletas).
 * El texto de "code" es el que se compila para la muestra en vivo y el que se exhibe.
 *   state:      datos iniciales del ejemplo (lo que iría en data()).
 *   visible:    claves de "state" que se muestran como valor actual bajo la muestra (por defecto, todas).
 *   frame:      fondo de la muestra: 'form' (columna angosta para campos), 'column', 'panel' (bloque de 320 px)
 *               o 'popup' (alto suficiente para que entre un panel desplegable).
 *   codeOnly:   solo se exhibe el código; la muestra no se renderiza (componentes que dependen de la pantalla completa).
 */

const TOKEN_GROUPS = [
	{
		name: 'Tema de Vue Material',
		kind: 'color',
		names: ['--md-theme-default-primary', '--md-theme-default-accent', '--md-theme-default-icon-on-background']
	},
	{ name: 'Texto', kind: 'color', names: ['--mp-text', '--mp-text-muted', '--mp-text-faint', '--mp-text-disabled'] },
	{ name: 'Bordes y estados', kind: 'color', names: ['--mp-outline', '--mp-hover', '--mp-selected', '--mp-selected-hover', '--mp-focus-ring'] },
	{ name: 'Superficies', kind: 'color', names: ['--mp-surface', '--mp-surface-muted', '--mp-topbar'] },
	{ name: 'Radios', kind: 'radius', names: ['--mp-radius-sm', '--mp-radius-md', '--mp-radius-pill'] }
];

const PROVINCES = [
	{ Id: 1, Caption: 'Buenos Aires', Region: 'Pampeana' },
	{ Id: 2, Caption: 'Córdoba', Region: 'Pampeana' },
	{ Id: 3, Caption: 'Salta', Region: 'Noroeste' },
	{ Id: 4, Caption: 'Jujuy', Region: 'Noroeste' }
];

export default [
	{
		id: 'paleta',
		title: 'Colores y medidas',
		summary: 'Conviven el tema de Vue Material (--md-theme-default-*), que pinta md-primary, y los tokens --mp-* de common/styles/tokens.css, compartidos con el visor.',
		tokenGroups: TOKEN_GROUPS,
		examples: []
	},
	{
		id: 'botones',
		title: 'Botones',
		summary: 'Son md-button de Vue Material. Radio, tamaño de letra y sin mayúsculas salen de common/styles/admin/vue-material-overrides.css.',
		examples: [
			{
				title: 'Con texto',
				note: 'Sin clase es un botón plano; md-raised lo eleva y md-primary lo colorea (el texto en el plano, el fondo en el elevado).',
				code: `<md-button>Cancelar</md-button>
<md-button class="md-raised">Secundario</md-button>
<md-button class="md-primary">Aceptar</md-button>
<md-button class="md-primary md-raised">Guardar</md-button>
<md-button class="md-primary md-raised" disabled>Deshabilitado</md-button>`
			},
			{
				title: 'Con ícono y texto',
				note: 'El ícono va antes del texto; md-button-content los separa con 8 px. Sirve md-icon o un glifo de Font Awesome.',
				code: `<md-button class="md-primary md-raised"><md-icon>add</md-icon>Agregar</md-button>
<md-button><md-icon>edit</md-icon>Editar</md-button>
<md-button class="md-raised"><i class="fas fa-download"></i>Descargar</md-button>`
			},
			{
				title: 'Solo ícono',
				note: 'Todo botón de solo ícono lleva md-tooltip. md-button-mini (30 px, fondo gris) es para acciones auxiliares sobre una vista previa.',
				code: `<md-button class="md-icon-button">
	<md-icon>edit</md-icon>
	<md-tooltip md-direction="bottom">Editar</md-tooltip>
</md-button>
<md-button class="md-icon-button md-primary">
	<md-icon>add</md-icon>
	<md-tooltip md-direction="bottom">Agregar</md-tooltip>
</md-button>
<md-button class="md-icon-button md-button-mini">
	<md-icon>close</md-icon>
	<md-tooltip md-direction="bottom">Quitar</md-tooltip>
</md-button>`
			},
			{
				title: 'Tarjeta de obra',
				note: 'mp-large-data-item se registra en backoffice/main.js. Con MetadataLastOnline en null muestra el ícono de borrador; con fecha, la vista previa del mapa publicado.',
				state: { work: { Id: 1, Caption: 'Indicadores sanitarios de Canelones, 2010', MetadataLastOnline: null }, clicked: '' },
				visible: ['clicked'],
				code: `<mp-large-data-item :item="work" :showEdited="false" @click="clicked = $event.Caption" />`
			}
		]
	},
	{
		id: 'iconos',
		title: 'Íconos',
		summary: 'Dos familias: Material Icons, por nombre de ligadura dentro de md-icon, y Font Awesome, por clase.',
		examples: [
			{
				title: 'Material Icons',
				note: 'El nombre del glifo va como texto. md-primary y md-accent usan el tema; md-size-2x y md-size-3x lo agrandan.',
				code: `<md-icon>home</md-icon>
<md-icon class="md-primary">check_circle</md-icon>
<md-icon class="md-accent">warning</md-icon>
<md-icon class="md-size-2x">place</md-icon>
<md-icon class="md-size-3x">public</md-icon>`
			},
			{
				title: 'Font Awesome',
				note: 'Se usa donde Material no tiene el glifo. En mp-grid se indica como "fas fa-nombre".',
				code: `<i class="fas fa-map"></i>
<i class="far fa-copy"></i>
<i class="fas fa-history fa-lg"></i>
<i class="fas fa-layer-group fa-2x"></i>`
			}
		]
	},
	{
		id: 'opciones',
		title: 'Interruptores y opciones',
		summary: 'Para un valor que se activa o desactiva se prefiere md-switch; md-checkbox sirve para listas de opciones y md-radio para elegir una sola.',
		examples: [
			{
				title: 'Interruptor',
				state: { published: true },
				code: `<md-switch v-model="published" class="md-primary">Publicada</md-switch>
<md-switch v-model="published" class="md-primary" disabled>Deshabilitado</md-switch>`
			},
			{
				title: 'Casillas',
				note: 'Con un array en v-model y un value por casilla, cada una agrega o quita su valor.',
				state: { accepted: false, layers: ['provinces'] },
				code: `<md-checkbox v-model="accepted" class="md-primary">Acepto las condiciones</md-checkbox>
<md-checkbox v-model="layers" value="provinces" class="md-primary">Provincias</md-checkbox>
<md-checkbox v-model="layers" value="departments" class="md-primary">Departamentos</md-checkbox>`
			},
			{
				title: 'Opción única',
				state: { kind: 'points' },
				code: `<md-radio v-model="kind" value="points" class="md-primary">Puntos</md-radio>
<md-radio v-model="kind" value="lines" class="md-primary">Líneas</md-radio>
<md-radio v-model="kind" value="polygons" class="md-primary">Polígonos</md-radio>`
			}
		]
	},
	{
		id: 'campos',
		title: 'Campos de texto',
		summary: 'md-field con md-input o md-textarea es la base. mp-simple-text y mp-text resuelven los casos habituales con la etiqueta, la ayuda y los límites ya armados.',
		examples: [
			{
				title: 'Campo base',
				note: 'La ayuda va fuera del md-field, con las clases md-helper-text y helper; md-clearable agrega la cruz de limpiar y maxlength, el contador.',
				frame: 'form',
				state: { name: 'Canelones' },
				code: `<md-field>
	<label>Nombre</label>
	<md-input v-model="name" maxlength="50" />
</md-field>
<div class="md-helper-text helper">Aparece en el encabezado de la obra.</div>
<md-field md-clearable>
	<label>Con botón de limpiar</label>
	<md-input v-model="name" />
</md-field>
<md-field>
	<label>Deshabilitado</label>
	<md-input v-model="name" disabled />
</md-field>`
			},
			{
				title: 'Validación y área de texto',
				note: 'md-invalid sobre el md-field muestra el md-error; la clase mp-area le da al md-textarea el borde que usan los campos multilínea.',
				frame: 'form',
				state: { name: '', description: '' },
				code: `<md-field :class="{ 'md-invalid': name === '' }">
	<label>Nombre</label>
	<md-input v-model="name" />
	<span class="md-error">El nombre es obligatorio.</span>
</md-field>
<md-field>
	<label>Descripción</label>
	<md-textarea v-model="description" class="mp-area" maxlength="200" />
</md-field>`
			},
			{
				title: 'mp-simple-text',
				note: 'Registrado globalmente. type="number" admite minimum y maximum; canEdit en false lo deshabilita.',
				frame: 'form',
				state: { title: 'Mapa de salud', description: '', width: 40 },
				code: `<mp-simple-text label="Título" v-model="title" :maxlength="50" helper="Texto de ayuda bajo el campo." />
<mp-simple-text label="Descripción" v-model="description" :multiline="true" :rows="3" :maxlength="200" />
<mp-simple-text label="Ancho" v-model="width" type="number" :minimum="0" :maximum="100" suffix="%" />
<mp-simple-text label="Solo lectura" v-model="title" :canEdit="false" />`
			},
			{
				title: 'mp-text',
				note: 'Se edita con el lápiz y se confirma o cancela. Con :formatted="true" y :multiline="true" abre el editor de texto enriquecido.',
				frame: 'form',
				state: { caption: 'Indicadores sanitarios' },
				code: `<mp-text label="Título" v-model="caption" :maxlength="50" helper="Se confirma con el botón de guardar." />`
			},
			{
				title: 'Buscador de listas',
				note: 'mp-search se posiciona de forma absoluta: necesita un contenedor con position relative y altura. El campo no tiene borde, por lo que sin texto solo se ve la lupa.',
				state: { searchText: '' },
				code: `<div style="position: relative; width: 100%; height: 56px">
	<mp-search v-model="searchText" />
</div>`
			}
		]
	},
	{
		id: 'combos',
		title: 'Listas desplegables',
		summary: 'md-select es la base. mp-select arma etiqueta, opciones, agrupación y ayuda a partir de un array; mp-select-auto agrega un modo automático al pie.',
		examples: [
			{
				title: 'md-select',
				note: 'Con multiple, el modelo es un array; md-optgroup agrupa las opciones bajo un rótulo.',
				frame: 'form',
				state: { kind: 'points', layers: ['provinces'], region: 'Salta' },
				code: `<md-field>
	<label>Tipo de mapa</label>
	<md-select v-model="kind" md-dense>
		<md-option value="points">Puntos</md-option>
		<md-option value="lines">Líneas</md-option>
		<md-option value="polygons">Polígonos</md-option>
	</md-select>
</md-field>
<md-field>
	<label>Capas</label>
	<md-select v-model="layers" multiple md-dense>
		<md-option value="provinces">Provincias</md-option>
		<md-option value="departments">Departamentos</md-option>
	</md-select>
</md-field>
<md-field>
	<label>Provincia</label>
	<md-select v-model="region" md-dense>
		<md-optgroup label="Pampeana">
			<md-option value="Córdoba">Córdoba</md-option>
		</md-optgroup>
		<md-optgroup label="Noroeste">
			<md-option value="Salta">Salta</md-option>
			<md-option value="Jujuy">Jujuy</md-option>
		</md-optgroup>
	</md-select>
</md-field>`
			},
			{
				title: 'mp-select',
				note: 'Registrado globalmente. Sin modelKey el modelo es el ítem completo; con modelKey, su clave. listKey y listCaption toman por defecto Id y Caption.',
				frame: 'form',
				state: { provinces: PROVINCES, province: PROVINCES[0], provinceId: 3 },
				visible: ['province', 'provinceId'],
				code: `<mp-select label="Provincia" :list="provinces" v-model="province" helper="El modelo es el ítem completo." />
<mp-select label="Provincia" :list="provinces" v-model="provinceId" :modelKey="true" />
<mp-select label="Región" :list="provinces" v-model="provinceId" :modelKey="true"
					 :allowNull="true" nullLabel="[Todas]" listGrouping="Region" />`
			},
			{
				title: 'mp-select-auto',
				note: 'No está registrado globalmente: se importa de @/common/components/MpSelectAuto y se declara en components. Emite input y auto-change; en modo automático el valor se atenúa.',
				frame: 'form',
				state: { scales: [{ Id: 1, Caption: 'Cuantiles' }, { Id: 2, Caption: 'Cortes naturales' }], scale: 1, auto: true },
				code: `<mp-select-auto label="Método de escala" :list="scales" v-model="scale"
								:autoValue="auto" @auto-change="auto = $event" helper="El último ítem alterna el modo automático." />`
			},
			{
				title: 'Autocompletado',
				frame: 'form',
				state: { value: '', provinces: ['Buenos Aires', 'Córdoba', 'Salta', 'Jujuy'] },
				visible: ['value'],
				code: `<md-field>
	<md-autocomplete v-model="value" :md-options="provinces" :md-open-on-focus="false" md-dense>
		<label>Provincia</label>
	</md-autocomplete>
</md-field>`
			}
		]
	},
	{
		id: 'menus',
		title: 'Menús desplegables',
		summary: 'md-menu con un disparador (md-menu-trigger) y un md-menu-content de md-menu-item. mp-dropdown-button resuelve el caso del botón con flecha.',
		examples: [
			{
				title: 'Menú de acciones',
				note: 'md-direction="bottom-end" alinea el panel al borde derecho del botón; la clase smallerMenu compacta los ítems.',
				state: { action: '' },
				code: `<md-menu md-size="medium" md-align-trigger md-direction="bottom-end">
	<md-button class="md-icon-button" md-menu-trigger>
		<md-icon>more_vert</md-icon>
		<md-tooltip md-direction="bottom">Acciones</md-tooltip>
	</md-button>
	<md-menu-content>
		<md-menu-item class="smallerMenu" @click="action = 'Editar'">
			<md-icon>edit</md-icon><span>Editar</span>
		</md-menu-item>
		<md-menu-item class="smallerMenu" @click="action = 'Duplicar'">
			<md-icon>content_copy</md-icon><span>Duplicar</span>
		</md-menu-item>
		<md-menu-item class="smallerMenu" @click="action = 'Eliminar'">
			<md-icon>delete</md-icon><span>Eliminar</span>
		</md-menu-item>
	</md-menu-content>
</md-menu>`
			},
			{
				title: 'Botón con texto',
				state: { format: '' },
				code: `<md-menu md-size="medium" md-align-trigger>
	<md-button class="md-raised" md-menu-trigger>Exportar<md-icon>arrow_drop_down</md-icon></md-button>
	<md-menu-content>
		<md-menu-item @click="format = 'CSV'">CSV</md-menu-item>
		<md-menu-item @click="format = 'Excel'">Excel</md-menu-item>
		<md-menu-item @click="format = 'GeoJSON'">GeoJSON</md-menu-item>
	</md-menu-content>
</md-menu>`
			},
			{
				title: 'mp-dropdown-button',
				note: 'No está registrado globalmente: se importa de @/backoffice/components/MpDropdownButton y se declara en components. Los ítems van en el slot.',
				state: { action: '' },
				code: `<mp-dropdown-button label="Acciones" icon="tune">
	<md-menu-item class="smallerMenu" @click="action = 'Importar'">
		<md-icon>upload</md-icon><span>Importar</span>
	</md-menu-item>
	<md-menu-item class="smallerMenu" @click="action = 'Exportar'">
		<md-icon>download</md-icon><span>Exportar</span>
	</md-menu-item>
</mp-dropdown-button>
<mp-dropdown-button label="Deshabilitado" :disabled="true" />`
			}
		]
	},
	{
		id: 'dialogos',
		title: 'Diálogos',
		summary: 'md-dialog se abre con md-active.sync. El ancho se ajusta con las clases mp-dialog-* de common/styles/admin/dialogs.css.',
		examples: [
			{
				title: 'Diálogo',
				note: 'Topes de ancho: mp-dialog-md (720 px), mp-dialog-lg (900), mp-dialog-xl (1100) y mp-dialog-fit (sin tope). Anchos fijos: mp-dialog-fixed-sm (420 px), -md (600) y -lg (100 %).',
				state: { open: false },
				visible: ['open'],
				code: `<md-button class="md-primary md-raised" @click="open = true">Abrir diálogo</md-button>
<md-dialog :md-active.sync="open" class="mp-dialog-md">
	<md-dialog-title>Título del diálogo</md-dialog-title>
	<md-dialog-content>
		<p>El contenido se desplaza si no entra en la altura disponible.</p>
	</md-dialog-content>
	<md-dialog-actions>
		<md-button @click="open = false">Cancelar</md-button>
		<md-button class="md-primary" @click="open = false">Aceptar</md-button>
	</md-dialog-actions>
</md-dialog>`
			},
			{
				title: 'Confirmación y aviso',
				note: 'mp-confirm y mp-alert están registrados globalmente y se abren con show() desde una referencia.',
				state: { result: '' },
				code: `<md-button @click="$refs.confirm.show()">Confirmar</md-button>
<md-button @click="$refs.alert.show('El proceso terminó.', 'Listo')">Avisar</md-button>
<mp-confirm ref="confirm" title="Eliminar obra" text="Se eliminará la obra y sus datasets."
						question="¿Desea continuar?" confirmText="Eliminar"
						@confirm="result = 'Confirmado'" @cancel="result = 'Cancelado'" />
<mp-alert ref="alert" acceptText="Entendido" @closed="result = 'Aviso cerrado'" />`
			},
			{
				title: 'Pedido de un valor',
				state: { open: false, name: '', saved: '' },
				visible: ['saved'],
				code: `<md-button @click="open = true">Duplicar</md-button>
<md-dialog-prompt :md-active.sync="open" v-model="name" md-title="Duplicar dataset"
									md-input-maxlength="100" md-input-placeholder="Nombre de la nueva copia..."
									md-confirm-text="Guardar" md-cancel-text="Cancelar" @md-confirm="saved = name" />`
			}
		]
	},
	{
		id: 'avisos',
		title: 'Avisos y espera',
		summary: 'Tooltips, mensajes transitorios e indicadores de progreso. Los estilos de md-snackbar y md-tooltip están en common/styles/admin/feedback.css.',
		examples: [
			{
				title: 'Tooltips y ayuda',
				note: 'md-tooltip va dentro del elemento que describe; v-tooltip sirve para cualquier elemento y mp-help agrega un ícono de ayuda con texto.',
				code: `<md-button class="md-icon-button">
	<md-icon>info</md-icon>
	<md-tooltip md-direction="bottom">Información de la obra</md-tooltip>
</md-button>
<span v-tooltip="'Texto con v-tooltip'">Pasar el mouse</span>
<span style="position: relative; display: inline-block; width: 24px; height: 24px"><mp-help text="Texto de ayuda de mp-help." /></span>`
			},
			{
				title: 'Mensaje transitorio',
				state: { show: false },
				visible: ['show'],
				code: `<md-button @click="show = true">Mostrar aviso</md-button>
<md-snackbar :md-active.sync="show" md-position="left" :md-duration="3000">Se guardaron los cambios.</md-snackbar>`
			},
			{
				title: 'Progreso',
				note: 'md-progress-spinner indeterminado para esperas sin medida; determinado con md-value.',
				state: { percent: 40 },
				code: `<md-progress-spinner class="md-primary" md-mode="indeterminate" :md-diameter="36" />
<md-progress-spinner class="md-primary" md-mode="determinate" :md-value="percent" :md-diameter="36" />
<md-button @click="percent = (percent + 20) % 120">Avanzar</md-button>`
			},
			{
				title: 'Espera de un bloque',
				note: 'mp-wait atenúa su contenido entre Start() y Stop(), que se llaman desde una referencia.',
				code: `<mp-wait ref="wait">
	<md-button class="md-raised">Contenido que se atenúa</md-button>
</mp-wait>
<md-button @click="$refs.wait.Start()">Esperar</md-button>
<md-button @click="$refs.wait.Stop()">Terminar</md-button>`
			}
		]
	},
	{
		id: 'contenedores',
		title: 'Contenedores y listas',
		summary: 'Tarjetas, pestañas, listas, tablas y chips de Vue Material.',
		examples: [
			{
				title: 'Tarjeta',
				frame: 'column',
				code: `<md-card style="width: 320px">
	<md-card-header>
		<div class="md-title">Título</div>
	</md-card-header>
	<md-card-content>Contenido de la tarjeta.</md-card-content>
	<md-card-actions>
		<md-button>Cancelar</md-button>
		<md-button class="md-primary">Aceptar</md-button>
	</md-card-actions>
</md-card>`
			},
			{
				title: 'Pestañas',
				note: 'Cada md-tab lleva un id propio y md-label.',
				frame: 'column',
				code: `<md-tabs md-alignment="left" style="width: 100%">
	<md-tab id="tab-data" md-label="Datos"><p>Contenido de la pestaña de datos.</p></md-tab>
	<md-tab id="tab-style" md-label="Estilo"><p>Contenido de la pestaña de estilo.</p></md-tab>
</md-tabs>`
			},
			{
				title: 'Lista',
				frame: 'panel',
				state: { selected: '' },
				code: `<md-list>
	<md-list-item @click="selected = 'Viviendas'">
		<md-icon>table_chart</md-icon>
		<span class="md-list-item-text">Viviendas</span>
	</md-list-item>
	<md-list-item @click="selected = 'Hogares'">
		<md-icon>table_chart</md-icon>
		<span class="md-list-item-text">Hogares</span>
	</md-list-item>
	<md-divider></md-divider>
	<md-list-item @click="selected = 'Nuevo'">
		<md-icon>add</md-icon>
		<span class="md-list-item-text">Nuevo dataset</span>
	</md-list-item>
</md-list>`
			},
			{
				title: 'Tabla',
				frame: 'column',
				state: { rows: [{ Id: 1, Caption: 'Viviendas', Rows: 1200 }, { Id: 2, Caption: 'Hogares', Rows: 860 }] },
				visible: [],
				code: `<md-table v-model="rows" md-card style="width: 100%">
	<md-table-row slot="md-table-row" slot-scope="{ item }">
		<md-table-cell md-label="Dataset">{{ item.Caption }}</md-table-cell>
		<md-table-cell md-label="Filas">{{ item.Rows }}</md-table-cell>
	</md-table-row>
</md-table>`
			},
			{
				title: 'Chips',
				state: { chips: ['Población total', 'Hogares con NBI'] },
				code: `<md-chip v-for="chip in chips" :key="chip" class="md-primary" md-deletable
				 @md-delete="chips.splice(chips.indexOf(chip), 1)">{{ chip }}</md-chip>
<md-chip>Sin acción</md-chip>`
			}
		]
	},
	{
		id: 'datos',
		title: 'Carga y selección de datos',
		summary: 'Componentes propios, registrados globalmente, para copiar, elegir color y subir imágenes o archivos.',
		examples: [
			{
				title: 'Copiar al portapapeles',
				code: `<span>https://poblaciones.org</span>
<mp-copy text="https://poblaciones.org" />`
			},
			{
				title: 'Selector de color',
				note: 'El valor es un texto hexadecimal; ommitHexaSign lo entrega sin el signo #.',
				state: { color: '#00A0D2' },
				code: `<mp-color-picker v-model="color" />
<mp-color-picker v-model="color" :canEdit="false" />`
			},
			{
				title: 'Imagen y archivo',
				note: 'Ambos leen el archivo en el navegador y entregan su contenido en base64 por v-model.',
				frame: 'column',
				state: { image: '', fileData: '' },
				visible: ['image', 'fileData'],
				code: `<mp-image-upload label="Logo" :maxWidth="200" :maxHeight="100" helper="Imagen de hasta 200 × 100 px." v-model="image" />
<mp-file-upload label="Importar" accept="text/csv" helper="Archivo CSV." v-model="fileData" />`
			},
			{
				title: 'Grilla',
				note: 'mp-grid es una pantalla completa (búsqueda, orden, paginación, selección múltiple); se exhibe solo el código. Las columnas admiten los tipos text, switch, icons y status.',
				codeOnly: true,
				state: {
					items: [{ Id: 1, Caption: 'Viviendas', Rows: 1200, Public: true }],
					columns: [
						{ property: 'Caption', caption: 'Dataset' },
						{ property: 'Rows', caption: 'Filas', align: 'right' },
						{ property: 'Public', caption: 'Público', type: 'switch' }
					]
				},
				code: `<mp-grid :items="items" :columns="columns" caption="Caption" entityName="dataset"
				 :canEdit="true" :canDelete="true" :pageSize="10" :rowClick="onRowClick" />`
			}
		]
	},
	{
		id: 'disposicion',
		title: 'Disposición',
		summary: 'La grilla de md-layout organiza los formularios y title-bar encabeza cada pantalla.',
		examples: [
			{
				title: 'Grilla de md-layout',
				note: 'md-size-* toma un porcentaje (de 5 en 5); md-small-size-100 apila las columnas en pantallas chicas; md-gutter separa los ítems.',
				frame: 'column',
				code: `<div class="md-layout md-gutter" style="width: 100%">
	<div class="md-layout-item md-size-50 md-small-size-100"><mp-simple-text label="Nombre" value="Viviendas" /></div>
	<div class="md-layout-item md-size-50 md-small-size-100"><mp-simple-text label="Fuente" value="Censo 2022" /></div>
	<div class="md-layout-item md-size-100"><mp-simple-text label="Descripción" value="Ocupa todo el ancho." /></div>
</div>`
			},
			{
				title: 'Encabezado de pantalla',
				note: 'title-bar se fija en el borde superior de la pantalla y reserva su altura; se exhibe solo el código.',
				codeOnly: true,
				code: `<title-bar title="Datasets" help="Texto de ayuda del encabezado." />`
			}
		]
	},
	{
		id: 'barra',
		title: 'Barra superior',
		summary: 'La home, el interior de la cartografía, administración y paquetes comparten la misma barra clara.',
		examples: [
			{
				title: 'Barra clara',
				note: 'topbar da el fondo --mp-topbar, sin sombra, y define --topbar-icon y --topbar-avatar-*, que leen los íconos de HomeMenu y TopbarWorkActions y el avatar de ProfileMenu. Administración y paquetes muestran el logo (topbar-logo) y los botones de admin-links; con la propiedad current (admin o packs), el botón del sitio actual lleva md-primary.',
				codeOnly: true,
				code: `<div class="topbar">
	<home-menu />
	<profile-menu />
</div>`
			},
			{
				title: 'Buscador',
				note: 'backoffice-search emite search con el texto y select con el resultado elegido, y muestra los results que reciba (con null el panel permanece cerrado). Los resultados se agrupan por kind: cartography, dataset o metric. Funciona con el mouse y con el teclado (flechas, Enter y Esc). Si un resultado trae href es un enlace: con Ctrl, Cmd o Shift más clic (o el botón central) se abre en otra pestaña o ventana. Con loading muestra una ruedita dentro del campo y conserva los resultados anteriores hasta que lleguen los nuevos; con failed muestra el mensaje de falla. El panel se alinea a la izquierda del campo y mide al menos 500 px. Haga clic en el campo para ver el panel.',
				frame: 'popup',
				state: {
					selected: '',
					truncatedKinds: ['metric'],
					results: [
						{ id: 1, kind: 'cartography', caption: 'Indicadores sanitarios de Canelones, 2010', context: '', tag: '' },
						{ id: 2, kind: 'cartography', caption: 'Censo Nacional de Población, Hogares y Viviendas 2022', context: '', tag: 'Datos públicos' },
						{ id: 11, kind: 'dataset', caption: 'Establecimientos de salud', context: 'Cartografía: Indicadores sanitarios de Canelones, 2010', tag: '' },
						{ id: 12, kind: 'dataset', caption: 'Radios censales', context: 'Cartografía: Censo Nacional de Población, Hogares y Viviendas 2022', tag: 'Datos públicos' },
						{ id: 21, kind: 'metric', caption: 'NBI (2010)', context: 'Dataset: Radios censales 2010 · Cartografía: Censo 2010', tag: 'Datos públicos' },
						{ id: 22, kind: 'metric', caption: 'NBI (2022)', context: 'Dataset: Radios censales 2022 · Cartografía: Censo 2022', tag: 'Datos públicos' }
					]
				},
				visible: ['selected'],
				code: `<backoffice-search :results="results" :truncated-kinds="truncatedKinds" @select="selected = $event.caption" />`
			}
		]
	}
];
