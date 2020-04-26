// http://eslint.org/docs/user-guide/configuring

module.exports = {
	root: true,
	parserOptions: {
		sourceType: 'module',
		parser: 'babel-eslint'
	},
	env: {
		browser: true,
	},
	// https://github.com/feross/standard/blob/master/RULES.md#javascript-standard-style
	extends: [
		'plugin:vue/recommended'
	],
	// required to lint *.vue files
	plugins: [
		'vue', 'html'
	],
	// add your custom rules here
	'rules': {
		'vue/html-closing-bracket-newline': 0,
		'vue/multiline-html-element-content-newline': 0,
		'vue/attribute-hyphenation': 0,
		// allow paren-less arrow functions
		'arrow-parens': 0,
		// allow async-await
		'generator-star-spacing': 0,
		// allow debugger during development
		'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
		// allow trailing commas in arrays, etc. Enable rule for compatibility with ie8
		'comma-dangle': 0,
		'no-tabs': 0,
		'no-unused-vars': 0,
		'no-constant-condition': ['warn'],
		'no-unreachable': ['warn'],
		'babel/new-cap': 0,
		'new-cap': 0,
		'indent': 0,
		'vue/html-indent': 0,
		'semi-spacing': ['warn'],
		'space-before-function-paren': 0,
		'keyword-spacing': 0,
		'key-spacing': ['warn'],
		'comma-spacing': 0,
		'vue/require-prop-type-constructor': 0,
		'vue/require-prop-types': 0,
		'vue/order-in-components': 0,
		'vue/v-on-style': 0,
		'vue/html-quotes': 0,
		'vue/html-self-closing': 0,
		'vue/attributes-order': 0,
		'vue/html-closing-bracket-spacing': 0,
		'vue/singleline-html-element-content-newline': 0,
		'vue/component-name-in-template-casing': 0,
		'vue/max-attributes-per-line': 0,
		'vue/name-property-casing': 0,
		'space-before-blocks': ['warn'],
		'no-multiple-empty-lines': 0, // 'warn',
		'padded-blocks': 0, // 'warn',
		'no-trailing-spaces': 'warn',
		'spaced-comment': 0, // ['warn', 'always', { 'line': { 'markers': ['TODO:', 'REVISAR:'], 'exceptions': ['-', '+'], }, }],
		'semi': ['error', 'always'],
	}
	,
	// Other configs...
	"globals": {
		"$": true,
		"jQuery": true
	}
};
