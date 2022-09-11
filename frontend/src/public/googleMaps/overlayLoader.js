import TxtOverlay from '@/public/googleMaps/TxtOverlay';

export default {
	Create(gMap, location, text, style, zIndex, innerStyle, type, hidden) {
		return new TxtOverlay(gMap, location, text, style, zIndex, innerStyle, type, hidden);
	},

};

