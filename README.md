# kist-autosuggest

Simple autosuggest plugin.

## Installation

```sh
bower install niksy/kist-autosuggest
```

## API

### `Element.autosuggest(options)`

Returns: `jQuery`

#### options

Type: `Object|String`

##### Options defined as `Object`

###### source

Type: `String|Object`

URL on which autosuggest will send data.

If defined as string, it should be full URL, and if defined as object, properties are the same as the ones used for standard [`$.ajax`](http://api.jquery.com/jQuery.ajax/#jQuery-ajax-settings) request.

###### response

Type: `String`  
Default: `simple`

Response type.

Available values are:

* **simple** - Simple JSON.
* **group** - Grouped JSON.

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

###### namespace

Type: `String`  
Default: `kist-Autosuggest`

Default HTML class namespace.

###### select

Type: `Function`  
Arguments: [Current item], [Current item data]

Callback to run on item select.

###### create

Type: `Function`  
Arguments: 

Callback to run on autosuggest creation (when DOM elements are ready).

###### map

Type: `Object`

Custom property mapping for received JSON.

Available values are:

* **url** (default: ` `) - Map URL value.
* **query** (default: `value`) - Map query value.
* **label** (default: `value`) - Map label value.
* **groupItems** (default: `items`) - Map group items.

###### selectors

Type: `Object`

Selectors for autosuggest items.

Available values are:

* **toggler** (default: `button, a`) - Selector for toggler element.
* **value** (default: `button span, a span`) - Selector for element containing value.
* **groupTitle** (default: `h2`) - Selector for group title.

###### templates

Type: `Object`

Template generating functions for custom markup

Available values are:

* **item** (arguments: `data`) - Template for list item.
* **groupTitle** (arguments: `data`) - Template for group title.

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
	preventSubmit: true,
	namespace: 'exampleNamespace'
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
	preventSubmit: true,
	namespace: 'exampleNamespace'
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
