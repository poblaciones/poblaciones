/**
 * KeyboardAwareList
 *
 * Navegación por teclado de una lista asociada a un campo de texto.
 *
 * Contrato con el template: cada elemento navegable lleva el atributo
 * `data-kbd-item` (su valor es el "tipo" de elemento, ej. "item", "card").
 * Lo que no lleva el atributo (separadores, encabezados) se saltea solo.
 * El orden de navegación es el orden del DOM; no hay que mantener un arreglo
 * paralelo a lo que renderiza el template.
 *
 * El elemento activo se marca con el atributo `data-kbd-active` (y no con una
 * clase) para que Vue no lo pise al re-renderizar las clases del elemento.
 *
 * El mouse no interviene: el hover se resuelve por CSS.
 *
 * "Lista activa" = índice > -1 y el campo sin foco. Con el foco en el campo el
 * índice puede quedar recordado (p. ej. tras hacer clic en él con el mouse): se
 * conserva y se resalta, pero las teclas de la lista no actúan sobre él.
 *
 * Teclas (solo con el foco en el campo o fuera de todo control):
 *   ↓               Desde el campo: siempre al primer elemento. Con la lista
 *                   activa: al siguiente (en el último se queda).
 *   ↑               Con la lista activa: al anterior; desde el primero vuelve al campo.
 *   ← / →           Con la lista activa y elementos dispuestos en grilla.
 *   Inicio / Fin    Primer / último elemento.
 *   Re Pág / Av Pág Como en las listas de Windows: la primera vez va al primer /
 *                   último elemento visible (sin scrollear); la siguiente, una
 *                   página entera (tantos elementos como haya visibles).
 *   Tab             Desde el campo: a la lista, conservando el índice si lo había
 *                   (si no, al primer elemento).
 *   Shift+Tab       Desde la lista: al campo, sin tocar el índice.
 *   Enter           Con la lista activa: equivale a un clic (conserva ctrl/shift).
 *   Espacio         Con la lista activa: delega en opts.onSpace.
 *   Supr            Con la lista activa: delega en opts.onDelete.
 *   Esc             Con la lista activa: opts.onEscape o, si no existe, vuelve al campo.
 *   Ctrl+Backspace  Con el campo vacío: delega en opts.onCtrlBackspace.
 *   Carácter / Backspace / Supr con el foco fuera del campo: devuelve el foco al
 *                   campo (y el índice a -1) para que la tecla se escriba ahí.
 *
 * Opciones:
 *   getInput()                 -> HTMLInputElement del campo de búsqueda (requerido)
 *   getContainer()             -> Element que acota la lista y los eventos (requerido)
 *   onEnter(kind, el, e)       -> true si lo resolvió; si no, se hace clic en el elemento
 *   onSpace(kind, el, e)       -> acción de la barra espaciadora (si falta, no hace nada)
 *   onDelete(kind, el, e)      -> true si lo resolvió (si no, la tecla se trata como escritura)
 *   onEscape(e)                -> reemplaza el "volver al campo" por defecto
 *   onCtrlBackspace(e)         -> true si lo resolvió (ej. subió un nivel)
 *   onChange(index)            -> opcional, notifica cada cambio de índice
 *
 * Uso: `attach()` al abrir, `detach()` al cerrar/destruir, y `reset()` cada vez
 * que cambia el contenido visible de la lista.
 */

const ITEM_ATTR = 'data-kbd-item';
const ACTIVE_ATTR = 'data-kbd-active';
const SAME_ROW_TOLERANCE = 2; // px

export default class KeyboardAwareList {
  constructor(opts) {
    this.opts = opts || {};
    this.index = -1;
    this._onKeyDown = this._handleKeyDown.bind(this);
    this._attached = false;
  }

  attach() {
    if (this._attached) return;
    document.addEventListener('keydown', this._onKeyDown, true);
    this._attached = true;
  }

  detach() {
    if (!this._attached) return;
    document.removeEventListener('keydown', this._onKeyDown, true);
    this._attached = false;
    this.reset(false);
  }

  /**
   * Vuelve el índice a -1. Si había un elemento activo y `focusInput` es true,
   * el foco regresa al campo.
   */
  reset(focusInput = true) {
    const had = this.index > -1;
    this._setIndex(-1);
    if (had && focusInput) this._focusInput();
  }

  /**
   * Activa el elemento `i` (acotado al rango válido) y saca el foco del campo.
   * Sirve para conservar la posición tras un cambio de contenido provocado por
   * la propia lista (p. ej. al eliminar un elemento): llamarlo en $nextTick,
   * después del render. Sin elementos no hace nada.
   */
  select(i) {
    const n = this._elements().length;
    if (!n) return;
    this._go(Math.max(0, Math.min(n - 1, i)));
  }

  // ── Internos ──────────────────────────────────────────────────────────────

