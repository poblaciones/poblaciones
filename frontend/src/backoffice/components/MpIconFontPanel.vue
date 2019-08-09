<template>
	<div class="iconPicker__body">
		<div class="iconPicker__icons">
			<a
				href="#"
				@click.stop.prevent="iconClicked(key)"
				:class="`item ${selected === key ? 'selected' : ''}`"
				v-for="(value, key) in currentIcons"
				:key="key"><i :class="getClass(key)"></i>
				</a>
			<a style="font-size: 14px; width: unset"
				href="#"
				@click.stop.prevent="iconClicked(null)"
				:class="`item ${selected === null ? 'selected' : ''}`"
			>
				Ninguno
			</a>
		</div>
	</div>
</template>

<script>
import fontAwesomeIconsList from '@/common/js/fontAwesomeIconsList';
import flatIconsList from '@/common/js/flatIconsList';

export default {
	name: 'mpIconFontPanel',
	props: {
					'searchBox' : String,
					'collection' : String,
					'value': String },
	data () {
		return {
			selected: '',
		};
	},
	computed: {
		searchPlaceholder () {
			return this.searchBox || 'search box';
		},
		currentIcons() {
			if (this.collection === 'fontawesome') {
				return fontAwesomeIconsList.icons;
			} else {
				return flatIconsList.icons;
			}
		}
	},
	created() {
		this.receiveValue();
	},
	methods: {
		getClass(icon) {
			if (this.collection === 'fontawesome') {
				return icon;
			} else {
				return icon.substring(4);
			}
		},
		receiveValue() {
			this.selected = this.value;
		},
		iconClicked(key) {
			this.selected = key;
			this.selectIcon(key);
		},
		selectIcon (value) {
			this.$emit('input', value);
			this.$emit('selectIcon', value);
		},
		filterIcons (event) {
			const search = event.target.value.trim();
			let filter = [];
			if (search.length > 3) {
				filter = this.currentIcons.filter((item) => {
					const regex = new RegExp(search, 'gi');
					return item.match(regex);
				});
			} else if (search.length === 0) {
				this.icons = this.currentIcons;
			}
			if (filter.length > 0) {
				this.icons = filter;
			}
		},
	},
	watch: {
		'value'() {
			this.receiveValue();
		}
	}
};
</script>

<style>
	.iconPicker__body {
		position: relative;
		max-height: 219px;
		overflow: auto;
		padding: 0.5em;
	}
	.iconPicker__icons {
		display: table;
	}
	.iconPicker__icons .item {
		float: left;
	    width: 40px;
	    height: 40px;
	    padding: 9px;
	    margin: 6px 6px 6px 6px;
	    text-align: center;
	    border-radius: 3px;
	    font-size: 20px;
	    box-shadow: 0 0 0 1px #ddd;
	    color: #666 !important;
	}
	.iconPicker__icons .item.selected {
		background: #ccc;
	}
	.iconPicker__icons .item i {
		box-sizing: content-box;
	}
	.fla {

	}
</style>
