<template>
	<div class="iconPicker__body">
		<div class="iconPicker__icons">
			<a
				href="#"
				@click.stop.prevent="iconClicked(key, value)"
				@dblclick.stop.prevent="iconDoubleClicked(key)"
				:class="'item' + getIsSelectedClass(key, value) + (collection == 'fontawesome' ? ' faItem' : '')  + (collection == 'custom' ? ' customItem' : '')"
				v-for="(value, key) in currentIcons"
				:key="key">
					<span v-html="resolveIcon(key, value)"></span>
					<md-tooltip md-direction="bottom">{{ resolveTitle(key, value) }}</md-tooltip>
				</a>
		</div>
	</div>
</template>

<script>
import fontAwesomeIconsList from '@/common/js/fontAwesomeIconsList';
import mapIconsList from '@/common/js/mapIconsList';
import iconManager from '@/common/js/iconManager';

export default {
	name: 'mpIconFontPanel',
	props: {
					'searchBox': String,
					'collection': String,
					'customList': Array,
					'value': String },
	data () {
		return {
			selected: '',
			selectedId: null,
		};
	},
	computed: {
		searchPlaceholder () {
			return this.searchBox || 'search box';
		},
		Work() {
			return window.Context.CurrentWork;
		},
		currentIcons() {
			if (this.collection === 'fontawesome') {
				return fontAwesomeIconsList.icons;
			} else if (this.collection === 'flaticons') {
				return mapIconsList.icons;
			} else if (this.collection === 'custom') {
				return this.customList;
			} else throw new Error('Colección de íconos no reconocida');
		}
	},
	created() {
		this.receiveValue();
	},
	methods: {
		getClass(icon) {
			if (this.collection === 'fontawesome') {
				return icon;
			} else if (this.collection === 'flaticons') {
				return icon.substring(4);
			} else {
				return '';
			}
		},
		resolveIcon(key, value) {
			var symbol = (this.collection !== 'custom' ? key : value.Caption);
			return iconManager.showIcon(symbol, this.Work.Icons, '28px');
		},
		resolveTitle(key, value) {
			return (this.collection !== 'custom' ? key : value.Caption);
		},
		getIsSelectedClass(key, value) {
			if (this.collection === 'custom') {
				return (this.selected === value.Caption ? ' selected' : '');
			} else {
				return (this.selected === key ? ' selected' : '');
			}
		},
		receiveValue() {
			this.selected = this.value;
		},
		iconDoubleClicked(key) {
			this.$emit('selectIconDoubleClick', key);
		},
		iconClicked(key, value) {
			if (this.collection === 'custom') {
				key = (value ? value.Caption : value);
				this.selectedId = value.Id;
			}
			this.selected = key;
			this.selectIcon(key);
		},
		selectIcon(value) {
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
	.faItem {
		font-size: 26px !important;
	}
	.customItem {
		padding: 11px !important;
	}
	.iconPicker__icons .item:hover {
		text-decoration: none
	}
	.iconPicker__icons .item {
		float: left;
	    width: 48px;
	    height: 48px;
			padding: 14px 10px;
			margin: 6px 6px 6px 6px;
	    text-align: center;
	    border-radius: 3px;
	    font-size: 30px;
	    box-shadow: 0 0 0 1px #ddd;
	    color: #666 !important;
	}
	.iconPicker__icons .item.selected {
		background: #ccc;
	}
	.iconPicker__icons .item i {
		box-sizing: content-box;
	}
</style>
