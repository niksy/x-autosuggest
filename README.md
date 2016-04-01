# kist-autosuggest

Simple autosuggest plugin.

## Installation

```sh
npm  install kist-autosuggest --save

bower install kist-autosuggest --save
```

## API

### `$Element.autosuggest(options)`

Returns: `jQuery`

#### options

Type: `Object|String`

##### Options defined as `Object`

###### source

Type: `String|Object`

URL on which autosuggest will send data.

If defined as string, it should be full URL, and if defined as object, properties are the same as the ones used for standard [`$.ajax`](http://api.jquery.com/jQuery.ajax/#jQuery-ajax-settings) request.

###### searchQueryProp

Type: `String`  
Default: `value`

URL query property name for input value.

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

###### dataMap

Type: `Object`

Custom property mapping for received JSON.

Key is the property name used for e.g. template data, and value of the property is property name which is present in received JSON data.

| Name | Default value | Description |
| --- | --- | --- |
| `url` | `'value'` | URL value. |
| `value` | `'value'` | Label value. |
| `groupName` | `'groupName'` | Group name value. |
| `groupItems` | `'groupItems'` | Group items value. |

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

## Examples

Default structure for autosuggest.

```html
<form action="/search" method="get">
	<input type="search" />
</form>

<input type="search" />
```

Standard set of options.

```js
$('input').autosuggest({
	source: 'example/search/endpoint',
	response: 'simple',
	minLength: 2,
	maxItems: 10,
	preventSubmit: true
});

$('input').autosuggest({
	source: {
		url: 'example/search/endpoint',
		type: 'get',
		dataType: 'json'
	}
	response: 'simple',
	minLength: 2,
	maxItems: 10,
	preventSubmit: true
});
```

Basic template support.

```js
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
var template = $('#template').html();

Mustache.parse(template);

$('input').autosuggest({
	source: 'http://localhost:3000/search',
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
$('input').autosuggest('destroy');
```

## Browser support

Tested in IE8+ and all modern browsers.

## License

MIT © [Ivan Nikolić](http://ivannikolic.com)
