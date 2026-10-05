<template>
	<div class="pal-page">
		<aside class="pal-index">
			<div class="pal-brand">
				<div class="pal-brand-title">Paletas</div>
				<div class="pal-brand-detail">Backoffice · controles vigentes</div>
			</div>
			<nav>
				<a v-for="section in sections" :key="section.id" href="#" class="pal-link"
					 :class="{ 'is-selected': activeSectionId === section.id }" @click.prevent="goTo(section.id)">{{ section.title }}</a>
			</nav>
			<div class="pal-index-foot">
				<md-button class="md-raised" @click="toggleAll">{{ toggleAllLabel }}</md-button>
			</div>
		</aside>
		<main ref="content" class="pal-main" @scroll="updateActiveSection">
			<div class="pal-container">
				<header class="pal-cover">
					<h1>Paletas del backoffice</h1>
					<p>
						Una muestra de cada control vigente, con el código para usarlo. Se apoya en Vue Material; los ajustes globales
						están en <code>common/styles/admin/</code> y los colores y las medidas compartidos, en <code>tokens.css</code>.
					</p>
				</header>
				<section v-for="section in sections" :id="'pal-' + section.id" :key="section.id" class="pal-section">
					<h2>{{ section.title }}</h2>
					<p v-if="section.summary" class="pal-summary">{{ section.summary }}</p>
					<div v-for="group in section.tokenGroups" :key="group.name" class="pal-token-group">
						<h3>{{ group.name }}</h3>
						<div class="pal-tokens">
							<div v-for="name in group.names" :key="name" class="pal-token">
								<span v-if="group.kind === 'color'" class="pal-checker">
									<span class="pal-swatch" :style="{ backgroundColor: 'var(' + name + ')' }"></span>
								</span>
								<span v-else-if="group.kind === 'radius'" class="pal-shape-slot">
									<span class="pal-shape" :style="{ borderRadius: 'var(' + name + ')' }"></span>
								</span>
								<span v-else-if="group.kind === 'size'" class="pal-shape-slot">
									<span class="pal-shape" :style="{ width: 'var(' + name + ')', height: 'var(' + name + ')' }"></span>
								</span>
								<span class="pal-token-text">
									<code>{{ name }}</code>
									<small>{{ tokenValues[name] }}</small>
								</span>
							</div>
						</div>
					</div>
					<paleta-ejemplo v-for="(example, index) in section.examples" :key="exampleKey(section, index)"
													:example="example" :open="isOpen(section, index)" @toggle="toggleExample(section, index)" />
				</section>
			</div>
		</main>
	</div>
</template>

<script>
import PaletaEjemplo from '@/backoffice/views/Paletas/PaletaEjemplo';
import sections from '@/backoffice/views/Paletas/paletasCatalogo';

const ACTIVE_SECTION_OFFSET = 80;

export default {
	name: 'Paletas',
	components: { PaletaEjemplo },
	data() {
		return {
			sections: sections,
			openExamples: {},
			activeSectionId: sections[0].id,
			tokenValues: {}
		};
	},
	computed: {
		allOpen() {
			for (var section of this.sections) {
				for (var index = 0; index < section.examples.length; index++) {
					if (!this.isOpen(section, index)) {
						return false;
					}
				}
			}
			return true;
		},
		toggleAllLabel() {
			if (this.allOpen) {
				return 'Ocultar todo el código';
			}
			return 'Mostrar todo el código';
		}
	},
	created() {
		this.previousTitle = document.title;
		document.title = 'Paletas · Poblaciones';
	},
	beforeDestroy() {
		document.title = this.previousTitle;
	},
	mounted() {
		this.readTokenValues();
		this.updateActiveSection();
	},
	methods: {
		exampleKey(section, index) {
			return section.id + '-' + index;
		},
		isOpen(section, index) {
			return this.openExamples[this.exampleKey(section, index)] === true;
		},
		toggleExample(section, index) {
			this.$set(this.openExamples, this.exampleKey(section, index), !this.isOpen(section, index));
		},
		toggleAll() {
			var open = !this.allOpen;
			for (var section of this.sections) {
				for (var index = 0; index < section.examples.length; index++) {
					this.$set(this.openExamples, this.exampleKey(section, index), open);
				}
			}
		},
		readTokenValues() {
			var rootStyle = getComputedStyle(document.documentElement);
			for (var section of this.sections) {
				for (var group of section.tokenGroups || []) {
					for (var name of group.names) {
						this.$set(this.tokenValues, name, rootStyle.getPropertyValue(name).trim());
					}
				}
			}
		},
		goTo(sectionId) {
			this.$el.querySelector('#pal-' + sectionId).scrollIntoView({ behavior: 'smooth', block: 'start' });
		},
		updateActiveSection() {
			var contentTop = this.$refs.content.getBoundingClientRect().top;
			var activeId = this.sections[0].id;
			for (var section of this.sections) {
				var sectionTop = this.$el.querySelector('#pal-' + section.id).getBoundingClientRect().top;
				if (sectionTop - contentTop <= ACTIVE_SECTION_OFFSET) {
					activeId = section.id;
				}
			}
			this.activeSectionId = activeId;
		}
	}
};
</script>

