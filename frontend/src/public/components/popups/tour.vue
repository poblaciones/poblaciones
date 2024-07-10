<template>
	<div v-hotkey="keymap">
    <!--  The Modal -->
    <boardal v-if="modal.isOpen" ref="dal" :has-mask="modal.hasMask" :can-click-mask="modal.canClickMask" :has-x="modal.hasX" @toggle="toggleModal">
			<article v-cloak>
				<section>
					<div class="articleTitle">
						<div class="closeButton" @click="toggleModal">
							<close-icon title="Cerrar" />
						</div>
						Bienvenido a Poblaciones
					</div>
					<div class="articleContent">
						<img style="float: left" src="/static/img/tour/step1-a.png" />
						<div style="margin-left: 182px;">
							<div style="margin-right: 60px;">
								Esta guía le permitirá conocer información básica para utilizar nuestro mapa.
							</div>
							<div style="float: right; margin-top: 40px; margin-left: 20px">
								<img src="/static/img/tour/step1-b.png" />
								<div style="max-width: 200px; font-size: 14px">
									Si desea continuar viéndola más tarde, podrá volver a abrirla desde la barra
									de acciones.
								</div>
							</div>
							<div style="max-width: 400px">
								<p>
									Solo le llevará dos minutos, y hará más cómodo el uso del sitio.
								</p>
							</div>
							<button class="accent" @click="noThanks">No, gracias.</button> &nbsp;
							<button class="accent" @click="skip(1)">¡Empecemos!</button>
						</div>
					</div>
				</section>
				<section>
					<div class="articleTitle">
						<div class="closeButton" @click="toggleModal">
							<close-icon title="Cerrar" />
						</div>
						Buscar información
					</div>
					<div class="articleContent">
						<div style="padding-bottom: 30px">
							En la parte superior, el mapa permite agregar indicadores por medio de la barra de búsqueda.
						</div>
						<div>
							<img style="margin-bottom: 10px; margin-top: 40px" src="/static/img/tour/step2-a.png" />
							<div style="float:right">
								<img style="margin-left: 10px;" src="/static/img/tour/step2-b.png" />
							</div>
						</div>
						<div style="font-size: 14px; text-align: right; max-width: 400px">
							Ingresando descriptores de la información buscada, el sitio muestra las series de datos disponibles.
						</div>
					</div>
				</section>
				<section style="padding-bottom: 0px">
					<div class="articleTitle">
						<div class="closeButton" @click="toggleModal">
							<close-icon title="Cerrar" />
						</div>
						Visualizar series
					</div>
					<div class="articleContent">
						<div style="float:right">
							<img style="margin-top: -25px;" src="/static/img/tour/step3-a.png" />
						</div>
						<div style="max-width: 150px">
							La información agregada al mapa se controla desde paneles a la derecha asociados a cada indicador.
						</div>

					</div>
				</section>
				<section style="padding-bottom: 0px">
					<div class="articleTitle">
						<div class="closeButton" @click="toggleModal">
							<close-icon title="Cerrar" />
						</div>
						Segmentación geográfica
					</div>
					<div class="articleContent">
						<div>
							El sitio ofrece múltiples formas de segmentación por criterios regionales y jurisdiccionales.
						</div>
						<div style="margin-top: 20px;">
							<div class="halves">
								<span class="step" style="margin-left: -15px;">1</span>
								<img src="/static/img/tour/step4-a.png" />
								<div style="margin-top: 10px">
									La barra de búsqueda permite identificar regiones, provincias, localidades, municipios, aglomerados y barrios entre otros criterios.
								</div>
							</div>

							<div class="halves">
								<span class="step" style="margin-left: -15px;">2</span>
								<img src="/static/img/tour/step4-b.png" />
                <div style="margin-top: 10px">
                  La selección también puede realizarse haciendo click en las etiquetas del mapa. Presione CTRL+click para seleccionar varias zonas simultáneamente.
                </div>
							</div>
						</div>
					</div>
				</section>
				<section>
					<div class="articleTitle">
						<div class="closeButton" @click="toggleModal">
							<close-icon title="Cerrar" />
						</div>
						Visualizar segmentación
					</div>
					<div class="articleContent">
						<div>
							La segmentación restringe la información en pantalla para ajustarla
							a la zona seleccionada.
						</div>
						<div style="margin-top: 12px;">
							<div class="halves">
								<img src="/static/img/tour/step5-a.png" />
								<div style="margin-top: 10px">
									En el mapa, se destaca y colorea solamente la zona activa.
								</div>
							</div>

							<div class="halves">
								<img src="/static/img/tour/step5-b.png" />
								<div style="margin-top: 10px">
									A la derecha, en los paneles de información, se muestra información de la zona.
								</div>
							</div>
						</div>
					</div>
				</section>
				<section style="padding-bottom: 0px">
					<div class="articleTitle">
						<div class="closeButton" @click="toggleModal">
							<close-icon title="Cerrar" />
						</div>
						Indicadores disponibles
					</div>
					<div class="articleContent">
						<div>
							El la esquina inferior izquierda encontrará indicadores agrupados por temáticas que pueden
							agregarse al mapa activo.
						</div>
						<div style="margin-top: 12px;">
							<div class="halves">
								<img src="/static/img/tour/step6-a.png" />
							</div>

							<div class="halves">
								<div style="margin-top: 0px">
									La información de esos indicadores proviene de diversas fuentes, y podrá consultar
									quiénes son sus autores y descargar los datos si desea analizarlos fuera de la plataforma.
								</div>
								<div style="margin-top: 20px;">
									<img src="/static/img/tour/step6-b.png" style="float: right" />
									En las cartografías específicas podrá ver más información eligiendo 'Indicadores' en la barra superior.
								</div>
							</div>
						</div>
					</div>
				</section>
				<section style="padding-bottom: 0px">
					<div class="articleTitle">
						<div class="closeButton" @click="toggleModal">
							<close-icon title="Cerrar" />
						</div>
						¡Felicitaciones!
					</div>
					<div class="articleContent">
						<div>
							Ha completado la guía de uso.
						</div>
						<div style="margin-top: 30px;">
							<div class="halves">
								<h4 style="text-align: center; ">
									<img src="/static/img/tour/step7-a.png" /> &nbsp;Compartir
								</h4>
								<div style="margin-top: 10px">
									Para guardar una visualización o enviarla a otras personas, puede copiar la ruta activa o utilizar el botón Compartir de la barra de acciones.
								</div>
							</div>

							<div class="halves">
								<h4 style="text-align: center; ">
									<img src="/static/img/tour/step7-b.png" /> &nbsp;Comentar
								</h4>
								<div style="margin-top: 10px">
									Si tiene comentarios, pedidos o problemas, utilice la herramienta de asistencia que estará siempre a la izquierda en el mapa.
								</div>
							</div>
						</div>
						<div style="clear: both">
							<p style="padding-bottom: 0px;">
								<button class="accent" @click="reset()">Volver a empezar</button>
								<button style="float:right" class="accent" @click="toggleModal">¡Gracias!</button>
							</p>
						</div>
					</div>
				</section>
			</article>
      <footer>
        <div class="forward-actions">
          <!--         <button class="secondary skip" :disabled="isLastStep" v-show="!isLastStep" @click="skip(2)">Skip</button> -->
          <button class="primary next" :disabled="isLastStep" v-show="!isLastStep" @click="skip(1)">
            <i class="fa fa-fw fa-lg" :class="nextIcon"></i>
          </button>
          <button class="accent save" :disabled="!isLastStep" v-show="isLastStep" @click="finish">
            <i class="fa fa-fw fa-lg fa-check"></i>
          </button>
        </div>
        <div class="step-dots" v-if="hasDots">
          <div class="step-dot" v-for="n in max" :key="n" :class="{active: n == step}" @click="goToStep(n)"></div>
        </div>
        <div class="back-actions">
          <button class="secondary cancel prev" :disabled="isFirstStep" xv-show="!isFirstStep" @click="skip(-1)">
            <i class="fa fa-fw fa-lg" :class="backIcon"></i>
          </button>
        </div>
      </footer>
    </boardal>
  </div>
