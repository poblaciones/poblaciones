<template>
	<div class="mpLabelItem" @click="clicked" :style="(clickeable ? 'cursor: pointer': '')"
			 :class="(!hasSpaces(text) ? 'wrapAllPlaces' : '')">
		<v-clamp autoresize :expanded.sync="expanded" ref="bl"
						 :max-height="'10rem'"
						 ellipsis="..."
						 location="end" v-html="process(text)">
		</v-clamp>
		<div v-if="hasMoreText" style="text-align: right; padding-top: 2px; margin-bottom: -5px; position: relative;">
			<span v-if="!expanded" style="position: absolute; right: 10px; top: -20px;">...</span>
			<a href="#" @click="toggle"
				 :title="(expanded ? 'Ver menos' : 'Ver más')" style="font-size: 12px; color: #666;">
				<i v-if="expanded" class="fas fa-angle-up"></i>
				<i v-else class="fas fa-angle-down"></i>
				{{ expanded == true ? "menos" : "más" }}
			</a>
		</div>

	</div>
</template>

<script>

	import VClamp from "vue-clamp";
	// https://blog.logrocket.com/vue-clamp-truncate-text-vue-apps/

export default {
	name: 'mpLabel',
	props: {
		text: { type: String, default: ''	},
		clickeable: { type: Boolean, default: false }
	},
	components: {
			VClamp,
	},
	data() {
		return {
			clamped: false,
			expanded: false,
			hasMoreText: false
		};
		},
		mounted() {
			setTimeout(() => {
				if (this.$refs.bl) {
					var b = this.$refs.bl;
					this.hasMoreText = (b.$el.offsetHeight < b.$el.scrollHeight);
				}
			}, 100);
		},
	methods: {
		process(val) {
			var linkifyStr = require('linkifyjs/string');
			return linkifyStr(val, {
				defaultProtocol: 'https'
			});
		},
		toggle() {
			this.expanded = !this.expanded;
		},
		clicked(e) {
			if (this.clickeable) {
				this.$emit('click', e);
			}
		},
		hasSpaces(val) {
			if (val) {
				return val.indexOf(' ') !== -1;
			} else {
				return false;
			}
		},
	},
};
</script>

<style scoped>
	.mpLabelItem {
		word-wrap: break-word;
	}
	.wrapAllPlaces {
		word-break: break-all;
	}
</style>

