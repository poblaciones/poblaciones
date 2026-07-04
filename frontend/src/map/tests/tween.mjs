// Stub de @tweenjs/tween.js para animatedNumber.vue bajo tests.
export const Tween = function () {
	this.to = function () { return this; };
	this.easing = function () { return this; };
	this.onUpdate = function () { return this; };
	this.onComplete = function () { return this; };
	this.start = function () { return this; };
};
export function update() { return false; }
export default { Tween, update };
