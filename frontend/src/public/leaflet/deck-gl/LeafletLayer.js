import * as L from 'leaflet';
import { createDeckInstance, updateDeckView } from './deck-utils.js';

export default class LeafletLayer extends L.Layer {
	constructor(props) {
		super();
		this.props = props;
		this._container = undefined;
		this._deck = undefined;
		this._animate = undefined;
		this.disposed = false;
	}

	dispose() {
		this.disposed = true;
	}
	onAdd() {
		const pane = this.getPane();
		if (!pane) return this;

		this._container = L.DomUtil.create('div');
		this._container.className = 'leaflet-layer';
		if (this._getZoomAnimated()) {
			L.DomUtil.addClass(this._container, 'leaflet-zoom-animated');
		}

		pane.appendChild(this._container);
		this._deck = createDeckInstance(this._map, this._container, this._deck, this.props);
		this._update();


		this.on('click', function (event) {
			var elements = document.elementsFromPoint(event.containerPoint.x, event.containerPoint.y);
			this.handleClick(event);
		}, this);


		return this;
	}

	onRemove(_map) {
		if (!this._container || !this._deck) return this;

		L.DomUtil.remove(this._container);
		this._container = undefined;

		this._deck.finalize();
		this._deck = undefined;

		return this;
	}

	getEvents() {
		const events = {
			viewreset: this._reset.bind(this),
			movestart: this._onMoveStart.bind(this),
			moveend: this._onMoveEnd.bind(this),
			zoomstart: this._onZoomStart.bind(this),
			zoom: this._onZoom.bind(this),
			zoomend: this._onZoomEnd.bind(this),
		};

		if (this._getZoomAnimated()) {
			events.zoomanim = this._onAnimZoom.bind(this);
		}

		return events;
	}

	setProps(props) {
		Object.assign(this.props, props);
		if (this._deck) {
			this._deck.setProps(props);
		}
	}

	pickObject(opts) {
		return this._deck ? this._deck.pickObject(opts) : null;
	}

	pickMultipleObjects(opts) {
		return this._deck ? this._deck.pickMultipleObjects(opts) : [];
	}

	pickObjects(opts) {
		return this._deck ? this._deck.pickObjects(opts) : [];
	}

	_getMap() {
		return this._map;
	}

	_getZoomAnimated() {
		return this._zoomAnimated;
	}

	_update() {
		if (!this._container || !this._deck || this._getMap()._animatingZoom) return;

		const size = this._getMap().getSize();
		this._container.style.width = `${size.x}px`;
		this._container.style.height = `${size.y}px`;

		const offset = this._getMap()._getMapPanePos().multiplyBy(-1);
		L.DomUtil.setPosition(this._container, offset);

		updateDeckView(this._deck, this._map);
	}

	_pauseAnimation() {
		if (!this._deck) return;

		if (this._deck.props._animate) {
			this._animate = this._deck.props._animate;
			this._deck.setProps({ _animate: false });
		}
	}

	_unpauseAnimation() {
		if (!this._deck) return;

		if (this._animate) {
			this._deck.setProps({ _animate: this._animate });
			this._animate = undefined;
		}
	}

	_reset() {
		this._updateTransform(this._getMap().getCenter(), this._getMap().getZoom());
		this._update();
	}

	_onMoveStart() {
		this._pauseAnimation();
	}

	_onMoveEnd() {
		this._update();
		this._unpauseAnimation();
	}

	_onZoomStart() {
		this._pauseAnimation();
	}

	_onAnimZoom(event) {
		this._updateTransform(event.center, event.zoom);
	}

	_onZoom() {
		this._updateTransform(this._getMap().getCenter(), this._getMap().getZoom());
	}

	_onZoomEnd() {
		this._unpauseAnimation();
	}

	_updateTransform(center, zoom) {
		if (!this._container) return;

		const scale = this._getMap().getZoomScale(zoom, this._getMap().getZoom());
		const position = L.DomUtil.getPosition(this._container);
		const viewHalf = this._getMap().getSize().multiplyBy(0.5);
		const currentCenterPoint = this._getMap().project(this._getMap().getCenter(), zoom);
		const destCenterPoint = this._getMap().project(center, zoom);
		const centerOffset = destCenterPoint.subtract(currentCenterPoint);
		const topLeftOffset = viewHalf.multiplyBy(-scale).add(position).add(viewHalf).subtract(centerOffset);

		if (L.Browser.any3d) {
			L.DomUtil.setTransform(this._container, topLeftOffset, scale);
		} else {
			L.DomUtil.setPosition(this._container, topLeftOffset);
		}
	}
}
