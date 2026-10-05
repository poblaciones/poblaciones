<template>
	<div class="pal-example">
		<div class="pal-example-head">
			<div class="pal-example-title">
				<h3>{{ example.title }}</h3>
				<p v-if="example.note">{{ example.note }}</p>
			</div>
			<div class="pal-example-actions">
				<button v-if="hasState" type="button" class="mp-icon-btn mp-icon-btn--sm" title="Reiniciar la muestra"
								aria-label="Reiniciar la muestra" @click="resetState"><i class="fas fa-undo"></i></button>
				<button type="button" class="mp-btn mp-btn--solid mp-btn--sm" :aria-pressed="$ariaPressed(open)" @click="$emit('toggle')">
					<span v-if="open">Ocultar código</span>
					<span v-else>Ver código</span>
				</button>
			</div>
		</div>
		<div class="pal-view" :class="frameClass">
			<component :is="preview" />
		</div>
		<div v-if="hasLiveValues" class="pal-live-values">
			<span>Valor actual</span>
			<code>{{ liveValues }}</code>
		</div>
		<div v-if="open" class="pal-code">
			<div class="pal-code-bar">
				<span>Código</span>
				<button type="button" class="mp-btn mp-btn--sm pal-copy" v-clipboard="() => example.code" v-clipboard:success="markCopied">
					<span v-if="copied">Copiado</span>
					<span v-else>Copiar</span>
				</button>
			</div>
			<pre><code><span v-for="(token, index) in codeTokens" :key="index" :class="'pal-tk-' + token.kind">{{ token.text }}</span></code></pre>
			<div v-if="hasState" class="pal-code-data">
				<div class="pal-code-bar"><span>Datos</span></div>
				<pre>{{ initialData }}</pre>
			</div>
		</div>
	</div>
</template>

<script>
import Modal from '@/map/components/popups/modal';

const MAX_STRING_LENGTH = 48;
const TOKEN_PATTERN = /("[^"]*")|(<\/?[A-Za-z][\w-]*)|([:@#]?[A-Za-z][\w.:-]*)(?==)/g;

function abbreviate(text) {
	if (text.length > MAX_STRING_LENGTH) {
		return text.substr(0, MAX_STRING_LENGTH) + '…';
	}
	return text;
}

function formatValue(value) {
	if (typeof value === 'string') {
		return "'" + abbreviate(value) + "'";
	}
	if (Array.isArray(value)) {
		var items = [];
		for (var item of value) {
			items.push(formatValue(item));
		}
		return '[' + items.join(', ') + ']';
	}
	if (value !== null && typeof value === 'object') {
		var entries = [];
		for (var key of Object.keys(value)) {
			entries.push(key + ': ' + formatValue(value[key]));
		}
		return '{ ' + entries.join(', ') + ' }';
	}
	return String(value);
}

export default {
	name: 'paletaEjemplo',
	props: {
		example: { type: Object, required: true },
		open: { type: Boolean, default: false }
	},
	data() {
		return {
			liveState: this.cloneState(),
			copied: false,
			copiedTimer: null
		};
	},
	computed: {
		// La muestra devuelve el mismo objeto de estado que esta página, que así puede exhibir los valores actuales.
		preview() {
			var state = this.liveState;
			return {
				template: '<div class="pal-row">' + this.example.code + '</div>',
				components: { Modal },
				data: function () {
					return state;
				}
			};
		},
		frameClass() {
			if (this.example.frame) {
				return 'pal-frame-' + this.example.frame;
			}
			return '';
		},
		hasState() {
			return Object.keys(this.example.state || {}).length > 0;
		},
		visibleState() {
			var keys = this.example.visible;
			if (!keys) {
				keys = Object.keys(this.liveState);
			}
			var subset = {};
			for (var key of keys) {
				subset[key] = this.liveState[key];
			}
			return subset;
		},
		hasLiveValues() {
			return Object.keys(this.visibleState).length > 0;
		},
		liveValues() {
			return formatValue(this.visibleState);
		},
		initialData() {
			return formatValue(this.example.state);
		},
		codeTokens() {
			var code = this.example.code;
			var tokens = [];
			var position = 0;
			TOKEN_PATTERN.lastIndex = 0;
			var match = TOKEN_PATTERN.exec(code);
			while (match !== null) {
				if (match.index > position) {
					tokens.push({ kind: 'plain', text: code.substring(position, match.index) });
				}
				tokens.push({ kind: this.resolveKind(match), text: match[0] });
				position = match.index + match[0].length;
				match = TOKEN_PATTERN.exec(code);
			}
			if (position < code.length) {
				tokens.push({ kind: 'plain', text: code.substring(position) });
			}
			return tokens;
		}
	},
	beforeDestroy() {
		clearTimeout(this.copiedTimer);
	},
	methods: {
		cloneState() {
			return JSON.parse(JSON.stringify(this.example.state || {}));
		},
		resetState() {
			this.liveState = this.cloneState();
		},
		resolveKind(match) {
			if (match[1]) {
				return 'str';
			}
			if (match[2]) {
				return 'tag';
			}
			return 'attr';
		},
		markCopied() {
			clearTimeout(this.copiedTimer);
			this.copied = true;
			this.copiedTimer = setTimeout(() => {
				this.copied = false;
			}, 1500);
		}
	}
};
</script>

