<template>
	<div v-hotkey="keymap" class="searchBar no-print">
		<div class="input-group">
			<input v-model='text' ref='sfield' id='sfield' autofocus v-on:keyup='doSearch' class="form-control formBorder" :class="getLoading()" type="text" placeholder="Buscar">
			<span class="input-group-btn">
				<button v-on:click="doSearch" class="btn btn-default" type="button"><i class="fa fa-search"></i>
				</button>
			</span>
		</div>
		<transition name="fade">
		<div class='auto' id="auto" v-if="hasSelected()" v-on-clickaway="escapeKey">
			<ul>
				<li v-on:click="select(item)" v-for="(item, index) in autolist" :key="item.Id" :class="item.Class"
						v-on:mouseover="over(item, index)"
						v-on:mouseout="out(item, index)">
					<div v-if="item.Type === 'L'">
						<span>{{ item.Highlighted }}</span>
						<br/>
						<em class='text-softer small'>{{ item.Extra }}</em>
					</div>
					<div v-if="item.Type === 'C'">
						<em class='text-softer small'>{{ item.Extra }}</em>
						<br/>
						<span>{{ item.Highlighted }}</span>
					</div>
					<div v-if="item.Type === 'F' || item.Type === 'P'">
						<em class='text-softer small'>{{ item.Extra }}</em>
						<br/>
						<span>{{ item.Highlighted }}</span>
					</div>
					<div v-if="item.Type === 'N'">
						<em class='text-softer small'>{{ item.Extra }}</em>
						<br/>
						<span>{{ item.Highlighted }}</span>
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
import err from '@/common/js/err';
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
		getLoading() {
			return {
				'loading': this.loading,
			};
		},
		clearHover() {
			this.autolist.filter(function(el) {
				el.class = '';
			});
		},
		out(item, index) {
			this.clearHover();
			// item.class = '';
			this.selindex = -1;
		},
		over(item, index) {
			this.clearHover();
			item.class = 'lihover';
			this.selindex = index;
		},
		select(item) {
			if (item.Type === 'P') {
				window.SegMap.SetMyLocation(item);
			}
			else {
				window.SegMap.SelectId(item.Type, item.Id, item.Lat, item.Lon);
			}
			this.text = '';
			this.autolist = [];
		},
		doSearch: debounce(function(e)
			{
				if(e.keyCode === 40 ||
					e.keyCode === 38 ||
					e.keyCode === 27) {
					return;
				}
				const loc = this;
				const t = loc.text.trim().toLowerCase();
				if(t === '' || loc.searched === t) {
					return;
				}
				loc.autolist = [];
				var s = new Search(this, window.SegMap.Revisions.Search, 'a');
				s.StartSearch(t);
			},
			500),
		enterKey(e) {
			const loc = this;
			if(loc.hasSelected() === false) {
				this.$refs.sfield.focus();
			} else {
				loc.autolist.find(function(el) {
					if(el.class !== '') {
						loc.select(el);
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
				this.autolist[this.selindex].class = '';
				this.selindex++;
			} else {
				this.autolist[this.autolist.length - 1].class = '';
				this.selindex = 0;
			}
			this.autolist[this.selindex].class = 'lihover';
		},
		arrowKeyUp(e) {
			if(this.hasSelected() === false) {
				return;
			}
			e.preventDefault();

			this.$refs.sfield.blur();

			if(this.selindex > 0) {
				this.autolist[this.selindex].class = '';
				this.selindex--;
			} else {
				this.autolist[0].class = '';
				this.selindex = this.autolist.length - 1;
			}
			this.autolist[this.selindex].class = 'lihover';
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
		}
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
	top:20px;
  left: 300px;
  z-index: 1;
  width: 50%;
  width: calc(100% - 500px);
	min-width: 200px;
	z-index: 1;
	position:absolute;
}


/* condition for screen size minimum of 500px */
@media (max-width:700px) {
  .searchBar {
	  left: 20px;
	  top: 60px;
		width: calc(100% - 35px);
	}
}
@media (max-width:350px) {
  .searchBar {
	  top: 90px;
	}
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
	padding: 1px;
	margin: 1px;
	cursor: pointer;
	cursor: hand;
	border-bottom: 1px solid #ccc;
}
li:last-child {
	border-bottom: 0px;
}
.lihover {
	background: lightgrey;
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
background-color: #66615B;
}
.loading {
	background: #ffffff url("/static/img/spinner.gif") no-repeat right 5px center;
}
.formBorder {
  border-left: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
  border-top: 1px solid #ddd;
}
.formBorder:focus {
  border-left: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
  border-top: 1px solid #ddd;
}
</style>
