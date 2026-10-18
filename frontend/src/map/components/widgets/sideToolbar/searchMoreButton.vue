<template>
  <div class="more-bar">
    <button type="button" class="mp-btn mp-btn--solid mp-btn--sm more-btn" data-kbd-item="more" @click="onClick">
      <slot>Ver más</slot>
    </button>
  </div>
</template>

<script>
// Botón "Ver más" al pie de una lista, alineado a la derecha. Es un elemento
// navegable por teclado (KeyboardAwareList). Emite `more` con un booleano que
// indica si era el elemento activo por teclado, para que quien expande
// conserve la posición en la lista (ver KeyboardAwareList.select).
export default {
  name: 'SearchMoreButton',
  methods: {
    onClick(event) {
      this.$emit('more', event.currentTarget.hasAttribute('data-kbd-active'));
    }
  }
};
</script>

<style scoped>
.more-bar {
  display: flex;
  justify-content: flex-end;
  padding: 6px 4px 2px;
}

/* En reposo, sin el borde de currentColor que da mp-btn--solid. */
.more-btn:not(:hover) {
  border-color: transparent;
}

.more-btn[data-kbd-active] {
  outline: 2px solid var(--mp-selection);
  outline-offset: 1px;
}
</style>
