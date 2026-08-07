<template>
	<div v-hotkey="keymap" :class="{ 'content-wizard--dark': darkMode }">
    <boardal v-if="modal.isOpen" ref="dal" :has-mask="hasMask" style="z-index: 2000"
             :can-click-mask="canClickMask" :has-x="hasX" @toggle="hide">
			<article v-cloak>
				<template v-for="currentStep in steps">
					<img v-if="currentStep.previewImage" :key="'preload-' + currentStep.Id" style="display: none" :src="currentStep.previewImage" />
				</template>

				<section v-for="currentStep in steps" :key="currentStep.Id" style="overflow: hidden">
					<div class="articleTitle" :style="titleStyle">
						<div class="closeButton" @click="hide">
							<close-icon title="Cerrar" />
						</div>
						{{ currentTitle }}
					</div>
					<div class="articleContent">
						<div :style="floatAlignment(currentStep)" class="stepImage" v-if="currentStep.Alignment !== 'C'">
							<img v-if="currentStep.previewImage" style="max-height: 250px;" :src="currentStep.previewImage" />
						</div>
						<div class="articleText" :style="(currentStep.Alignment !== 'C' ? 'padding: 10px 20px 20px 20px;' : 'padding: 0px')"
								 v-html="currentStep.Content">
						</div>
						<div v-if="currentStep.Alignment === 'C'">
							<img v-if="currentStep.previewImage" :style="'max-height: ' + (currentStep.Content ? '210px' : '250px')"
									 :src="currentStep.previewImage" />
						</div>
					</div>
				</section>
			</article>
      <footer>
        <div class="forward-actions">
          <button class="primary next" :disabled="isLastStep" v-show="!isLastStep" @click="skip(1)">
            <template v-if="nextLabel">{{ nextLabel }} </template><i class="fa fa-fw fa-lg" :class="nextIcon"></i>
          </button>
          <button class="accent save" :disabled="!isLastStep" v-show="isLastStep" @click="finish">
            <template v-if="finishLabel">{{ finishLabel }} </template><i class="fa fa-fw fa-lg fa-check"></i>
          </button>
        </div>
        <div class="step-dots" v-if="hasDots">
          <div class="step-dot" v-for="n in max" :key="n" :class="{active: n === step}" @click="goToStep(n)"></div>
        </div>
        <div class="back-actions">
          <button class="secondary cancel prev" :disabled="isFirstStep" v-show="!isFirstStep" @click="skip(-1)">
            <i class="fa fa-fw fa-lg" :class="backIcon"></i><template v-if="backLabel"> {{ backLabel }}</template>
          </button>
        </div>
      </footer>
    </boardal>
  </div>
</template>

<script>
import boardal from '@/map/components/controls/boardal';
import CloseIcon from 'vue-material-design-icons/Close.vue';

