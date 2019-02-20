# kist-autosuggest

Simple autosuggest plugin.

## Install

```sh
npm install kist-autosuggest --save
```

## Usage

Default structure for autosuggest.

```html
<form action="/search" method="get">
	<input type="search" />
</form>

<input type="search" />
```

Standard set of options.

```js
import 'kist-autosuggest';

$('input').autosuggest({
	source: function ( query ) {
		return $.ajax({
			url: 'example/search/endpoint',
			data: {
				term: query
			}
		});
	},
	responseType: 'simple',
	minLength: 2,
	maxItems: 10,
	preventSubmit: true
});

$('input').autosuggest({
	source: function ( query ) {
		return $.ajax({
			url: 'example/search/endpoint',
			type: 'get',
			dataType: 'json',
			data: {
				term: query
			}
		});
	}
	responseType: 'simple',
	minLength: 2,
	maxItems: 10,
	preventSubmit: true
});
```

Basic template support.

```js
import 'kist-autosuggest';

$('input').autosuggest({
	selectors: {
		toggler: 'i',
		value: 'u'
	},
	templates: {
		item: function ( data ) {
			return '<strong><i>Item:</i> <u>' + data.value + '</u></strong>';
		}
	}
});
```

Template engine support.

```html
<script id="template" type="x-tmpl-mustache">
	<i><span style="color:green">{{value}}</span></i>
</script>
```

```js
import 'kist-autosuggest';
import Mustache from 'mustache';

var template = $('#template').html();

Mustache.parse(template);

$('input').autosuggest({
	source: function ( query ) {
		return $.ajax({
			url: 'http://localhost:3000/search',
			data: {
				term: query
			}
		});
	},
	selectors: {
		toggler: 'i',
		value: 'span'
	},
	templates: {
		item: function ( data ) {
			return Mustache.render(template, data);
		}
	}
});
```

Callback on item select.

```js
import 'kist-autosuggest';

$('input').autosuggest({
	select: function ( item, data ) {
		$(this).addClass('inputClass')
		item.addClass('itemClass');
		console.log(data);
	}
});
```

Destroy plugin instance.

```js
import 'kist-autosuggest';

$('input').autosuggest('destroy');
```

More usage examples.

## API

### `$Element.autosuggest(options)`

Returns: `jQuery`

#### options

Type: `Object|String`

##### Options defined as `Object`

###### source

Type: `Function`  
Arguments: [Input value]  
Returns: `Promise|jQuery.Deferred`

Fetch suggestions data.

Each suggestion in array of suggestions should be `Object` with properties:

| Name | Description |
| --- | --- |
| `url` | URL value. |
| `value` | Label value. |
| `groupName` | Group name value (if grouping is requested). |
| `groupItems` | Group items value (if grouping is requested). |

###### responseType

Type: `String`  
Default: `simple`

Response type.

| Name | Description |
| --- | --- |
| `simple` | Simple JSON. |
| `group` | Grouped JSON. |

###### minLength

Type: `Integer`  
Default: `2`

Minimum input value length before the request will be activated.

###### maxItems

Type: `Integer`  
Default: `10`

Maximum number of items to show.

###### preventSubmit

Type: `Boolean`  
Default: `true`

Prevent submit on item select.

###### debounceInputValue

Type: `Integer`  
Default: `300`

Input debounce value in milliseconds.

###### classes

Type: `Object`  

Classes for elements.

Default value:

```js
{
	wrapper: 'kist-Autosuggest',
	results: 'kist-Autosuggest-results',
	input: 'kist-Autosuggest-input',
	list: 'kist-Autosuggest-list',
	item: 'kist-Autosuggest-item',
	toggler: 'kist-Autosuggest-toggler',
	value: 'kist-Autosuggest-value',
	match: 'kist-Autosuggest-match',
	preloader: 'kist-Autosuggest-preloader',
	group: 'kist-Autosuggest-group',
	groupTitle: 'kist-Autosuggest-groupTitle',
	isSelected: 'is-selected',
	isOpened: 'is-opened',
	isActive: 'is-active'
}
```

###### selectors

Type: `Object`

Selectors for autosuggest items.

| Name | Default value | Description |
| --- | --- | --- |
| `toggler` | `button, a` | Selector for toggler element. |
| `value` | `button span, a span`| Selector for element containing value. |
| `groupTitle` | `h2``| Selector for group title. |

###### templates

Type: `Object`

Template generating functions for custom markup.

Available values are:

| Name | Arguments | Description |
| --- | --- | --- |
| `item` | `data` | Template for list item. |
| `groupTitle` | `data` | Template for group title. |

###### create

Type: `Function`  
Arguments: [Input element]  
Event: `autosuggestcreate`

Callback to run on autosuggest creation (when DOM elements are ready).

###### open

Type: `Function`  
Arguments: [Input element]  
Event: `autosuggestopen`

Callback to run when results list is opened.

###### close

Type: `Function`  
Arguments: [Input element]  
Event: `autosuggestclose`

Callback to run when results list is closed.

###### focus

Type: `Function`  
Arguments: [Input element]  
Event: `autosuggestfocus`

Callback to run when input element is focused.

###### blur

Type: `Function`  
Arguments: [Input element]  
Event: `autosuggestblur`

Callback to run when input element is blurred.

###### search

Type: `Function`  
Arguments: [Search query]  
Event: `autosuggestsearch`

Callback to run when search is performed, before actual request is sent.

###### response

Type: `Function`  
Arguments: [Response data]  
Event: `autosuggestresponse`

Callback to run after search is performed, after receiving data.

###### move

Type: `Function`  
Arguments: [Current item], [Current item data]  
Event: `autosuggestmove`

Callback to run when item is navigated to via keyboard navigation.

###### select

Type: `Function`  
Arguments: [Current item], [Current item data]  
Event: `autosuggestselect`

Callback to run on item select.

###### input

Type: `Function`  
Arguments: [Current input value]  
Event: `autosuggestinput`

Callback to run on entering input value.

##### Options defined as `String`

Type: `String`

###### destroy

Destroy plugin instance.

## Browser support

Tested in IE9+ and all modern browsers.

## Test

For manual tests, run `npm run test:manual` and open <http://localhost:9000/> in your browser.

## License

MIT © [Ivan Nikolić](http://ivannikolic.com)
