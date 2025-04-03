import * as L from 'leaflet';
import { Deck } from '@deck.gl/core';

/**
 * Obtiene el estado de la vista basado en el mapa de Leaflet.
 * @param {L.Map} map - El mapa de Leaflet.
 * @returns {Object} - Propiedades del estado de vista.
 */
function getViewState(map) {
	return {
		longitude: map.getCenter().lng,
		latitude: map.getCenter().lat,
		zoom: map.getZoom() - 1,
		pitch: 0,
		bearing: 0
	};
}

/**
 * Crea una instancia de Deck.gl dentro de un contenedor en Leaflet.
 * @param {L.Map} map - El mapa de Leaflet.
 * @param {HTMLElement} container - Contenedor HTML para Deck.gl.
 * @param {Deck} deck - Instancia existente de Deck.gl (opcional).
 * @param {Object} props - Propiedades para la capa de Deck.gl.
 * @returns {Deck} - Nueva instancia de Deck.gl.
 */
export function createDeckInstance(map, container, deck, props) {
	if (!deck) {
		const viewState = getViewState(map);
		deck = new Deck({
			...props,
			parent: container,
			controller: false,
			style: { zIndex: 'auto' },
			viewState
		});
	}
	return deck;
}

/**
 * Actualiza la vista de Deck.gl en base al estado del mapa de Leaflet.
 * @param {Deck} deck - Instancia de Deck.gl.
 * @param {L.Map} map - Mapa de Leaflet.
 */
export function updateDeckView(deck, map) {
	const viewState = getViewState(map);
	deck.setProps({ viewState });
	deck.redraw(false);
}