<style scoped>
.pal-example {
	margin-bottom: 20px;
	border: 1px solid var(--mp-outline);
	border-radius: var(--mp-radius-md);
	background: var(--mp-surface);
	overflow: hidden;
}

.pal-example-head {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 16px;
	padding: 12px 16px;
}

.pal-example-title h3 {
	margin: 0;
	color: var(--mp-text);
	font-size: 15px;
	font-weight: 600;
	line-height: 1.4;
}

.pal-example-title p {
	margin: 2px 0 0;
	color: var(--mp-text-faint);
	font-size: 13px;
	line-height: 1.45;
}

.pal-example-actions {
	display: flex;
	flex-shrink: 0;
	align-items: center;
	gap: 6px;
}

.pal-view {
	padding: 20px 16px;
	border-top: 1px solid var(--mp-hover);
	background: var(--mp-surface);
}

.pal-row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 12px;
}

.pal-frame-map {
	background: #cdd7dc;
}

.pal-frame-color {
	background: var(--mp-primary);
}

.pal-frame-dark {
	background: #333;
}

.pal-frame-column .pal-row {
	flex-direction: column;
	align-items: flex-start;
}

.pal-frame-panel {
	background: var(--mp-surface-muted);
}

.pal-frame-panel .pal-row {
	display: block;
	width: 320px;
	max-width: 100%;
	padding: 8px 12px;
	border: 1px solid var(--mp-outline);
	border-radius: var(--mp-radius-md);
	background: #fff;
	overflow: hidden;
}

.pal-live-values {
	display: flex;
	align-items: baseline;
	gap: 10px;
	padding: 6px 16px;
	border-top: 1px solid var(--mp-hover);
	background: var(--mp-surface-muted);
	color: var(--mp-text-faint);
	font-size: 12px;
}

.pal-live-values code {
	color: var(--mp-text);
	font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
	white-space: pre-wrap;
}

.pal-code {
	background: #1f2933;
	color: #e4e7eb;
}

.pal-code pre {
	margin: 0;
	padding: 14px 16px;
	border: 0;
	border-radius: 0;
	background: transparent;
	color: inherit;
	font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
	font-size: 12.5px;
	line-height: 1.6;
	overflow-x: auto;
	tab-size: 2;
	white-space: pre;
}

.pal-code code {
	background: transparent;
	color: inherit;
	font-family: inherit;
	font-size: inherit;
}

.pal-copy.mp-btn {
	color: #e4e7eb;
	border-color: rgba(255, 255, 255, 0.3);
}

.pal-copy.mp-btn:hover {
	border-color: rgba(255, 255, 255, 0.5);
	background-color: rgba(255, 255, 255, 0.12);
	color: #fff;
}

.pal-code-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	min-height: 32px;
	padding: 6px 12px 0 16px;
	color: #9aa5b1;
	font-size: 11px;
	text-transform: uppercase;
}

.pal-code-bar + pre {
	padding-top: 6px;
}

.pal-code-data {
	border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.pal-code-data .pal-code-bar {
	min-height: 0;
}

.pal-code-data pre {
	white-space: pre-wrap;
}

.pal-tk-tag {
	color: #7dd3fc;
}

.pal-tk-attr {
	color: #fcd34d;
}

.pal-tk-str {
	color: #86efac;
}
</style>
