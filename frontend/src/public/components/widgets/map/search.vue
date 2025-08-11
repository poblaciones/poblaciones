<template>
	<div v-hotkey="keymap" class="searchBar no-print mapsOvercontrols"
			 style="box-shadow: rgba(0, 0, 0, 0.3) 0px 1px 4px -1px !important; border-radius: 20px; ">
		<div class="input-group" style="margin-bottom: 0px; margin-right: 0px; border-radius: 20px;">
			<input v-model='text' ref='sfield' id='sfield' autocomplete="off"
						 @keyup='doSearch' class="form-control formBorder placeHolderStronger"
						 :class="getLoading()" type="text" placeholder="Buscar indicadores y lugares en Poblaciones">
			<span class="input-group-btn">
				<button @click="doSearch" class="btn btn-default lupa-button" type="button"><i class="fa fa-search"></i>
				</button>
			</span>
		</div>
		<transition name="fade">
		<div class='auto' id="auto" v-if="hasSelected()" v-on-clickaway="escapeKey">
			<ul>
				<li @click="select($event, item)" v-for="(item, index) in autolist" :key="item.Id" :class="'itemSearchCategory' + item.Type"
						@mouseover="over(item, index)"
						@mouseout="out(item, index)">
					<div v-if="item.Type === 'L'">
						<span>{{ item.Highlighted }}</span>
						<br/>
						<em class='text-softer small'>{{ item.Extra }}</em>
					</div>
					<div v-else>
						<em class='text-softer small'>{{ item.Extra }}</em>
						<br/>
						<span>{{ item.Highlighted }}</span>
						<div v-if="item.Lat && item.Lon" style="float: right; margin-top: 2px; font-size: 12px">
							<a href="#" v-clipboard="() => formatCoord(item)" title="Copiar"
								  v-clipboard:success="clipboardSuccessHandler"
				        v-clipboard:error="clipboardErrorHandler"
								@click.prevent="click">
								<i class="far fa-copy"></i>
							</a>
							{{ formatCoord(item) }}
						</div>
						<div style="clear: both"></div>
					</div>
				</li>
			</ul>
		</div>
		</transition>
	</div>
</template>

<script>
import h from '@/public/js/helper';
import Search from '@/public/classes/Search';
import { mixin as clickaway } from 'vue-clickaway';
import err from '@/common/framework/err';
import axios from 'axios';

var debounce = require('lodash.debounce');

