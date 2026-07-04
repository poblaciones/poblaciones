// Stub de js-cookie.
const store = {};
export default {
	get(key) { return store[key]; },
	set(key, value) { store[key] = value; },
	remove(key) { delete store[key]; },
};