// Componente genérico de asistente paso a paso (avisos, onboarding, tutoriales).
// Encapsula la lógica de navegación entre pasos y su presentación dentro de un
// boardal. El consumidor solo necesita proveer el array de "steps" y, opcionalmente,
// personalizar color de título, textos de botones y comportamiento del boardal.
//
// Cada elemento de "steps" admite las siguientes propiedades (mismas claves
// que ya trae onboarding.Steps, para no requerir remapeo en los componentes
// que consumen este wizard):
//   - Id: identificador único del paso (requerido, usado como :key)
//   - previewImage: ruta de la imagen del paso (opcional)
//   - Alignment: 'L' | 'R' | 'C' — ubicación de la imagen respecto del texto
//   - Name: título mostrado en la cabecera mientras ese paso está activo
//   - Content: HTML del cuerpo del paso (se renderiza con v-html)
//
// API pública (via $refs):
//   - show(startStep = 1): abre el wizard incondicionalmente.
//   - hide(): lo cierra; si hay settingKey, graba el "visto" automáticamente.
//   - checkOpen(startStep = 1): evalúa settingKey (si ya fue visto), la
//     ventana since/until y userSince, y llama a show() solo si corresponde.
// Eventos emitidos: 'close' con { finished: Boolean } — finished es true cuando
// el cierre ocurrió estando en el último paso (equivalente a "completar" el
// asistente), sea cual sea el medio de cierre (botón Finalizar, X, máscara o ESC).
export default {
	name: 'ContentWizard',
	components: { boardal, CloseIcon },
	props: {
		steps: {
			type: Array,
			required: true
		},
		backgroundColor: {
			type: String,
			default: '#00A0D2'
		},
		hasMask: {
			type: Boolean,
			default: true
		},
		canClickMask: {
			type: Boolean,
			default: true
		},
		hasX: {
			type: Boolean,
			default: false
		},
		showDots: {
			type: Boolean,
			default: true
		},
		orientation: {
			type: String,
			default: 'row'
		},
		nextLabel: {
			type: String,
			default: ''
		},
		backLabel: {
			type: String,
			default: ''
		},
		finishLabel: {
			type: String,
			default: ''
		},
		// Clave de configuración de usuario bajo la cual este wizard graba y
		// consulta si ya fue visto. Se llama "settingKey" y no "key" porque
		// "key" es un atributo reservado de Vue y no puede usarse como prop.
		// Si se omite, checkOpen() no persiste ni consulta ningún estado de
		// "visto": solo evalúa la ventana temporal (since/until/userSince).
		settingKey: {
			type: String,
			default: null
		},
		// Ventana temporal (opcional) durante la cual checkOpen() considera
		// mostrar el wizard. Strings parseables por Date (p. ej. ISO 8601).
		since: {
			type: String,
			default: null
		},
		until: {
			type: String,
			default: null
		},
		// Fecha (opcional) tal que checkOpen() solo muestra el wizard a
		// usuarios cuya cuenta se creó después de esta fecha, es decir,
		// cuando userSince es anterior a window.Context.CreateTime.
		userSince: {
			type: String,
			default: null
		},
		// Si es true, oscurece la máscara de boardal (fondo negro al 5% por
		// defecto en boardal.vue) a rgb(0 0 0 / 69%). Se aplica sin modificar
		// boardal.vue: ver el selector ::v-deep en <style> más abajo.
		darkMode: {
			type: Boolean,
			default: false
		}
	},
	data() {
		return {
			modal: { isOpen: false },
			step: 1,
			max: 1
		};
	},
	computed: {
		currentTitle() {
			var current = this.steps[this.step - 1];
			return current ? current.Name : '';
		},
		titleStyle() {
			return 'background-color: ' + this.backgroundColor;
		},
		keymap() {
			return {
				enter: this.nextOrHide,
				right: this.next,
				left: this.prev,
				esc: this.hide
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
		xMultiplier() {
			return (this.orientation === 'row' ? -1 : 0);
		},
		yMultiplier() {
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
		}
	},
	watch: {
		orientation() {
			this.setCssVars();
		}
	},
	methods: {
		// --- API pública ---
		show(startStep) {
			startStep = startStep || 1;
			var self = this;
			this.modal.isOpen = true;
			this.$nextTick(function () {
				setTimeout(function () {
					self.$sections = self.$el.querySelectorAll('section');
					self.max = self.$sections.length;
					self.goToStep(startStep);
				}, 1);
			});
		},
		hide() {
			if (!this.modal.isOpen) { return; }
			var finished = this.isLastStep;
			var self = this;
			if (this.$refs.dal) {
				this.$refs.dal.close();
			}
			setTimeout(function () {
				self.modal.isOpen = false;
			}, 500);
			if (this.settingKey) {
				window.Db.SetUserSetting(this.settingKey, true);
			}
			this.$emit('close', { finished: finished });
		},
		// Evalúa settingKey/since/until/userSince y llama a show() si
		// corresponde. Pensado para wizards que se auto-gestionan (avisos),
		// a diferencia de show(), que un padre puede invocar sin condiciones
		// (p. ej. un onboarding con su propia lógica de disparo).
		checkOpen(startStep) {
			if (this.settingKey && window.Db.GetUserSetting(this.settingKey, false)) {
				return;
			}
			if (!this.isWithinTimeWindow() || !this.isEligibleForUser()) {
				return;
			}
			this.show(startStep);
		},
		isWithinTimeWindow() {
			var now = new Date();
			if (this.since && now < new Date(this.since)) {
				return false;
			}
			if (this.until && now > new Date(this.until)) {
				return false;
			}
			return true;
		},
		isEligibleForUser() {
			if (!this.userSince) {
				return true;
			}
			var createTime = (window.Context && window.Context.CreateTime) ? new Date(window.Context.CreateTime) : null;
			if (!createTime) {
				return true;
			}
			return new Date(this.userSince) < createTime;
		},
		// --- navegación interna ---
		nextOrHide() {
			if (!this.modal.isOpen) { return; }
			if (this.step === this.max) {
				this.hide();
			} else {
				this.next();
			}
		},
		next() {
			if (this.modal.isOpen) { this.skip(1); }
		},
		prev() {
			if (this.modal.isOpen) { this.skip(-1); }
		},
		finish() {
			this.hide();
		},
		floatAlignment(currentStep) {
			if (currentStep.Alignment === 'L') {
				return 'float: left; padding-right: 26px;';
			} else if (currentStep.Alignment === 'R') {
				return 'float: right; padding-left: 26px;';
			}
			return '';
		},
		setCssVars() {
			this.$el.style.setProperty('--x', (((this.step * 100) - 100) * this.xMultiplier) + '%');
			this.$el.style.setProperty('--y', (((this.step * 100) - 100) * this.yMultiplier) + '%');
			this.$el.style.setProperty('--axis', this.axis);
			this.$el.style.setProperty('--axis-reverse', this.axisReverse);
			this.$el.style.setProperty('--cross', this.cross);
			this.$el.style.setProperty('--cross-reverse', this.crossReverse);
		},
		goToStep(step) {
			this.step = step > this.max ? this.max : step < 1 ? 1 : step;
			this.currentSection = this.$sections[this.step - 1];
			this.$sections.forEach(function (section) {
				section.classList.remove('current');
			});
			if (this.currentSection) {
				this.currentSection.classList.add('current');
				this.currentSection.scrollTop = 0;
			}
			this.setCssVars();
			this.$emit('step-change', this.step);
		},
		skip(delta) {
			this.step += delta;
			this.goToStep(this.step);
		}
	}
};
</script>

<style lang="scss">
.articleText p {
	font-size: 18px !important;
	margin-bottom: 1.2em;
}
</style>

<style scoped lang="scss">
:root {
	--accent: #8fd1f2;
}
.content-wizard--dark {
	::v-deep .boardal__mask {
		background-color: rgb(0 0 0 / 69%);
	}
}
[v-cloak] {
	display: none;
}
.stepImage {
	height: 250px;
}
.closeButton {
	float: right;
	margin-top: 3px;
	margin-right: 10px;
	cursor: pointer;
}
.closeButton:hover {
	color: #888;
}
article {
	flex: 1 1 100%;
	height: 100%;
	display: flex;
	flex-direction: var(--axis, row);
	overflow: hidden;
}
.articleContent {
	position: relative;
	padding-left: 18px;
	margin-right: 10px;
}
.articleContent > p {
	font-size: 18px;
	margin-bottom: 1.2em;
}
.articleTitle {
	padding: 6px 0 6px 12px;
	font-size: 25px;
	border-top-left-radius: 3px;
	border-top-right-radius: 3px;
	font-weight: 100;
	margin: -10px -10px 29px -10px;
	color: #ffffff;
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
	h2, h3, h4 {
		margin-top: 0;
	}
	&.current {
		visibility: visible;
	}
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
}
.back-actions {
	justify-content: flex-start;
}
*, *::before, *::after {
	box-sizing: border-box;
}
p {
	line-height: 1.5;
}
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
		color: #484848 !important;
		border-color: #c0c0c0 !important;
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