  _input() {
    return this.opts.getInput ? this.opts.getInput() : null;
  }

  _container() {
    return this.opts.getContainer ? this.opts.getContainer() : null;
  }

  _elements() {
    const c = this._container();
    if (!c || typeof c.querySelectorAll !== 'function') return [];
    return Array.prototype.slice.call(c.querySelectorAll('[' + ITEM_ATTR + ']'));
  }

  _focusInput() {
    const input = this._input();
    if (input && document.activeElement !== input) input.focus();
  }

  _setIndex(i) {
    const els = this._elements();
    // Se limpia la marca de todos los elementos: los nodos pueden haberse
    // reutilizado entre renders.
    els.forEach(el => el.removeAttribute(ACTIVE_ATTR));
    this.index = i;
    if (i > -1 && els[i]) {
      els[i].setAttribute(ACTIVE_ATTR, '');
      this._ensureVisible(els[i]);
    }
    if (this.opts.onChange) this.opts.onChange(this.index);
  }

  _activeElement() {
    if (this.index < 0) return null;
    return this._elements()[this.index] || null;
  }

  // Solo se procesan eventos dirigidos al campo, al contenedor o a ningún
  // control en particular (body); nunca a otros campos de texto de la página.
  _isRelevant(e) {
    const t = e.target;
    const input = this._input();
    if (t === input) return true;
    if (t && t !== document.body && t !== document.documentElement) {
      const c = this._container();
      if (!c || typeof c.contains !== 'function' || !c.contains(t)) return false;
      if (t.matches && t.matches('input, textarea, select, [contenteditable="true"]')) return false;
    }
    return true;
  }

  _handleKeyDown(e) {
    if (e.defaultPrevented || e.isComposing || !this._isRelevant(e)) return;
    const input = this._input();
    const inputFocused = !!input && document.activeElement === input;
    const plain = !e.ctrlKey && !e.metaKey && !e.altKey;
    // Lista activa: hay un elemento activo y el foco no está en el campo.
    const listActive = this.index > -1 && !inputFocused;
    const kindOf = el => el.getAttribute(ITEM_ATTR);

    switch (e.key) {
      case 'ArrowDown':
        if (!plain || e.shiftKey || !this._elements().length) return;
        e.preventDefault();
        // Desde el campo (o sin elemento activo) siempre al primero.
        if (!listActive) this._go(0);
        else this._moveVertical(1);
        return;

      case 'ArrowUp':
        if (!plain || e.shiftKey || !listActive) return;
        e.preventDefault();
        this._moveVertical(-1);
        return;

      case 'ArrowLeft':
      case 'ArrowRight':
        if (!plain || e.shiftKey || !listActive) return;
        e.preventDefault();
        this._moveHorizontal(e.key === 'ArrowRight' ? 1 : -1);
        return;

      case 'Home':
      case 'End': {
        if (!plain || e.shiftKey || !listActive) return;
        const n = this._elements().length;
        if (!n) return;
        e.preventDefault();
        this._go(e.key === 'Home' ? 0 : n - 1);
        return;
      }

      case 'PageDown':
      case 'PageUp':
        if (!plain || e.shiftKey || !listActive) return;
        e.preventDefault();
        this._page(e.key === 'PageDown' ? 1 : -1);
        return;

      case 'Tab':
        if (!plain) return;
        if (!e.shiftKey && inputFocused) {
          const n = this._elements().length;
          if (!n) return;
          e.preventDefault();
          if (this.index > -1 && this.index < n) {
            this._setIndex(this.index); // vuelve a la lista con el índice recordado
            input.blur();
          } else {
            this._go(0);
          }
        } else if (e.shiftKey && !inputFocused && input &&
                   (this.index > -1 || e.target === document.body || e.target === document.documentElement)) {
          e.preventDefault();
          input.focus(); // el índice no se modifica
        }
        return;

      case 'Enter': {
        const el = listActive ? this._activeElement() : null;
        if (!el) return;
        e.preventDefault();
        const handled = this.opts.onEnter && this.opts.onEnter(kindOf(el), el, e);
        if (!handled) this._click(el, e);
        return;
      }

      case ' ': {
        const el = listActive ? this._activeElement() : null;
        if (!el) return; // sin lista activa, el espacio se escribe en el campo
        e.preventDefault();
        if (this.opts.onSpace) this.opts.onSpace(kindOf(el), el, e);
        return;
      }

      case 'Delete': {
        const el = listActive ? this._activeElement() : null;
        if (el && this.opts.onDelete && this.opts.onDelete(kindOf(el), el, e)) {
          e.preventDefault();
          return;
        }
        break;
      }

      case 'Escape':
        if (!listActive) return;
        e.preventDefault();
        if (this.opts.onEscape) this.opts.onEscape(e);
        else this.reset();
        return;

      case 'Backspace':
        if (e.ctrlKey || e.metaKey) {
          // Con texto en el campo se conserva el comportamiento nativo.
          if (input && input.value === '' && this.opts.onCtrlBackspace && this.opts.onCtrlBackspace(e)) {
            e.preventDefault();
          }
          return;
        }
        break;
      default:
        break;
    }

    // Escritura con el foco fuera del campo: se devuelve el foco para que el
    // carácter se escriba en él.
    if (!inputFocused && input) {
      const printable = e.key.length === 1 && plain;
      if (printable || e.key === 'Backspace' || e.key === 'Delete') {
        this._setIndex(-1);
        input.focus();
      }
    }
  }

