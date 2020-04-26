<template>
  <transition name="boardal">
    <div class="boardal">
      <div class="boardal__mask" v-if="hasMask" @click="clickMask"></div>
      <div class="boardal__wrapper">
        <slot></slot>
        <div class="boardal__x" v-if="hasX" @click="clickX">&times;</div>
      </div>
    </div>
  </transition>
</template>

<script>

export default {
	name: 'boardal',
		props: [
		'hasX',
		'hasMask',
		'canClickMask'
	],
	methods: {
    clickX() {
      this.$emit('toggle');
    },
    clickMask() {
      if(this.canClickMask) {
        this.$emit('toggle');
      }
    }
  }
};
</script>

<style scoped lang="scss">

.boardal {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  &__mask {
    background: rgba(#000,.05);
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
  }
  &__wrapper {
    position: relative;
    width: 65vw;
    width: 60em;
    max-width: 100%;
    max-height: 85vh;
    height: 30em;
    background: #fff;
    color: #333;
    display: flex;
    flex-direction: var(--cross, column);
    border-radius: .2em;
    box-shadow: 0 0 0 1px rgba(0,0,0,.2), 0 1em 2em -1em;
  }
  &__x {
    cursor: pointer;
    font-size: 2em;
    line-height: .5;
    opacity: .15;
    &:hover {
      opacity: .65;
    }
  }
  &-enter-active,
  &-leave-active {
    transition: opacity .25s
  }
  &-enter,
  &-leave-to {
    opacity: 0;
  }
}


</style>

