// Stub de @/common/framework/color (parseo hex simple).
export default {
	ParseColorParts(hex) {
		const h = String(hex).replace('#', '');
		return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
	},
	MakeColor(r, g, b) {
		const c = (n) => ('0' + Math.round(n).toString(16)).slice(-2);
		return '#' + c(r) + c(g) + c(b);
	},
};