<style scoped>
.pal-page {
	position: fixed;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	display: flex;
	background: var(--mp-hover-soft);
	color: var(--mp-text);
	font-size: 14px;
}

.pal-index {
	display: flex;
	flex: 0 0 232px;
	flex-direction: column;
	padding: 20px 12px;
	border-right: 1px solid var(--mp-outline);
	background: var(--mp-surface);
	overflow-y: auto;
}

.pal-brand {
	padding: 0 12px 16px;
}

.pal-brand-title {
	font-size: 20px;
	font-weight: 600;
}

.pal-brand-detail {
	color: var(--mp-text-faint);
	font-size: 12.5px;
}

.pal-link {
	display: block;
	padding: 6px 12px;
	border-radius: var(--mp-radius-pill);
	color: var(--mp-text-muted);
	font-size: 13.5px;
	text-decoration: none;
	transition: background-color var(--mp-transition);
}

.pal-link:hover {
	background-color: var(--mp-hover);
	color: var(--mp-text);
	text-decoration: none;
}

.pal-link.is-selected {
	background-color: var(--mp-selected);
	color: var(--mp-text);
}

.pal-index-foot {
	margin-top: auto;
	padding: 16px 12px 0;
}

.pal-main {
	flex: 1;
	min-width: 0;
	padding: 32px 40px 96px;
	overflow-y: auto;
}

.pal-container {
	max-width: 940px;
	margin: 0 auto;
}

.pal-cover h1 {
	margin: 0 0 8px;
	font-size: 30px;
	font-weight: 600;
}

.pal-cover p {
	max-width: 680px;
	margin: 0 0 8px;
	color: var(--mp-text-muted);
	font-size: 15px;
	line-height: 1.55;
}

.pal-cover code {
	padding: 1px 5px;
	border-radius: var(--mp-radius-sm);
	background: var(--mp-hover);
	color: var(--mp-text);
	font-size: 13px;
}

.pal-section {
	padding-top: 32px;
	scroll-margin-top: 8px;
}

.pal-section h2 {
	margin: 0 0 6px;
	padding-bottom: 8px;
	border-bottom: 1px solid var(--mp-outline);
	font-size: 22px;
	font-weight: 600;
}

.pal-summary {
	margin: 0 0 16px;
	color: var(--mp-text-muted);
	font-size: 14px;
	line-height: 1.5;
}

.pal-token-group h3 {
	margin: 18px 0 8px;
	font-size: 13px;
	font-weight: 600;
	text-transform: uppercase;
	color: var(--mp-text-faint);
}

.pal-tokens {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
	gap: 8px;
}

.pal-token {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 8px 10px;
	border: 1px solid var(--mp-outline);
	border-radius: var(--mp-radius-md);
	background: var(--mp-surface);
}

.pal-checker {
	display: block;
	flex: 0 0 36px;
	width: 36px;
	height: 36px;
	border: 1px solid var(--mp-outline);
	border-radius: var(--mp-radius-sm);
	background-image: linear-gradient(45deg, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%),
		linear-gradient(45deg, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%);
	background-position: 0 0, 6px 6px;
	background-size: 12px 12px;
	overflow: hidden;
}

.pal-swatch {
	display: block;
	width: 100%;
	height: 100%;
}

.pal-shape-slot {
	display: flex;
	flex: 0 0 40px;
	align-items: center;
	justify-content: center;
}

.pal-shape {
	display: block;
	width: 36px;
	height: 36px;
	border: 2px solid var(--mp-selection);
	background: var(--mp-selected);
}

.pal-token-text {
	display: flex;
	min-width: 0;
	flex-direction: column;
}

.pal-token-text code {
	color: var(--mp-text);
	font-size: 12.5px;
}

.pal-token-text small {
	color: var(--mp-text-faint);
	font-size: 12px;
}

@media (max-width: 860px) {
	.pal-index {
		display: none;
	}

	.pal-main {
		padding: 20px 16px 80px;
	}
}
</style>