</template>

<script>
import boardal from '@/public/components/controls/boardal';
import CloseIcon from 'vue-material-design-icons/Close.vue';

export default {
	name: 'tour',
  components: { boardal, CloseIcon },
  data() {
    return {
      modal: {
        isOpen: false,
        hasMask: true,
        canClickMask: true,
        hasX: false
      },
      step: 1,
      max: 6,
      showDots: true,
      orientation: 'row',
      // xray: 'hidden'
    };
  },
  computed: {
		keymap() {
			return {
				enter: this.nextOrToggle,
				right: this.next,
				left: this.prev,
				esc: this.escPressed,
			};
		},
    isFirstStep() {
      return (this.step === 1);
    },
    isLastStep() {
      return (this.step === this.max);
    },
    hasDots() {
      return (this.max > 1 && this.showDots);
    },
    x_multiplier() {
      return (this.orientation === 'row' ? -1 : 0);
    },
    y_multiplier() {
      return (this.orientation === 'row' ? 0 : -1);
    },
    axis() {
      return (this.orientation === 'row' ? 'row' : 'column');
    },
    axisReverse() {
      return (this.orientation === 'row' ? 'row-reverse' : 'column-reverse');
    },
    cross() {
      return (this.orientation === 'row' ? 'column' : 'row');
    },
    crossReverse() {
      return (this.orientation === 'row' ? 'column-reverse' : 'row-reverse');
    },
    nextIcon() {
      return (this.orientation === 'row' ? 'fa-arrow-right' : 'fa-arrow-down');
    },
    backIcon() {
      return (this.orientation === 'row' ? 'fa-arrow-left' : 'fa-arrow-up');
    },

  },
  watch: {
    orientation: 'setCssVars',
    // xray: 'setCssVars'
  },
    methods: {
			nextOrToggle() {
				if (!this.modal.isOpen) {
					return;
				}
				if (this.step == this.max) {
					this.toggleModal();
				} else {
					this.next();
				}
			},
			next() {
				if (!this.modal.isOpen) {
					return;
				}
				this.skip(1);
			},
			prev() {
				if (!this.modal.isOpen) {
					return;
				}
				this.skip(-1);
			},
			escPressed(e) {
				if (!this.modal.isOpen) {
					return;
				}
				this.toggleModal();
      },
      toggleModal(step) {
      step = step || 1;
			let self = this;
      if(!this.modal.isOpen) {
				this.modal.isOpen = true;
        setTimeout(function() {
          self.$sections = self.$el.querySelectorAll('section');
          self.max = self.$sections.length;
          self.goToStep(step);
        }, 1);
			} else {
				this.$refs.dal.close();
        if (this.isLastStep) {
          window.SegMap.Tutorial.DoneWithTutorial();
				}
				setTimeout(function () {
					self.modal.isOpen = false;
				}, 500);
      }
    },
    noThanks() {
      if (window.SegMap) {
        window.SegMap.Tutorial.DoneWithTutorial();
      }
      this.toggleModal();
    },
    setCssVars() {
      this.$el.style.setProperty('--x', (((this.step * 100) - 100) * this.x_multiplier) + '%');
      this.$el.style.setProperty('--y', (((this.step * 100) - 100) * this.y_multiplier) + '%');
      this.$el.style.setProperty('--axis', this.axis);
      this.$el.style.setProperty('--axis-reverse', this.axisReverse);
      this.$el.style.setProperty('--cross', this.cross);
      this.$el.style.setProperty('--cross-reverse', this.crossReverse);
      // this.$el.style.setProperty('--vision', this.xray);
    },
    goToStep(step) {
      this.step = step > this.max ? this.max : step < 1 ? 1 : step;
      this.currentSection = this.$sections[this.step - 1];
      this.$sections.forEach(function(section) {
        section.classList.remove('current');
      });
      this.currentSection.classList.add('current');
      this.currentSection.scrollTop = 0;
      this.setCssVars();
    },
    skip(step) {
      this.step += step;
      this.goToStep(this.step);
    },
    reset() {
      this.goToStep(1);
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
  float:right;
  margin-top: 3px;
  margin-right: 10px;
	cursor: pointer;
	cursor: hand;
}
.closeButton:hover {
  color: #888;
}

.halves {
  max-width: 350px;
  font-size: 14px;
  margin-left: 30px;
  float: left;
}
.topper {
position: absolute;
    top: 0;
    left: 0;
    background-color: #e61b1b;
    width: 100%;
    border-radius: 2px;
    color: white;
    padding: 8px;
    font-size: 26px;
}
// modal content sliders
article {
  flex: 1 1 100%;
  height: 100%;
  display: flex;
  flex-direction: var(--axis, row);
  overflow: hidden;
}
.articleContent {
  position: relative; padding-left: 18px; margin-right: 10px;
}
.articleTitle {
  padding: 6px 0 6px 12px; font-size: 27px;
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
  margin: -10px -10px 30px -10px;
  background-color: #00A0D2; color: #ffffff;
}
section p {
  font-size: 18px;
  padding-left: 0px;
}

section {
  width: 100%;
  visibility: hidden;
  flex: 0 0 100%;
  font-size: 18px;
  padding: 10px;
  overflow: auto;
  will-change: transform;
  transform: translate(var(--x, 0%), var(--y, 0%));
  transition: transform 300ms ease-out;
  position: relative;
  h2,h3,h4 {
    margin-top: 0;
  }
  &.current {
    visibility: visible;
  }
}
span.step {
  background: #808080;
  border-radius: 0.8em;
  -moz-border-radius: 0.8em;
  -webkit-border-radius: 0.8em;
  color: #ffffff;
  display: inline-block;
  font-weight: bold;
  line-height: 1.6em;
  margin-right: 5px;
  text-align: center;
  width: 1.6em;
}

footer {
  position: relative;
  text-align: right;
  display: flex;
  flex-direction: var(--axis-reverse, row-reverse);
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 0 0 1px rgba(#000, .1);
  background: rgba(#000, .05);
  &:not(:empty) {
    padding: 1em;
  }
}

.step-dots {
  display: flex;
  flex-direction: var(--axis, row);
}
.step-dot {
  cursor: pointer;
  width: 1em;
  height: 1em;
  margin: .5ch;
  border-radius: 1em;
  background: currentColor;
  opacity: .2;
  transition: transform 100ms ease-out, opacity 150ms linear;
  &.active {
    opacity: .7;
    box-shadow: 0 0 1em -.25em;
  }
  &:hover {
    transform: scale(1.2)
  }
}
.forward-actions,
.back-actions {
  flex: 1;
  display: flex;
  flex-direction: var(--axis, row);
}
.forward-actions {
  justify-content: flex-end;
  // text-align: right;
}
.back-actions {
  justify-content: flex-start;
  // text-align: left;
}

// boring
*, *::before, *::after {box-sizing: border-box;}

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
  padding: .5em 1em;
  border-radius: .35em;
  color: rgba(#000, .7);
  background: rgba(#000, .1);
  border: 2px solid rgba(#000, .05);
  text-shadow: 0 1px 0 rgba(#fff, .4);
  transition: transform 50ms ease-out;
  will-change: transform;
  &:active {
    transform: scale(.98);
  }
  &:hover {
    color: #484848!important;
    border-color: #c0c0c0!important;
  }
  &:focus {
    border-color: var(--accent);
    box-shadow: 0 0 1em 0 var(--accent);
  }
  &[disabled] {
    opacity: .2;
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
      color: rgba(#000, .4);
    }
  }
  &.cancel:not([disabled]) {
    color: var(--accent);
  }
}



</style>