export default {
	name: 'search',
	data() {
		return {
			loading: false,
			retCancel: null,
			autolist: [],
			searched: '',
			selindex: -1,
			doSearchDebounced: debounce(function (e) {
				if (e.keyCode === 40 ||
					e.keyCode === 38 ||
					e.keyCode === 27) {
					return;
				}
				const loc = this;
				const t = loc.text.trim().toLowerCase();
				if (t === '' || loc.searched === t) {
					return;
				}
				loc.autolist = [];
				var s = new Search(this, window.SegMap.Signatures.Search, 'a');
				s.StartSearch(t);
			}.bind(this), 1000),
			text: '',
		};
	},
	mixins: [ clickaway ],
	methods: {
		hasSelected() {
			if(this.autolist.length === 0) {
				this.searched = '';
				this.selindex = -1;
				return false;
			}
			return true;
		},
		clipboardSuccessHandler({ value, event }) {
			event.preventDefault();
			event.stopPropagation();
		},
		clipboardErrorHandler({ value, event }) {
			event.preventDefault();
			event.stopPropagation();
		},
		getLoading() {
			return {
				'loading': this.loading,
			};
		},
		clearHover() {
			this.autolist.filter(function(el) {
				el.Class = '';
			});
		},
		out(item, index) {
			this.clearHover();
			this.selindex = -1;
		},
		over(item, index) {
			this.clearHover();
			item.Class = 'lihover';
			this.selindex = index;
		},
		select(event, item) {
			if (item.Type === 'P') {
				window.SegMap.SetMyLocation(item);
			}
			else {
				window.SegMap.SelectId(item.Type, item.Id, item.Lat, item.Lon, event.ctrlKey);
			}
			this.text = '';
			this.autolist = [];
		},
		formatCoord(item) {
			return h.trimNumberCoords(item.Lat) + ',' + h.trimNumberCoords(item.Lon);
		},
		doSearch(e) {
			if (e.keyCode === 13) {
				this.doSearchDebounced.flush();
			} else {
				return this.doSearchDebounced(e);
			}
		},
		enterKey(e) {
			const loc = this;
			if(loc.hasSelected() === false) {
				this.$refs.sfield.focus();
			} else {
				loc.autolist.find(function(el) {
					if(el.Class !== '') {
						loc.select(e, el);
						return;
					};
				});
			}
		},
		arrowKeyDown(e) {
			if(this.hasSelected() === false) {
				return;
			}
			e.preventDefault();

			this.$refs.sfield.blur();

			if(this.selindex >= 0 && this.selindex < this.autolist.length - 1) {
				this.autolist[this.selindex].Class = '';
				this.selindex++;
			} else {
				this.autolist[this.autolist.length - 1].Class = '';
				this.selindex = 0;
			}
			this.autolist[this.selindex].Class = 'lihover';
		},
		arrowKeyUp(e) {
			if(this.hasSelected() === false) {
				return;
			}
			e.preventDefault();

			this.$refs.sfield.blur();

			if(this.selindex > 0) {
				this.autolist[this.selindex].Class = '';
				this.selindex--;
			} else {
				this.autolist[0].Class = '';
				this.selindex = this.autolist.length - 1;
			}
			this.autolist[this.selindex].Class = 'lihover';
		},
		escapeKey(e) {
			if(this.hasSelected()) {
				this.autolist = [];
			}
		},
	},
	computed: {
		keymap() {
			return {
				'ctrl+s': this.enterKey,
				enter: this.enterKey,
				down: this.arrowKeyDown,
				up: this.arrowKeyUp,
				esc: this.escapeKey,
				tab: this.arrowKeyDown,
				'shift+tab': this.arrowKeyUp,
			};
		},
	},
	watch: {
		text(t) {
			if(this.text === '') {
				this.escapeKey();
			}
		},
	},
};
</script>

<style scoped>
	.searchBar {
		top: 11px;
				/* transparency of search bar: */
		background-color: #fcfcfccc;
		z-index: 1;
		left: calc(50%);
		margin-left: -25%;
		width: max(calc(100% - 500px), 300px);
		min-width: 200px;
		max-width: 400px;
		position: absolute;
	}

		/* condition for screen size minimum of 1000px */
	@media (max-width:540px) {
		.searchBar {
			left: max(209px,calc(50% - (calc(100% - 350px))/2));
			width: max(calc(100% - 300px), 200px);
		}

		.lupa-button {
			width: 40px;
			padding-left: 6px;
		}
}

	.searchBar:focus-within {
		border-left: 1px solid #ddd;
		border-bottom: 1px solid #ddd;
		border-top: 1px solid #ddd;
		background-color: white;
		transform: translate(-1px, -1px);
	}

	.lupa-button {
		border: 0px;
		border-left: 0px;
		background-color: transparent!important;
	}

.auto {
	background: white;
	border: 1px solid #ccc;
	border-radius: 3px;
	top:50px;
}
ul {
	list-style: none;
	padding: 1px;
	margin: 1px;
}
	li {
		padding: 1px 5px 3px 5px;
		margin: 0px;
		cursor: pointer;
		cursor: hand;
		border-bottom: 1px solid #ccc;
	}
li:last-child {
	border-bottom: 0px;
}

.fade-enter-active, .fade-leave-active {
	transition: opacity .1s
}
.fade-enter, .fade-leave-to {
	opacity: 0
}
.btn, .navbar .navbar-nav > li > a.btn {
background-color: white;
}
.btn:hover {
background-color: #66615B!important;
}
.loading {
	background: #ffffff url("/static/img/spinner.gif") no-repeat right 5px center;
}
	.formBorder {
		border-top-left-radius: 20px;
		border-bottom-left-radius: 20px;
		background-color: transparent;
/*		border-left: 1px solid #ddd;
		border-bottom: 1px solid #ddd;
		border-top: 1px solid #ddd;
*/	}
.formBorder:focus {


}

	.placeHolderStronger::placeholder {
  color: #909090;
  opacity: 1; /* Firefox */
}
</style>

