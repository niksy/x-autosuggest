// Remote data
$('input').autosuggest({
	source: '/search'
});

// Namespace change
$('input').autosuggest({
	source: 'http://localhost:3000/search',
	namespace: 'Foobar'
});

// Minimum value length
$('input').autosuggest({
	source: 'http://localhost:3000/search',
	minLength: 5
});

// Max number of items
$('input').autosuggest({
	source: 'http://localhost:3000/search',
	maxItems: 2
});

// Custom mapping
$('input').autosuggest({
	source: 'http://localhost:3000/search',
	map: {
		query: 'value',
		label: 'value'
	}
});

// Remote data, source as object
$('input').autosuggest({
	source: {
		url: 'http://localhost:3000/search',
		data: {
			foo: 1
		}
	}
});

// On item select
$('input').autosuggest({
	source: 'http://localhost:3000/search',
	select: function ( item, data ) {
		console.log(item);
		console.log(data);
	}
});

// Prevent submit
$('input').autosuggest({
	source: 'http://localhost:3000/search',
	preventSubmit: false
});

// Group
$('input').autosuggest({
	source: '/searchGroup',
	response: 'group'
});

// Basic template
$('input').autosuggest({
	source: 'http://localhost:3000/search',
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

// Custom template engine
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
