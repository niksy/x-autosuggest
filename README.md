# x-autosuggest

[![Build Status][ci-img]][ci]
[![BrowserStack Status][browserstack-img]][browserstack]

Autosuggest results based on input.

Features:

-   Best accessibility practices baked in
-   Flexible styling

**[Try it now!](https://codesandbox.io/s/basic-example-mppkz)**

## Install

```sh
npm install x-autosuggest --save
```

## Usage

Following example will decorate existing `input` element with autosuggest
functionality.

When user inputs query, autosuggest first checks if query has less than 2
characters. If it does, no results are returned, otherwise it fetches list of
countries and maps names to content (which is country name wrapped in `b` HTML
tag) and value which will be used for `input` element value.

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
contains following properties:

###### content

Type: `string`

Content for option. Can be regular string or HTML string as markup.

###### value

Type: `*`

Value used for `input` element value.

If it’s `null` option element will be considered as placeholder element and
won’t be used as option. Useful if you want to have dividers between your
options, or if you need to group option elements with headings.

###### meta

Type: `*`

Additional (meta) information for option. Useful if you need to provide
additional complex information for option, e.g. `input` element value is defined
with `value` option, but if you need to update additional element (e.g. hidden
input) with ID of option, you can use meta information for that.

##### decorateOption

Type: `Function`  
Default: `(node) => {}`

Decorate autosuggest option. Callback receives one argument which is option
`Element` node. Useful if you want to add additional functionality to option
such as attach event listeners or add HTML classes.

If return value is function, it will be used as cleanup callback for when
autosuggest instance is removed or option is rerendered. You can perform actions
such as custom event handlers removal for option inside this callback.

##### onFocus

Type: `Function`  
Default: `async (currentResults) => []`

Callback to run when input element is focused. You can perform actions such as
creating initial placeholders.

It receives one argument, which is list of current results.

Return value should be the same as for `onQueryInput` hook.

##### decorateInputEvent

Type: `Function`  
Default: `(listener) => {}`

Decorate `input` event of input element. Callback receives one argument which is
default listener for `input` event. useful if you want to add additional
functionality such as debounce or throttle of events.

##### onOptionSelect

Type: `Function`  
Default: `(event, value, meta) => {}`

Callback to run when option is selected. It receives following arguments:

-   Event object of triggered event
-   Value of triggered option
-   Additional (meta) information of triggered option

This callback is useful for performing actions such as triggering form submit.

##### htmlClassNamespace

Type: `string`  
Default: ``

HTML class namespace in addition to default one (`x-Autosuggest`).

Useful if you want to create additional styling/functionality selector hook.

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
const cachedFetch = memoize(async (url) => {
	const response = await fetch(url);
	const json = await response.json();
	return {
		ok: response.ok,
		json: async () => json
	};
});

// And then in autosuggest instance options…
const options = {
	onQueryInput(query) {
		return cachedFetch(`https://restcountries.eu/rest/v2/name/${query}`);
		// …
	}
};
```

### How to display current results on input focus?

You can use `onFocus` hook and return current results.

```js
// In autosuggest instance options…
const options = {
	async onFocus(results) {
		return results;
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
[browserstack-img]: https://www.browserstack.com/automate/badge.svg?badge_key=a1hxa0RHc2w4UmFrWUZJZXpxSkRhaXc3NG9ramtiUDhmekpqT0QyWGxnQT0tLWV6Vm9PMHdGY1M1M2R4dTBrdTlXZnc9PQ==--4cb914e99c3c484fa816805f81f6e7d3151fbebb

<!-- prettier-ignore-end -->
