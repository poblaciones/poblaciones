<template>
  <div>
    <boardal
      v-if="modal.isOpen"
      :has-mask="modal.hasMask"
      :can-click-mask="modal.canClickMask"
      :has-x="modal.hasX"
      @toggle="toggleModal"
    >
      <article v-cloak>
        <section>
          <div class="articleTitle">
            <div class="closeButton" v-on:click="toggleModal">
              <close-icon title="Cerrar" />
            </div>Embeber mapa
          </div>
          <div class="articleContent">
            <div>
              <div>Para embeber este mapa copiar el siguiente HTML y pegarlo en el código fuente de su página de su sitio web.</div>
            </div>
            <textarea v-model="iframeCode" id="testing-code" style="padding: 10px 10px;" />
          </div>
        </section>
      </article>
      <footer>
        <div class="cancel-actions">
          <button type="button" class="accent save" @click="finish()">
            <i class="fas fa-times fa-lg"></i>
          </button>
        </div>
        <div class="copy-actions">
          <button type="button" class="copy iframe" @click="copyIframeCode()">{{ "COPIAR" }}</button>
        </div>
      </footer>
    </boardal>
  </div>
</template>

<script>
import boardal from "@/public/components/controls/boardal";
import CloseIcon from "vue-material-design-icons/Close.vue";

export default {
  name: "embedded",
  components: { boardal, CloseIcon },
  data() {
    return {
      modal: {
        isOpen: false,
        hasMask: true,
        canClickMask: true,
        hasX: false
      },
      showDots: true,
      orientation: "row"
    };
  },
  computed: {
    iframeCode: () => {
      const url = window.location.href;

      var iframe_code = `<div style="margin-top: 2.5rem;">
    <div style="text-align: left; width: 100%;">
        <a style="margin-left: 1rem; position: relative; z-index: 2; text-decoration: none; vertical-align: middle; color: rgb(86, 86, 86); font-family: Roboto, Arial, sans-serif; font-size: 1rem; background-color: rgb(255, 255, 255); padding: 0.5rem 1rem; border-bottom-right-radius: 0.125rem; border-top-right-radius: 0.125rem; box-shadow: rgba(0, 0, 0, 0.3) 0rem 0.0625rem 0.25rem -0.0625rem; min-width: 4rem; border-left: 0rem none; top: 3rem;"
           type="button" target="_blank" href="${url}">Ir a mapa completo</a>
    </div>
    <iframe width="98%" height="83%" frameborder="0" style="border:0; margin-top: -2.5rem; position: relative;"
        src="${url}"
        allowfullscreen="true" scrolling="false" allowtransparency="true">
    </iframe>
</div>`;

      //return `<iframe src="${url}" width="98%" height="83%" frameborder="0" style="border:0; margin-top:-2 5rem; position:relative;" allowfullscreen="true" scrolling="false" allowtransparency="true"></iframe>`;
      return iframe_code;
    }
  },
  methods: {
    toggleModal() {
      this.modal.isOpen = !this.modal.isOpen;
    },
    copyIframeCode() {
      let testingCodeToCopy = document.querySelector("#testing-code");
      testingCodeToCopy.select();
      var successful = document.execCommand("copy");
      var msg = successful ? "successful" : "unsuccessful";
      console.log(msg);
      window.getSelection().removeAllRanges();
    },
    finish() {
      this.toggleModal();
    }
  }
};
</script>

<style scoped lang="scss">
:root {
  --accent: #8fd1f2;
}

[v-cloak] {
  display: none;
}
.closeButton {
  float: right;
  margin-top: 3px;
  margin-right: 10px;
  cursor: pointer;
  cursor: hand;
}
.closeButton:hover {
  color: #888;
}
#testing-code {
  height: 220px;
  width: 750px;
  border-radius: 25px;
  overflow: hidden;
  position: fixed;
  text-align: justify;
  margin: 15px 15px 15px 15px;
  font-size: 0.7em;
  resize: none;
}
// modal content sliders
article {
  flex: 1 1 80%;
  height: 80%;
  display: flex;
  flex-direction: var(--axis, row);
  overflow: hidden;
}
.articleContent {
  position: relative;
  padding-left: 18px;
  margin-right: 10px;
}
.articleTitle {
  padding: 6px 0 6px 12px;
  font-size: 27px;
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
  margin: -10px -10px 30px -10px;
  background-color: #00a0d2;
  color: #ffffff;
}
section p {
  font-size: 15px;
  padding-left: 0px;
}
section {
  width: 100%;
  flex: 0 0 100%;
  font-size: 15px;
  padding: 10px;
  overflow: auto;
  will-change: transform;
  transform: translate(var(--x, 0%), var(--y, 0%));
  transition: transform 300ms ease-out;
  position: relative;
  h2,
  h3,
  h4 {
    margin-top: 0;
  }
}
footer {
  position: relative;
  text-align: right;
  display: flex;
  flex-direction: var(--axis-reverse, row-reverse);
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 0 0 1px rgba(#000, 0.1);
  background: rgba(#000, 0.05);
  &:not(:empty) {
    padding: 1em;
  }
}
.copy-actions,
.cancel-actions {
  flex: 1;
  display: flex;
  flex-direction: var(--axis, row);
}
.copy-actions {
  justify-content: flex-end;
}
.cancel-actions {
  justify-content: flex-end;
}

// boring
*,
*::before,
*::after {
  box-sizing: border-box;
}

a {
  color: var(--accent);
}

del {
  color: #ca1e34;
  font-style: italic;
}

p {
  line-height: 1.5;
}

body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: sans-serif;
  background: snow;
  color: #333;
}

// broadal buttons
button {
  outline: none;
  font: inherit;
  line-height: 1;
  cursor: pointer;
  padding: 0.5em 1em;
  border-radius: 0.35em;
  color: rgba(#000, 0.7);
  background: rgba(#000, 0.1);
  border: 2px solid rgba(#000, 0.05);
  text-shadow: 0 1px 0 rgba(#fff, 0.4);
  transition: transform 50ms ease-out;
  will-change: transform;
  &:active {
    transform: scale(0.98);
  }
  &:hover {
    color: blue !important;
    border-color: #c0c0c0 !important;
  }
  &:focus {
    border-color: var(--accent);
    box-shadow: 0 0 1em 0 var(--accent);
  }
  &[disabled] {
    opacity: 0.2;
    cursor: not-allowed;
  }
  &.primary {
    border-color: transparent;
    background: transparent;
    font-weight: bold;
    &:not([disabled]) {
      color: var(--accent);
    }
  }
  &.accent {
    background: var(--accent);
    &:not([disabled]) {
      color: #666;
    }
  }
  &.secondary {
    border-color: transparent;
    background: transparent;
    &:not([disabled]) {
      color: rgba(#000, 0.4);
    }
  }
  &.cancel:not([disabled]) {
    color: var(--accent);
  }
}
.boardal__wrapper {
  width: 30em !important;
}
</style>
