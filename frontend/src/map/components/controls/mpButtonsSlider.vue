<template>
	<div :class="{ dragging: isDragging, dropped: !isDragging, 'with-style': !noStyle, 'with-animation': !noAnimation }"
			 class="drag-drop-snap"
			 @touchstart.stop="hang"
			 @touchend.stop="drop"
			 @mousedown.stop="hang"
			 @mouseup.stop="drop"
			 @touchmove.stop="iosMove">
		<slot></slot>
	</div>
</template>

<script>
	export default {
		name: 'drag-drop-snap',
		props: {
			width: {
				type: Number,
				default: 0
			},
			height: {
				type: Number,
				default: 0
			},
			parentSelector: {
				type: String,
				default: ''
			},
			parentWidth: {
				type: Number,
				default: 0
			},
			parentHeight: {
				type: Number,
				default: 0
			},
			startingPosition: {
				type: String,
				default: null
			},
			autoSnap: {
				type: Boolean,
				default: true
			},
			snapOptions: {
				type: Object,
				default() {
					return {
						'top-left': {
							left: 10,
							top: 10
						},
						'top-right': {
							right: 10,
							top: 10
						},
						'bottom-left': {
							left: 10,
							bottom: 10
						},
						'bottom-right': {
							right: 10,
							bottom: 10
						}
					};
				}
			},
			noStyle: {
				type: Boolean,
				default: false
			},
			noAnimation: {
				type: Boolean,
				default: false
			},
		},
		data: () => ({
			shiftY: null,
			shiftX: null,
			left: 0,
			top: 0,
			elem: null,
			isIos: false,
			parent: {
				width: 0,
				height: 0
			},
			parentElem: null,
			isDragging: false,
			onLeft: false,
			onTop: false,
			currentPosition: '',
			events: []
		}),
		watch: {
			width(newWidth, oldWidth) {
				if (newWidth < oldWidth) return;
				if (this.left === 0) return;

				this.calculateParent();

				if (newWidth > this.parent.width - this.left) {
					const newLeft = this.parent.width - newWidth;
					this.left = newLeft < 0 ? 0 : newLeft;
					this.elem.style.left = `${this.left}px`;
				}
			},

			height(newHeight, oldHeight) {
				if (newHeight < oldHeight) return;
				if (this.top === 0) return;

				this.calculateParent();

				if (newHeight > this.parent.height - this.top) {
					const newTop = this.parent.height - this.height;
					this.top = newTop;
					this.elem.style.top = `${this.top}px`;
				}
			}
		},
		destroyed() {
			window.removeEventListener('resize', this.update);
		},
		mounted() {
			this.isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
			this.elem = this.$el;

			this.parentElem = (this.parentSelector && document.body.querySelector(this.parentSelector)) || this.elem.parentNode;

			this.calculateArea();

			if (this.startingPosition) {
				this.currentPosition = this.startingPosition;
				this.update();
			}


			window.addEventListener('resize', this.update);
		},
		beforeDestroy() {
			this.parentElem.removeEventListener('dragover', this.allowDrop); // Eliminar el evento
		},
		methods: {
			allowDrop(e) {
				e.preventDefault(); // Prevenir el comportamiento predeterminado
			},

			iosMove(e) {
				if (this.isIos) this.elementMove(e);
			},

			elementMove(e) {
				if (this.events.slice(-1)[0] !== 'dragging') {
					this.$emit('dragging');
					this.events.push('dragging');
				}

				e.preventDefault();
				if (!e.pageX)
					document.body.style.overflow = 'hidden';

				const x = e.pageX || e.changedTouches[0].pageX;
				const y = e.pageY || e.changedTouches[0].pageY;
				let newLeft = x - this.shiftX;
				// let newTop = y - this.shiftY; // Comentar o eliminar esta línea
				const newRight = x - this.shiftX + this.elem.offsetWidth;
				// const newBottom = y - this.shiftY + this.elem.offsetHeight; // Comentar o eliminar esta línea

				if (newLeft < 0)
					newLeft = 0;
				else if (newRight > this.parent.width)
					newLeft = this.parent.width - this.elem.offsetWidth;
				else
					newLeft = x - this.shiftX;

				// if (newTop < 0) // Comentar o eliminar este bloque
				//   newTop = 0;
				// else if (newBottom > this.parent.height)
				//   newTop = this.parent.height - this.elem.offsetHeight;
				// else
				//   newTop = y - this.shiftY;

				this.elem.style.left = `${newLeft}px`;
				this.left = newLeft;
				// this.elem.style.top = `${newTop}px`; // Comentar o eliminar esta línea
				// this.top = newTop; // Comentar o eliminar esta línea
			},

			hang(e) {
				this.events = [];
				this.events.push('activated');
				this.$emit('activated');

				this.isDragging = true;
				this.calculateParent();

				this.shiftX = e.pageX
					? e.pageX - this.elem.offsetLeft
					: e.changedTouches[0].pageX - this.elem.offsetLeft;
				this.shiftY = e.pageY
					? e.pageY - this.elem.offsetTop
					: e.changedTouches[0].pageY - this.elem.offsetTop;

				if (e.pageX) {
					if (this.isIos) {
						this.parentElem.addEventListener('touchmove', this.elementMove);
					} else {
						this.parentElem.addEventListener('mousemove', this.elementMove);
//						this.parentElem.addEventListener('mouseleave', this.drop);
					}
				} else {
					this.parentElem.addEventListener('touchmove', this.elementMove);
				}
			},

			drop() {
				this.$emit('dropped');

				this.isDragging = false;
				document.body.style.overflow = null;
				this.parentElem.removeEventListener('mousemove', this.elementMove, false);
				this.parentElem.removeEventListener('touchmove', this.elementMove, false);
				this.parentElem.onmouseup = null;
				this.parentElem.ontouchend = null;

				if (this.autoSnap) {
					this.calculateArea();

					// Top - Left
					if (this.onLeft && this.onTop)
						if (this.getSnapOption('top-left')) this.autoSnapMoveTL();
						else if (this.getSnapOption('top-right')) this.autoSnapMoveTR();
						else if (this.getSnapOption('bottom-left')) this.autoSnapMoveBL();
						else this.autoSnapMoveTL();

					// Top - Right
					else if (!this.onLeft && this.onTop)
						if (this.getSnapOption('top-right')) this.autoSnapMoveTR();
						else if (this.getSnapOption('top-left')) this.autoSnapMoveTL();
						else if (this.getSnapOption('bottom-right')) this.autoSnapMoveBR();
						else this.autoSnapMoveTL();

					// Bottom - Left
					else if (this.onLeft && !this.onTop)
						if (this.getSnapOption('bottom-left')) this.autoSnapMoveBL();
						else if (this.getSnapOption('bottom-right')) this.autoSnapMoveBR();
						else if (this.getSnapOption('top-left')) this.autoSnapMoveTL();
						else this.autoSnapMoveTL();

					// Bottom - Right
					else if (!this.onLeft && !this.onTop)
						if (this.getSnapOption('bottom-right')) this.autoSnapMoveBR();
						else if (this.getSnapOption('bottom-left')) this.autoSnapMoveBL();
						else if (this.getSnapOption('top-right')) this.autoSnapMoveTR();
						else this.autoSnapMoveTL();
				}
			},

			getSnapOption(option) {
				if (!this.snapOptions[option])
					return false;

				return {
					top: this.snapOptions[option] && this.snapOptions[option].top,
					left: this.snapOptions[option] && this.snapOptions[option].left,
					bottom: this.snapOptions[option] && this.snapOptions[option].bottom,
					right: this.snapOptions[option] && this.snapOptions[option].right
				};
			},

			autoSnapMoveTL() {
				const left = this.getSnapOption('top-left').left || 0;
				const top = this.getSnapOption('top-left').top || 0;

				this.moveLeft(left);
				this.moveTop(top);
			},

			autoSnapMoveTR() {
				const right = this.getSnapOption('top-right').right || 0;
				const top = this.getSnapOption('top-right').top || 0;

				this.moveLeft(this.parent.width - this.elem.offsetWidth - right);
				//				this.moveTop(top)
			},

			autoSnapMoveBL() {
				const left = this.getSnapOption('bottom-left').left || 0;
				const bottom = this.getSnapOption('bottom-left').bottom || 0;

				const r = this.parent.height - this.elem.offsetHeight - bottom;

				this.moveLeft(left);
				//				this.moveTop(r)
			},

			autoSnapMoveBR() {
				const right = this.getSnapOption('bottom-right').right || 0;
				const bottom = this.getSnapOption('bottom-right').bottom || 0;

				const l = this.parent.width - this.elem.offsetWidth - right;
				const r = this.parent.height - this.elem.offsetHeight - bottom;

				this.moveLeft(l);
				//				this.moveTop(r)
			},

			moveLeft(left) {
				this.left = left;
				this.elem.style.left = `${left}px`;
			},

			moveTop(top) {
				this.top = top;
				this.elem.style.top = `${top}px`;
			},

			calculateParent() {
				this.parent.width = this.parentWidth || (this.parentSelector && document.body.querySelector(this.parentSelector) && document.body.querySelector(this.parentSelector).offsetWidth) || this.elem.parentNode.offsetWidth;
				this.parent.height = this.parentHeight || (this.parentSelector && document.body.querySelector(this.parentSelector) && document.body.querySelector(this.parentSelector).offsetHeight) || this.elem.parentNode.offsetHeight;
			},

			calculateArea() {
				this.onLeft = this.left + this.elem.offsetWidth / 2 < this.parent.width / 2;
				this.onTop = this.top + this.elem.offsetHeight / 2 < this.parent.height / 2;

				if (this.onLeft && this.onTop)
					this.currentPosition = 'TL';
				else if (!this.onLeft && this.onTop)
					this.currentPosition = 'TR';
				else if (this.onLeft && !this.onTop)
					this.currentPosition = 'BL';
				else if (!this.onLeft && !this.onTop)
					this.currentPosition = 'BR';
			},

			changePosition(position) {
				const positions = ['TL', 'TR', 'BL', 'BR'];
				this.currentPosition = positions.includes(position) ? position : 'TL';
				this.update();
			},

			update() {
				this.calculateParent();
				if (this.currentPosition)
					this['autoSnapMove' + this.currentPosition]();
			}
		}
	};
</script>

<style scoped>
	.drag-drop-snap {
		position: absolute;
		top: 0;
		right: 0;
		z-index: 9;
		cursor: move;
	}

		.drag-drop-snap.with-style {
			width: 8em;
			height: 4.5em;
			background: #ccc;
			border-radius: 2em;
			display: flex;
			justify-content: center;
			align-items: center;
			box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
		}

		.drag-drop-snap.active {
			visibility: visible;
		}

		.drag-drop-snap.dropped.with-animation {
			transition: left 500ms, top 500ms;
			transition-timing-function: cubic-bezier(0.35, 1.16, 0.63, 1.17), cubic-bezier(0.35, 1.16, 0.63, 1.17);
		}
</style>
