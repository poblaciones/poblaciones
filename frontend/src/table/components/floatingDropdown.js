/**
 * floatingDropdown.js — mixin para controles con un panel flotante.
 *
 * Encapsula el comportamiento de UI compartido por los selectores (versión,
 * variable, categorías, tipo de métrica): abrir/cerrar el panel, posicionarlo
 * con position:fixed respecto del viewport (el panel se porta a document.body,
 * así que su contexto de posicionamiento es siempre el viewport, sin necesidad
 * de compensar ancestros del ancla), y cerrarlo al hacer click afuera, al
 * scrollear fuera del panel o al redimensionar.
 *
 * No contiene lógica de negocio: sólo el "cómo flota" un panel. Cada control que
 * lo use aporta su propio markup y su objeto de negocio.
 *
 * Provee:
 *   data:  open (bool), floatStyle (estilo inline del panel)
 *   métodos: openPanel(anchorEl), closePanel(), togglePanel(anchorEl)
 *   evento: 'open-change' (true/false) cuando cambia el estado de apertura
 *
 * Requisitos en el componente que lo use:
 *   - el panel flotante debe tener la clase CSS "floating"
 *   - el contenedor raíz interactivo debe tener una clase propia que se pase en
 *     rootClass() (para el click-outside)
 */

export default {
	data: function () {
		return {
			open: false,
			floatStyle: null
		};
	},

	watch: {
		open: function (v) { this.$emit('open-change', v); }
	},

	mounted: function () {
		var loc = this;
		this.clickOutsideHandler = function (event) {
			if (!loc.open) return;
			var rootClass = loc.rootClass ? loc.rootClass() : null;
			// composedPath captura el camino del evento en el momento del click; es
			// estable aunque el re-render (al togglear un checkbox) reemplace el nodo
			// clickeado y lo deje huérfano. Recorrer desde event.target tras ese
			// reemplazo subía por un árbol desconectado y cerraba el panel por error.
			var path = (typeof event.composedPath === 'function') ? event.composedPath() : null;
			var inside = false;
			if (path) {
				for (var i = 0; i < path.length; i++) {
					var el = path[i];
					if (el && el.classList && (
						el.classList.contains('floating') ||
						(rootClass && el.classList.contains(rootClass))
					)) { inside = true; break; }
				}
			} else {
				var target = event.target;
				while (target) {
					if (target.classList && (
						target.classList.contains('floating') ||
						(rootClass && target.classList.contains(rootClass))
					)) { inside = true; break; }
					target = target.parentElement;
				}
			}
			if (!inside) loc.closePanel();
		};
		this.scrollHandler = function (event) {
			if (!loc.open) return;
			var t = event.target;
			while (t && t.classList) {
				if (t.classList.contains('floating')) return; // scroll interno: no cierra
				t = t.parentElement;
			}
			loc.closePanel();
		};
		this.resizeHandler = function () { if (loc.open) loc.closePanel(); };
		document.addEventListener('click', this.clickOutsideHandler);
		window.addEventListener('scroll', this.scrollHandler, true);
		window.addEventListener('resize', this.resizeHandler);
	},

	beforeDestroy: function () {
		if (this.clickOutsideHandler) document.removeEventListener('click', this.clickOutsideHandler);
		if (this.scrollHandler) window.removeEventListener('scroll', this.scrollHandler, true);
		if (this.resizeHandler) window.removeEventListener('resize', this.resizeHandler);
		// Si el panel quedó portado al body, removerlo para no dejar nodos huérfanos.
		if (this._portalPanel && this._portalPanel.parentNode === document.body) {
			document.body.removeChild(this._portalPanel);
		}
		this._portalPanel = null;
		this._portalHome = null;
		if (this.open) this.$emit('open-change', false);
	},

	methods: {
		togglePanel: function (anchorEl) {
			if (this.open) this.closePanel();
			else this.openPanel(anchorEl);
		},
		openPanel: function (anchorEl) {
			this.open = true;
			var loc = this;
			// El panel flota con position:fixed pero queda anidado en un th sticky
			// (que crea contexto de apilamiento), por lo que su z-index no escapa y
			// aparece por detrás de las celdas vecinas. Se reubica en el body y se
			// posiciona DESPUÉS de moverlo (el anchor permanece en su lugar original,
			// y position:fixed se mide contra el viewport).
			this.$nextTick(function () {
				var panel = loc.$el && loc.$el.querySelector ? loc.$el.querySelector('.floating') : null;
				if (panel && panel.parentNode !== document.body) {
					loc._portalPanel = panel;
					loc._portalHome = panel.parentNode;
					document.body.appendChild(panel);
				}
				loc._positionFrom(anchorEl);
			});
		},
		closePanel: function () {
			// Devuelve el panel a su lugar original antes de ocultarlo (si Vue aún no
			// lo destruyó), para que el v-if lo gestione normalmente.
			if (this._portalPanel && this._portalHome) {
				if (this._portalPanel.parentNode === document.body) {
					this._portalHome.appendChild(this._portalPanel);
				}
				this._portalPanel = null;
				this._portalHome = null;
			}
			this.open = false;
		},

		// Calcula la posición fixed del panel a partir del rectángulo del ancla.
		_positionFrom: function (anchorEl) {
			var loc = this;
			this.$nextTick(function () {
				var width = (loc.panelWidth ? loc.panelWidth() : 200);
				var vw = window.innerWidth, vh = window.innerHeight;
				var style = { position: 'fixed', zIndex: 2000, width: width + 'px' };

				if (!anchorEl || !anchorEl.getBoundingClientRect) {
					style.top = '80px';
					style.left = Math.max(8, (vw - width) / 2) + 'px';
					style.maxHeight = (vh - 120) + 'px';
					loc.floatStyle = style;
					return;
				}

				var r = anchorEl.getBoundingClientRect();

				// El panel siempre se porta a document.body antes de llegar acá (ver
				// openPanel), así que su contexto de posicionamiento fixed es siempre
				// el viewport: no hace falta compensar ancestros transformados DEL
				// ANCLA, porque el panel ya no cuelga de ese árbol. Restar ese offset
				// (como se hacía antes) desplazaba el panel a un lugar equivocado.
				var left = r.left;
				if (left + width > vw - 8) left = vw - width - 8;
				if (left < 8) left = 8;
				style.left = left + 'px';

				var spaceBelow = vh - r.bottom - 8;
				var spaceAbove = r.top - 8;
				if (spaceBelow >= 160 || spaceBelow >= spaceAbove) {
					style.top = (r.bottom + 4) + 'px';
					style.maxHeight = Math.max(160, spaceBelow) + 'px';
				} else {
					style.bottom = (vh - r.top + 4) + 'px';
					style.maxHeight = Math.max(160, spaceAbove) + 'px';
				}
				loc.floatStyle = style;
			});
		}
	}
};
