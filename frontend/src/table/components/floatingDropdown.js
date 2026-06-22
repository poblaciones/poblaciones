/**
 * floatingDropdown.js — mixin para controles con un panel flotante.
 *
 * Encapsula el comportamiento de UI compartido por los selectores (versión,
 * variable, categorías, tipo de métrica): abrir/cerrar el panel, posicionarlo
 * con position:fixed respecto del ancla (corrigiendo ancestros transformados),
 * y cerrarlo al hacer click afuera, al scrollear fuera del panel o al
 * redimensionar.
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
			var inside = false;
			var rootClass = loc.rootClass ? loc.rootClass() : null;
			var target = event.target;
			while (target) {
				if (target.classList && (
					target.classList.contains('floating') ||
					(rootClass && target.classList.contains(rootClass))
				)) { inside = true; break; }
				target = target.parentElement;
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
		if (this.open) this.$emit('open-change', false);
	},

	methods: {
		togglePanel: function (anchorEl) {
			if (this.open) this.closePanel();
			else this.openPanel(anchorEl);
		},
		openPanel: function (anchorEl) {
			this.open = true;
			this._positionFrom(anchorEl);
		},
		closePanel: function () {
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

				// position:fixed se mide respecto del viewport salvo que un ancestro
				// tenga transform (vue-grid-layout puede aplicarlo); en ese caso el
				// origen es ese ancestro y hay que restar su offset.
				var ox = 0, oy = 0;
				var tc = loc._transformedAncestor(anchorEl);
				if (tc) {
					var cr = tc.getBoundingClientRect();
					ox = cr.left; oy = cr.top;
				}

				var left = r.left;
				if (left + width > vw - 8) left = vw - width - 8;
				if (left < 8) left = 8;
				style.left = (left - ox) + 'px';

				var spaceBelow = vh - r.bottom - 8;
				var spaceAbove = r.top - 8;
				if (spaceBelow >= 160 || spaceBelow >= spaceAbove) {
					style.top = (r.bottom + 4 - oy) + 'px';
					style.maxHeight = Math.max(160, spaceBelow) + 'px';
				} else {
					style.bottom = (vh - r.top + 4 + oy) + 'px';
					style.maxHeight = Math.max(160, spaceAbove) + 'px';
				}
				loc.floatStyle = style;
			});
		},

		// Ancestro más cercano con transform/perspective/will-change (crea contexto
		// de contención para position:fixed).
		_transformedAncestor: function (el) {
			var node = el ? el.parentElement : null;
			while (node && node !== document.body) {
				var st = window.getComputedStyle(node);
				if ((st.transform && st.transform !== 'none') ||
					(st.perspective && st.perspective !== 'none') ||
					st.willChange === 'transform') {
					return node;
				}
				node = node.parentElement;
			}
			return null;
		}
	}
};
