# x-autosuggest

[![Build Status][ci-img]][ci]
[![BrowserStack Status][browserstack-img]][browserstack]

Autosuggest results based on input.

Features:

-   Best accessibility practices baked in
-   Flexible styling

**[Try it now!](#demo)**

## Install

```sh
npm install x-autosuggest --save
```

## Usage

Following example will decorate existing `input` element with autosuggest
functionality.

When user inputs query, autosuggest first checks if query has less than 2
characters. If it does, no results are returned, otherwise it fetches list of
countries and maps names to content and value which will be used for input value.

When user chooses option, closest `form` element submit event will be triggered.

```js
import autosuggest from 'x-autosuggest';

const element = document.querySelector('input[type="text"]');

const instance = autosuggest(element, {
	onOptionSelect() {
		element.closest('form').submit();
	},
	async onQueryInput(query) {
		if (query.trim().length < 2) {
			return [];
		}
		const response = await fetch(
			`https://restcountries.eu/rest/v2/name/${query}`
		);
		const countries = await response.json();
		return countries.map(({ name }) => {
			return {
				content: `<b>${name}</b>`,
				value: name
			};
		});
	}
});
```

## API

### autosuggest(element, options)

Returns: `Object`

Decorates `element` with autosuggest functionality.

#### element

Type: `HTMLInputElement`

Input element to decorate.

#### options

Type: `Object`

##### onQueryInput

Type: `Function`  
Default: `async (query) => []`

Callback to run when query changes. You can perform actions such as testing
query, fetching data and mapping results to valid format here.

Return value should either be empty array (when you don’t want to display
results or don’t have results to display) or array of objects, where each object
contains two properties:

###### content

Type: `string`

Content for option. Can be regular string or HTML string as markup.

###### value

Type: `*`

Value used for `input` element value.

If it’s `null` option element will be considered as placeholder element and
won’t be used as option. Useful if you want to have dividers between your
options, or if you need to group option elements with headings.

##### decorateOption

Type: `Function`  
Default: `(node) => {}`

Decorate autosuggest option. Callback receives one argument which is option
`Element` node. Useful if you want to add additional functionality to option
such as attach event listeners or add HTML classes.

If return value is function, it will be used as cleanup callback for when
autosuggest instance is removed or option is rerendered. You can perform actions
such as custom event handlers removal for option inside this callback.

##### decorateInputEvent

Type: `Function`  
Default: `(listener) => {}`

Decorate `input` event of input element. Callback receives one argument which is
default listener for `input` event. useful if you want to add additional
functionality such as debounce or throttle of events.

##### onOptionSelect

Type: `Function`  
Default: `(event, value) => {}`

Callback to run when option is selected. It receives two arguments: event object
of triggered event and value of triggered option.

This callback is useful for performing actions such as triggering form submit.

### instance.destroy()

Destroy instance.

## FAQ

### How do I cache results?

By default, results are not cached, but it can be achieved with techniques such
as memoization.

```js
import autosuggest from 'x-autosuggest';
import memoize from '@f/memoize';

// We cache fetch results based on URL
const cachedFetch = memoize((url) => {
	return fetch(url);
});

// And then in autosuggest instance options…
const options = {
	onQueryInput(query) {
		return cachedFetch(`https://restcountries.eu/rest/v2/name/${query}`);
		// …
	}
};
```

## Browser support

Tested in IE11+ and all modern browsers, assuming `Promise` is available.

## Test

For automated tests, run `npm run test:automated` (append `:watch` for watcher
support).

## License

MIT © [Ivan Nikolić](http://ivannikolic.com)

<!-- prettier-ignore-start -->

[ci]: https://travis-ci.com/niksy/x-autosuggest
[ci-img]: https://travis-ci.com/niksy/x-autosuggest.svg?branch=master
[browserstack]: https://www.browserstack.com/
[browserstack-img]: https://www.browserstack.com/automate/badge.svg?badge_key=<badge_key>

<!-- prettier-ignore-end -->
