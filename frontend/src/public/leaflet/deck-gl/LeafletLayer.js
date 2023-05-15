import * as L from 'leaflet';
import { createDeckInstance, updateDeckView } from './deck-utils';

/** @typedef {import('@deck.gl/core').Deck} Deck */
/** @typedef {import('@deck.gl/core/lib/deck').DeckProps} DeckProps */

export default class LeafletLayer extends L.Layer {
	/** @type {HTMLElement | undefined} */
	_container = undefined;

	/** @type {Deck | undefined} */
	_deck = undefined;

	/** @type {boolean | undefined} */
	_animate = undefined;

	LeafletLayer(props) {
		this.props = props;

	}
	/**
	 * @param {DeckProps} props
	 */
	constructor(props) {
		super();
		this.disposed = false;
		this.props = props;
	}


	dispose() {
			this.disposed = true;
	}

	/**
	 * @returns {this}
	 */
	onAdd() {
		this._container = L.DomUtil.create('div');
		this._container.className = 'leaflet-layer';
		if (this._zoomAnimated) {
			L.DomUtil.addClass(this._container, 'leaflet-zoom-animated2');
		}
		L.DomUtil.addClass(this._container, 'pointer-ready-css');

		this.getPane().appendChild(this._container);
		if (this.props.layers.length > 0) {
			this._deck = createDeckInstance(this._map, this._container, this._deck, this.props);
			this._update();
		}

		this.on('click', function (event) {
			var elements = document.elementsFromPoint(event.containerPoint.x, event.containerPoint.y);
			console.log(elements.length);
			console.log(elements);

			alert(1);
			this.handleClick(event);
		}, this);

		return this;
	}


	/**
	 *  @returns {this}
	 */
	AddLayer(layer) {
		this.props.layers.push(layer);
		if (!this._deck) {
			this._deck = createDeckInstance(this._map, this._container, this._deck, this.props);
		}
		this._update();

		return this;
	}


	/**
	 * @param {L.Map} _map
	 * @returns {this}
	 */
	onRemove(_map) {
		L.DomUtil.remove(this._container);
		this._container = undefined;

		if (this._deck) {
			this._deck.finalize();
			this._deck = undefined;
		}
		return this;
	}

	/**
	 * @returns {Object}
	 */
	getEvents() {
		const events = {
			viewreset: this._reset,
			movestart: this._onMoveStart,
			moveend: this._onMoveEnd,
			zoomstart: this._onZoomStart,
			zoom: this._onZoom,
			zoomend: this._onZoomEnd,
		};
		if (this._zoomAnimated) {
			events.zoomanim = this._onAnimZoom;
		}
		return events;
	}

	/**
	 * @param {DeckProps} props
	 * @returns {void}
	 */
	setProps(props) {
		Object.assign(this.props, props);

		if (this._deck) {
			this._deck.setProps(props);
		}
	}

	/**
	 * @param {any} params
	 * @returns {any}
	 */
	pickObject(params) {
		return this._deck && this._deck.pickObject(params);
	}

	/**
	 * @param {any} params
	 * @returns {any}
	 */
	pickMultipleObjects(params) {
		return this._deck && this._deck.pickMultipleObjects(params);
	}

	/**
	 * @param {any} params
	 * @returns {any}
	 */
	pickObjects(params) {
		return this._deck && this._deck.pickObjects(params);
	}

	/**
	 * @returns {void}
	 */
	_update() {
		if (this._map._animatingZoom) {
			return;
		}

		const size = this._map.getSize();
		this._container.style.width = `${size.x}px`;
		this._container.style.height = `${size.y}px`;

		// invert map position
		const offset = this._map._getMapPanePos().multiplyBy(-1);
		L.DomUtil.setPosition(this._container, offset);
		if (this._deck) {
			updateDeckView(this._deck, this._map);
		}
	}

	/**
	 * @returns {void}
	 */
	_pauseAnimation() {
		if (this._deck) {
			if (this._deck.props._animate) {
				this._animate = this._deck.props._animate;
				this._deck.setProps({ _animate: false });
			}
		}
	}

	/**
	 * @returns {void}
	 */
	_unpauseAnimation() {
		if (this._deck) {
			if (this._animate) {
				this._deck.setProps({ _animate: this._animate });
				this._animate = undefined;
			}
		}
	}

	/**
	 * @returns {void}
	 */
	_reset() {
		this._updateTransform(this._map.getCenter(), this._map.getZoom());
		this._update();
	}

	/**
	 * @returns {void}
	 */
	_onMoveStart() {
		this._pauseAnimation();
	}

	/**
	 * @returns {void}
	 */
	_onMoveEnd() {
		this._update();
		this._unpauseAnimation();
	}

	/**
	 * @returns {void}
	 */
	_onZoomStart() {
		this._pauseAnimation();
	}

	/**
	 * @param {L.ZoomAnimEvent} event
	 * @returns {void}
	 */
	_onAnimZoom(event) {
		this._updateTransform(event.center, event.zoom);
	}

	/**
	 * @returns {void}
	 */
	_onZoom() {
		this._updateTransform(this._map.getCenter(), this._map.getZoom());
	}

	/**
	 * @returns {void}
	 */
	_onZoomEnd() {
		this._unpauseAnimation();
	}

	/**
	 * see https://stackoverflow.com/a/67107000/1823988
	 * see L.Renderer._updateTransform https://github.com/Leaflet/Leaflet/blob/master/src/layer/vector/Renderer.js#L90-L105
	 * @param {L.LatLng} center
	 * @param {number} zoom
	 */
	_updateTransform(center, zoom) {
		const scale = this._map.getZoomScale(zoom, this._map.getZoom());
		const position = L.DomUtil.getPosition(this._container);
		const viewHalf = this._map.getSize().multiplyBy(0.5);
		const currentCenterPoint = this._map.project(this._map.getCenter(), zoom);
		const destCenterPoint = this._map.project(center, zoom);
		const centerOffset = destCenterPoint.subtract(currentCenterPoint);
		const topLeftOffset = viewHalf.multiplyBy(-scale).add(position).add(viewHalf).subtract(centerOffset);

		if (L.Browser.any3d) {
			L.DomUtil.setTransform(this._container, topLeftOffset, scale);
		} else {
			L.DomUtil.setPosition(this._container, topLeftOffset);
		}
	}
}