  // Clic sintético que conserva los modificadores (ctrl+Enter ≡ ctrl+clic).
  _click(el, e) {
    el.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
      ctrlKey: !!e.ctrlKey,
      shiftKey: !!e.shiftKey,
      altKey: !!e.altKey,
      metaKey: !!e.metaKey
    }));
  }

  _top(el) {
    return el.getBoundingClientRect().top;
  }

  _sameRow(a, b) {
    return Math.abs(this._top(a) - this._top(b)) <= SAME_ROW_TOLERANCE;
  }

  _centerX(el) {
    const r = el.getBoundingClientRect();
    return r.left + r.width / 2;
  }

  _moveVertical(dir) {
    const els = this._elements();
    const n = els.length;
    if (this.index < 0 || this.index >= n) { this._go(dir > 0 ? 0 : n - 1); return; }
    const cur = els[this.index];
    // Primer elemento de otra fila en la dirección pedida.
    let j = this.index + dir;
    while (j >= 0 && j < n && this._sameRow(els[j], cur)) j += dir;
    if (j >= n) return;            // hacia abajo no es circular: se queda en el último
    if (j < 0) { this._go(-1); return; } // hacia arriba desde el primero: al campo
    // Dentro de esa fila, el más cercano en horizontal (en una lista de una
    // columna hay un único candidato).
    const cx = this._centerX(cur);
    let best = j;
    let bestDist = Math.abs(this._centerX(els[j]) - cx);
    for (let k = j + dir; k >= 0 && k < n && this._sameRow(els[k], els[j]); k += dir) {
      const d = Math.abs(this._centerX(els[k]) - cx);
      if (d < bestDist) { best = k; bestDist = d; }
    }
    this._go(best);
  }

  // Re Pág / Av Pág al estilo de las listas de Windows.
  _page(dir) {
    const els = this._elements();
    const n = els.length;
    const cur = this.index;
    if (!n || cur < 0 || cur >= n) return;
    const { first, last } = this._visibleRange(els, els[cur]);
    let target;
    if (first < 0) {
      target = cur + dir; // ningún elemento completamente visible
    } else {
      const size = last - first + 1;
      const inView = cur >= first && cur <= last;
      target = dir > 0
        ? ((!inView || cur < last) ? last : cur + size)
        : ((!inView || cur > first) ? first : cur - size);
    }
    this._go(Math.max(0, Math.min(n - 1, target)));
  }

  // Primer y último elemento completamente visibles en el área scrolleable
  // que contiene a `ref` (-1 si no hay ninguno).
  _visibleRange(els, ref) {
    const scroller = this._scrollParent(ref);
    if (!scroller) return { first: 0, last: els.length - 1 };
    const c = scroller.getBoundingClientRect();
    let first = -1;
    let last = -1;
    for (let i = 0; i < els.length; i++) {
      const r = els[i].getBoundingClientRect();
      if (r.top >= c.top - 1 && r.bottom <= c.bottom + 1) {
        if (first < 0) first = i;
        last = i;
      }
    }
    return { first, last };
  }

  _moveHorizontal(dir) {
    const els = this._elements();
    const j = this.index + dir;
    if (j < 0 || j >= els.length) return;
    if (this._sameRow(els[j], els[this.index])) this._go(j);
  }

  _go(next) {
    this._setIndex(next);
    if (next > -1) {
      const input = this._input();
      if (input && document.activeElement === input) input.blur();
    } else {
      this._focusInput();
    }
  }

  // Desplaza el contenedor scrolleable más cercano lo mínimo necesario para
  // que el elemento quede completamente visible.
  _ensureVisible(el) {
    const scroller = this._scrollParent(el);
    if (!scroller) return;
    const c = scroller.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (r.top < c.top) scroller.scrollTop -= (c.top - r.top);
    else if (r.bottom > c.bottom) scroller.scrollTop += (r.bottom - c.bottom);
  }

  _scrollParent(el) {
    let p = el.parentElement;
    while (p) {
      const oy = window.getComputedStyle(p).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight) return p;
      p = p.parentElement;
    }
    return null;
  }
}
