/*! kist-autosuggest 0.2.1 - Simple autosuggest plugin. | Author: Ivan Nikolić <niksy5@gmail.com> (http://ivannikolic.com/), 2015 | License: MIT */
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self);var n=f;n=n.jQuery||(n.jQuery={}),n=n.fn||(n.fn={}),n.autosuggest=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
// jscs:disable requireCapitalizedComments

var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);
var meta = require(8);
var htmlClasses = require(4);
var dom = require(2);
var events = require(3);
var instance = require(6);
var emit = require(11)(meta.name);

/**
 * @param  {Object} item
 * @param  {Object} options
 *
 * @return {Object}
 */
function mapData ( item, options ) {
	return $.extend.apply(null, $.map(options, function ( val, key ) {
		var o = {};
		var res = item[val];
		if ( res ) {
			o[key] = res;
		}
		return o;
	}));
}

/**
 * @param {String} match
 * @param {String} query
 * @param {String} textValue
 *
 * @return {String}
 */
function highlightMatch ( match, query, textValue ) {
	return textValue ? textValue.replace((new RegExp(query, 'i')), '<mark class="' + match + '">$&</mark>') : '';
}

/**
 * @class
 *
 * @param {Element} element
 * @param {Object} options
 */
var Autosuggest = module.exports = function ( element, options ) {

	this.element = element;
	this.options = $.extend(true, {}, this.defaults, options);

	instance.setup.call(this);
	dom.setup.call(this);
	events.setup.call(this);

	// Prepare source URL
	if ( $.type(this.options.source) === 'string' ) {
		this.options.source = $.extend({}, this.defaults.source, {
			url: this.options.source
		});
	}
	if (
		!this.options.source.url &&
		this.$form.length !== 0
	) {
		this.options.source.url = this.$form.attr('action');
	}

};

$.extend(Autosuggest.prototype, {

	/**
	 * @param {Array} data
	 */
	setCacheData: function ( data ) {
		// If our cached results object doesn’t have a key corresponding to
		// input value, store fetched data to new key based on it
		if ( !this.cacheDataExists(this.getInputVal()) ) {
			this.cache[this.getInputVal()] = data;
		}
	},

	/**
	 * @param {String} key
	 *
	 * @return {Array}
	 */
	getCacheData: function ( key ) {
		// If our cached results object has a key corresponding to
		// input value, return stored data
		if ( this.cacheDataExists(key) ) {
			return this.cache[key];
		}
	},

	/**
	 * @param {String} key
	 *
	 * @return {Boolean}
	 */
	cacheDataExists: function ( key ) {
		return this.cache.hasOwnProperty(key);
	},

	showResults: function () {

		// Don’t show list if there are no children elements inside
		if ( this.getItems('selectableItems').length === 0 ) {
			return;
		}

		if ( !this.$results.hasClass(this.options.classes.isOpened) ) {
			emit(this, 'open', [this.$el]);
		}

		this.$results
			.attr('aria-expanded', true)
			.addClass(this.options.classes.isOpened);

		this.$wrapper
			.addClass(this.options.classes.isOpened);

	},

	hideResults: function () {

		if ( this.$results.hasClass(this.options.classes.isOpened) ) {
			emit(this, 'close', [this.$el]);
		}

		this.$results
			.attr('aria-expanded', false)
			.removeClass(this.options.classes.isOpened);

		this.$wrapper
			.removeClass(this.options.classes.isOpened);
	},

	/**
	 * @param {Object} data
	 *
	 * @return {jQuery}
	 */
	createGroup: function ( data ) {

		var groupsItem = $();
		var groupItem;

		$.each(data, $.proxy(function ( key, group ) {

			group = mapData(group, this.options.dataMap);

			groupItem = $('<div />', {
				'class': this.options.classes.group
			});

			groupItem
				.append(
					$(this.options.templates.groupTitle.call(this.element, group)),
					this.createList(group.groupItems)
				)
				.find(this.options.selectors.groupTitle)
				.addClass(this.options.classes.groupTitle );

			groupsItem = groupsItem.add(groupItem);

		}, this));

		return groupsItem;

	},

	/**
	 * @param {Object} data
	 *
	 * @return {jQuery}
	 */
	createList: function ( data ) {

		// Create list
		var list = $('<ul />', {
			'class': this.options.classes.list
		});

		// Create list items
		this.createItems(data);

		// Append list items to list
		list.append(this.getItems('items'));

		// Populate selectable items object with new elements
		this.setItems('selectableItems', this.getItems('items'));

		// Empty list items
		this.setItems('items', $());

		// Return newly created list
		return list;

	},

	/**
	 * @param {Object} data
	 *
	 * @return {jQuery}
	 */
	createItem: function ( data, index ) {
		// jscs:disable disallowQuotedKeysInObjects

		data = mapData(data, this.options.dataMap);

		var item;
		var match = highlightMatch(this.options.classes.match, this.getInputVal(), data.value);

		if ( !match ) {
			return;
		}

		item = $('<li />', {
			'id': htmlClasses.item + '-' + this.uid + '-' + index,
			'class': this.options.classes.item,
			'role': 'option'
		});

		item
			.data(meta.ns.dataAttr + '-data', data)
			.append($(this.options.templates.item.call(this.element, data)))
			.find(this.options.selectors.toggler)
			.addClass(this.options.classes.toggler);

		item
			.find(this.options.selectors.value)
			.addClass(this.options.classes.value)
			.html(match);

		/**
		 * Populate list items reference
		 *
		 * This array will be used as single entry point for list appending
		 * We want to touch the DOM as less is possible
		 */
		this.setItems('items', item);

		return item;

	},

	/**
	 * @param {Array} data
	 */
	createItems: function ( data ) {

		$.each(data, $.proxy(function ( index, item ) {

			if ( index === this.options.maxItems ) {
				return false;
			}

			// Pass element to list item creator
			this.createItem(item, index);

		}, this));

	},

	/**
	 * @param  {String} type
	 *
	 * @return {jQuery}
	 */
	getItems: function ( type ) {
		return this['$' + type] || $();
	},

	/**
	 * @param {String} type
	 * @param {jQuery} items
	 *
	 * @return {jQuery}
	 */
	setItems: function ( type, items ) {

		if ( !this['$' + type] || ( this['$' + type] && items.length === 0 ) ) {
			this['$' + type] = $();

			if ( items.length === 0 ) {
				return this['$' + type];
			}
		}

		this['$' + type] = this['$' + type].add(items);
		return this['$' + type];

	},

	/**
	 * @param {String} direction
	 */
	navigate: function ( direction ) {

		var newSelectableItem = this.getCurrentItem();
		var selectableItems = this.getItems('selectableItems');

		// Exit if there are no selectable items (e.g. no data has been filtered)
		if ( selectableItems.length === 0 ) {
			return;
		}

		newSelectableItem = newSelectableItem.length ? newSelectableItem : selectableItems.filter('.' + this.options.classes.isSelected);

		// If we’ve already interacted with the list items…
		if ( newSelectableItem.length !== 0 ) {

			newSelectableItem = selectableItems.eq(direction == 'down' ? ++this.position : --this.position);

			// If we are at the top, we should go to the bottom, and vice versa :)
			if (
				this.position >= selectableItems.length ||
				this.position < 0
			) {
				if ( this.position >= selectableItems.length ) {
					this.position = 0;
				} else if ( this.position < 0 ) {
					this.position = selectableItems.length - 1;
				}

				newSelectableItem = selectableItems.eq(this.position);

			}

		} else {

			// First time interacting with list? Select starting item according to keyboard event (up = last item; down = first item)
			newSelectableItem = selectableItems[direction == 'down' ? 'first' : 'last']();

		}

		emit(this, 'move', [newSelectableItem, this.getItemData(newSelectableItem)]);

		this.setCurrentItem(newSelectableItem);
		this.setInputVal(newSelectableItem.find(this.options.selectors.value).text());

	},

	/**
	 * @param  {jQuery} item
	 *
	 * @return {Object}
	 */
	getItemData: function ( item ) {
		return item.data(meta.ns.dataAttr + '-data') || {};
	},

	/**
	 * @this {Autosuggest}
	 *
	 * @param {jQuery} item
	 *
	 * @return {jQuery}
	 */
	setCurrentItem: function ( item ) {

		this.$currentItem = item;

		if ( item.length !== 0 ) {
			if ( this.$prevItem ) {
				this.$prevItem.removeClass(this.options.classes.isSelected);
			}
			this.$currentItem.addClass(this.options.classes.isSelected);
			this.$el.attr('aria-activedescendant', this.$currentItem.attr('id'));
		}

		this.$prevItem = this.$currentItem;

		return this.$currentItem;

	},

	/**
	 * @this {Autosuggest}
	 *
	 * @return {jQuery}
	 */
	getCurrentItem: function () {
		return this.$currentItem || $();
	},

	/**
	 * @param {String} value
	 * @param {Boolean} preventDomUpdate
	 */
	setInputVal: function ( value, preventDomUpdate ) {
		this.val = value;
		if ( !preventDomUpdate ) {
			this.$el.val(value);
		}
	},

	/**
	 * @return {String}
	 */
	getInputVal: function () {
		return this.val;
	},

	/**
	 * @param {String} query
	 */
	getData: function ( query ) {

		var data = {};
		var searchQueryProp = this.options.searchQueryProp;

		emit(this, 'search', [query]);

		// If we can get data array from the cached results object,
		// we don’t need to call the server for new data,
		// because we can use our cached data array
		if ( this.cacheDataExists(query) ) {
			this.showData(this.getCacheData(query));
			return;
		}

		// Create additional data for sending to server (e.g. custom query key)
		if ( searchQueryProp ) {
			data[searchQueryProp] = query;
		}

		this.showPreloader();

		$.ajax(
			$.extend(true,
				{},
				this.options.source,
				{
					data: data
				}
			)
		)
		.done($.proxy(this.showData, this))
		.always($.proxy(this.hidePreloader, this));

	},

	/**
	 * @param {Array} data
	 */
	showData: function ( data ) {

		emit(this, 'response', [data]);

		if ( !data || ( data && !data.length ) ) {
			this.hideResults();
			return;
		}

		this.setCacheData(data);
		this.cleanup();

		this[this.options.responseType == 'simple' ? 'createList' : 'createGroup'](data)
			.appendTo(this.$results);

		this.showResults();

	},

	showPreloader: function () {
		this.$preloader.addClass(this.options.classes.isActive);
	},

	hidePreloader: function () {
		this.$preloader.removeClass(this.options.classes.isActive);
	},

	cleanup: function () {
		this.$results.empty();
		this.setCurrentItem($());
		this.setItems('selectableItems', $());
		this.position = 0;
	},

	destroy: function () {
		dom.destroy.call(this);
		events.destroy.call(this);
		instance.destroy.call(this);
	},

	cache: {},
	val: '',
	position: 0,

	defaults: {
		source: {
			url: '/',
			type: 'get',
			dataType: 'json'
		},
		searchQueryProp: 'value',
		responseType: 'simple',
		minLength: 2,
		maxItems: 10,
		preventSubmit: true,
		dataMap: {
			url: '',
			value: 'value',
			groupName: 'groupName',
			groupItems: 'groupItems'
		},
		selectors: {
			toggler: 'button, a',
			value: 'button span, a span',
			groupTitle: 'h2'
		},
		templates: {
			item: function ( data ) {
				var tagStart = 'button type="button"';
				var tagEnd = 'button';
				if ( data.url ) {
					tagStart = 'a href="' + data.url + '"';
					tagEnd = 'a';
				}
				return '<' + tagStart + '><span>' + data.value + '</span></' + tagEnd + '>';
			},
			groupTitle: function ( data ) {
				return '<h2>' + data.groupName + ' </h2>';
			}
		},
		classes: htmlClasses,
		create: $.noop,
		open: $.noop,
		close: $.noop,
		focus: $.noop,
		blur: $.noop,
		search: $.noop,
		response: $.noop,
		move: $.noop,
		select: $.noop
	}

});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
(function (global){
var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);
var meta = require(8);
var htmlClasses = require(4);
var emit = require(11)(meta.name);

module.exports = {
	$doc: $(document),
	setup: function () {
		// jscs:disable disallowQuotedKeysInObjects

		this.$el = $(this.element);
		this.$form = this.$el.closest('form');
		this.$form = this.$form.length ? this.$form : $();

		// Setup wrapper
		this.$wrapper = $('<div />', {
			'class': this.options.classes.wrapper
		});
		this.$preloader = $('<div />');
		this.$preloader
			.addClass(this.options.classes.preloader)
			.removeClass(this.options.classes.isActive);

		this.$wrapper
			.insertBefore(this.$el)
			.append(this.$el, this.$preloader);

		// Create results
		this.$results = $('<div />');
		this.$results
			.attr({
				'id': htmlClasses.results + '-' + this.uid,
				'role': 'listbox',
				'aria-expanded': false
			})
			.addClass(this.options.classes.results)
			.removeClass(this.options.classes.isOpened)
			.appendTo(this.$wrapper);

		// Enhance input
		this.$el
			.addClass(this.options.classes.input)
			.attr({
				'role': 'combobox',
				'aria-autocomplete': 'list',
				'aria-owns': htmlClasses.results + '-' + this.uid,
				'aria-activedescendant': '',
				'autocomplete': 'off',
				'autocorrect': 'off'
			});

		emit(this, 'create', [this.$el]);

	},
	destroy: function () {

		this.$el
			.removeClass(this.options.classes.input)
			.removeAttr('role aria-autocomplete aria-owns aria-activedescendant autocomplete autocorrect')
			.insertBefore(this.$wrapper);

		this.$wrapper.remove();

	}
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],3:[function(require,module,exports){
(function (global){
var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);
var dom = require(2);
var keymap = require(7);
var meta = require(8);
var emit = require(11)(meta.name);
var debounce = require(14).debounce;

var key = keymap.KEY;
var whitelist = keymap.WHITELIST;
var blacklist = keymap.BLACKLIST;

/**
 * @this {Autosuggest}
 */
function onItemSelected () {
	emit(this, 'select', [this.getCurrentItem(), this.getItemData(this.getCurrentItem())]);
	this.hideResults();
}

/**
 * @param  {String} className
 *
 * @return {String}
 */
function getClassSelector ( className ) {
	return '.' + className.split(' ').join('.');
}

/**
 * @this {Autosuggest}
 *
 * @param {Function} cb
 * @param {Object}   event
 */
function inputEventHandler ( cb, e ) {

	var keycode = e.which;
	var val = $(e.target).val();

	emit(this, 'input', [val]);

	this.setInputVal(val, true);

	// If it’s not standard alphanumeric key
	// or length of current string is to small
	if (
		$.inArray(keycode, blacklist) !== -1 ||
		this.getInputVal().length < this.options.minLength

	) {
		// Close if we are using non-whitelisted key
		if ( $.inArray(keycode, whitelist) === -1 ) {
			this.hideResults();
		}
		return;
	}

	cb.call(this, this.getInputVal());

}

/**
 * @this {Autosuggest}
 *
 * @param {Object} e
 */
function globalEventsHandler ( e ) {

	var keycode = e.which;
	var elTarget = $(e.target);

	/**
	 * Hide list when:
	 *   * Escape key is pressed and cursor is inside input element
	 *   * Mouse button isn’t clicked inside results element or input element
	 */
	if (
		( keycode == key.escape && elTarget.is(this.$el) ) ||
		(
			( keycode >= key.mouseLeft && keycode <= key.mouseRight ) &&
			elTarget.closest(this.$results).length === 0 &&
			!elTarget.is(this.$el)
		)
	) {
		this.hideResults();
	}

}

/**
 * @this {Autosuggest}
 *
 * @param {Object} e
 */
function keyboardNavigation ( e ) {

	var keycode = e.which;

	switch ( keycode ) {

		// If we are talking about up/down button
		case key.up:
		case key.down:
			// If list is closed when pressing up/down button, open it
			if ( !this.$results.hasClass(this.options.classes.isOpened) ) {
				this.showResults();
			}
			this.navigate( keycode === key.down ? 'down' : 'up' );
			break;

		// "Enter" key is pressed on selected item
		case key.enter:
			onItemSelected.call(this);
			break;
	}

}

/**
 * @this {Autosuggest}
 *
 * @param {Object} e
 */
function pointerSelectItem ( e ) {

	var newSelectableItem = $(e.target).closest(getClassSelector(this.options.classes.item));

	this.setCurrentItem(newSelectableItem);
	this.setInputVal(newSelectableItem.find(this.options.selectors.value).text());

	onItemSelected.call(this);

	if ( !this.options.preventSubmit ) {
		this.$form.trigger('submit');
	}

}

module.exports = {
	setup: function () {

		this.$el
			.on('keyup' + this.ens, debounce(300, $.proxy(inputEventHandler, this, this.getData)))
			.on('keydown' + this.ens, $.proxy(keyboardNavigation, this))
			.on('focus' + this.ens, $.proxy(this.showResults, this))
			.on('focus' + this.ens, $.proxy(function ( e ) {
				emit(this, 'focus', [this.$el]);
			}, this))
			.on('blur' + this.ens, $.proxy(function ( e ) {
				emit(this, 'blur', [this.$el]);
			}, this));

		this.$wrapper
			.on('click' + this.ens, getClassSelector(this.options.classes.toggler), $.proxy(pointerSelectItem, this));

		dom.$doc
			.on('click' + this.ens, $.proxy(globalEventsHandler, this))
			.on('keydown' + this.ens, $.proxy(globalEventsHandler, this));

		if ( this.options.preventSubmit ) {
			this.$form
				.on('submit' + this.ens, function ( e ) {
					e.preventDefault();
				});
		}

	},
	destroy: function () {
		dom.$doc.off(this.ens);
		this.$el.off(this.ens);
		this.$wrapper.off(this.ens);
		this.$form.off(this.ens);
	}
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],4:[function(require,module,exports){
var meta = require(8);

module.exports = {
	wrapper: meta.ns.htmlClass,
	results: meta.ns.htmlClass + '-results',
	input: meta.ns.htmlClass + '-input',
	list: meta.ns.htmlClass + '-list',
	item: meta.ns.htmlClass + '-item',
	toggler: meta.ns.htmlClass + '-toggler',
	value: meta.ns.htmlClass + '-value',
	match: meta.ns.htmlClass + '-match',
	preloader: meta.ns.htmlClass + '-preloader',
	group: meta.ns.htmlClass + '-group',
	groupTitle: meta.ns.htmlClass + '-groupTitle',
	isSelected: 'is-selected',
	isOpened: 'is-opened',
	isActive: 'is-active'
};

},{}],5:[function(require,module,exports){
(function (global){
var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);
var Ctor = require(1);
var meta = require(8);
var isPublicMethod = require(12)(meta.publicMethods);
var appendClass = require(9)(Ctor.prototype.defaults.classes);
var appendNamespacedClasses = require(10)(Ctor.prototype.defaults.classes, meta.ns.htmlClass);

/**
 * @param  {Object|String} options
 *
 * @return {jQuery}
 */
var plugin = module.exports = function ( options ) {

	options = options || {};

	return this.each(function () {

		var instance = $.data(this, meta.name);

		if ( isPublicMethod(options) && instance ) {
			instance[options]();
		} else if ( typeof(options) === 'object' && !instance ) {
			$.data(this, meta.name, new Ctor(this, options));
		}

	});

};
plugin.defaults = Ctor.prototype.defaults;
plugin.appendClass = appendClass;
plugin.appendNamespacedClasses = appendNamespacedClasses;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],6:[function(require,module,exports){
(function (global){
var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);
var meta = require(8);
var instance = 0;

module.exports = {
	setup: function () {
		this.uid = instance++;
		this.ens = meta.ns.event + '.' + this.uid;
	},
	destroy: function () {
		$.removeData(this.element, meta.name);
	}
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],7:[function(require,module,exports){
var KEY = {
	enter: 13,
	escape: 27,
	up: 38,
	down: 40,
	mouseLeft: 1,
	mouseRight: 3
};
var WHITELIST = [16,17,18,20,37,KEY.up,39,KEY.down,91,93];
var BLACKLIST = [9,KEY.enter,KEY.escape].concat(WHITELIST);

module.exports = {
	KEY: KEY,
	BLACKLIST: BLACKLIST,
	WHITELIST: WHITELIST
};

},{}],8:[function(require,module,exports){
module.exports = {
	name: 'autosuggest',
	ns: {
		htmlClass: 'kist-Autosuggest',
		event: '.kist.autosuggest',
		dataAttr: 'kist-autosuggest'
	},
	publicMethods: ['destroy']
};

},{}],9:[function(require,module,exports){
(function (global){
var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);

/**
 * @param  {Object} classes
 *
 * @return {Function}
 */
module.exports = function ( classes ) {

	/**
	 * @param  {String} prop
	 * @param  {String} className
	 *
	 * @return {String}
	 */
	return function ( prop, className ) {
		return [classes[prop], className].join(' ');
	};
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],10:[function(require,module,exports){
(function (global){
var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);

/**
 * @param  {Object} classes
 * @param  {String} defaultNs
 *
 * @return {Function}
 */
module.exports = function ( classes, defaultNs ) {

	/**
	 * @param  {String} ns
	 *
	 * @return {Object}
	 */
	return function ( ns ) {
		return $.extend.apply(null, $.map(classes, function ( val, key ) {
			var o = {};
			o[key] = $.trim([val, (val.indexOf(defaultNs) !== -1 ? val.replace(defaultNs, ns) : '')].join(' '));
			return o;
		}));
	};
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],11:[function(require,module,exports){
(function (global){
/* jshint maxparams:false */

var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);

/**
 * @param  {String} name
 *
 * @return {Function}
 */
module.exports = function ( name ) {

	/**
	 * @param  {Object}   ctx
	 * @param  {String}   eventName
	 * @param  {Array}    data
	 * @param  {jQuery}   triggerEl
	 */
	return function ( ctx, eventName, data, triggerEl ) {
		var el = (ctx.dom && ctx.dom.el) || ctx.$el || $({});
		if ( ctx.options[eventName] ) {
			ctx.options[eventName].apply((el.length === 1 ? el[0] : el.toArray()), data);
		}
		(triggerEl || el).trigger(((name || '') + eventName).toLowerCase(), data);
	};

};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],12:[function(require,module,exports){
(function (global){
var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);

/**
 * @param  {Array} methods
 *
 * @return {Function}
 */
module.exports = function ( methods ) {

	/**
	 * @param  {String} name
	 *
	 * @return {Boolean}
	 */
	return function ( name ) {
		return typeof(name) === 'string' && $.inArray(name, methods || []) !== -1;
	};

};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],13:[function(require,module,exports){
var throttle = require(15);

/**
 * Debounce execution of a function. Debouncing, unlike throttling,
 * guarantees that a function is only executed a single time, either at the
 * very beginning of a series of calls, or at the very end.
 *
 * @param  {Number}   delay         A zero-or-greater delay in milliseconds. For event callbacks, values around 100 or 250 (or even higher) are most useful.
 * @param  {Boolean}  atBegin       Optional, defaults to false. If atBegin is false or unspecified, callback will only be executed `delay` milliseconds
 *                                  after the last debounced-function call. If atBegin is true, callback will be executed only at the first debounced-function call.
 *                                  (After the throttled-function has not been called for `delay` milliseconds, the internal counter is reset).
 * @param  {Function} callback      A function to be executed after delay milliseconds. The `this` context and all arguments are passed through, as-is,
 *                                  to `callback` when the debounced-function is executed.
 *
 * @return {Function} A new, debounced function.
 */
module.exports = function ( delay, atBegin, callback ) {
	return callback === undefined ? throttle(delay, atBegin, false) : throttle(delay, callback, atBegin !== false);
};

},{}],14:[function(require,module,exports){
module.exports = {
	throttle: require(15),
	debounce: require(13)
};

},{}],15:[function(require,module,exports){
(function (global){
var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);

/**
 * Throttle execution of a function. Especially useful for rate limiting
 * execution of handlers on events like resize and scroll.
 *
 * @param  {Number}    delay          A zero-or-greater delay in milliseconds. For event callbacks, values around 100 or 250 (or even higher) are most useful.
 * @param  {Boolean}   noTrailing     Optional, defaults to false. If noTrailing is true, callback will only execute every `delay` milliseconds while the
 *                                    throttled-function is being called. If noTrailing is false or unspecified, callback will be executed one final time
 *                                    after the last throttled-function call. (After the throttled-function has not been called for `delay` milliseconds,
 *                                    the internal counter is reset)
 * @param  {Function}  callback       A function to be executed after delay milliseconds. The `this` context and all arguments are passed through, as-is,
 *                                    to `callback` when the throttled-function is executed.
 * @param  {Boolean}   debounceMode   If `debounceMode` is true (at begin), schedule `clear` to execute after `delay` ms. If `debounceMode` is false (at end),
 *                                    schedule `callback` to execute after `delay` ms.
 *
 * @return {Function}  A new, throttled, function.
 */
module.exports = function ( delay, noTrailing, callback, debounceMode ) {

	// After wrapper has stopped being called, this timeout ensures that
	// `callback` is executed at the proper times in `throttle` and `end`
	// debounce modes.
	var timeoutID;

	// Keep track of the last time `callback` was executed.
	var lastExec = 0;

	// `noTrailing` defaults to falsy.
	if ( typeof(noTrailing) !== 'boolean' ) {
		debounceMode = callback;
		callback = noTrailing;
		noTrailing = undefined;
	}

	// The `wrapper` function encapsulates all of the throttling / debouncing
	// functionality and when executed will limit the rate at which `callback`
	// is executed.
	function wrapper () {

		var self = this;
		var elapsed = Number(new Date()) - lastExec;
		var args = arguments;

		// Execute `callback` and update the `lastExec` timestamp.
		function exec () {
			lastExec = Number(new Date());
			callback.apply(self, args);
		}

		// If `debounceMode` is true (at begin) this is used to clear the flag
		// to allow future `callback` executions.
		function clear () {
			timeoutID = undefined;
		}

		if ( debounceMode && !timeoutID ) {
			// Since `wrapper` is being called for the first time and
			// `debounceMode` is true (at begin), execute `callback`.
			exec();
		}

		// Clear any existing timeout.
		if ( timeoutID ) {
			clearTimeout(timeoutID);
		}

		if ( debounceMode === undefined && elapsed > delay ) {
			// In throttle mode, if `delay` time has been exceeded, execute
			// `callback`.
			exec();

		} else if ( noTrailing !== true ) {
			// In trailing throttle mode, since `delay` time has not been
			// exceeded, schedule `callback` to execute `delay` ms after most
			// recent execution.
			//
			// If `debounceMode` is true (at begin), schedule `clear` to execute
			// after `delay` ms.
			//
			// If `debounceMode` is false (at end), schedule `callback` to
			// execute after `delay` ms.
			timeoutID = setTimeout(debounceMode ? clear : exec, debounceMode === undefined ? delay - elapsed : delay);
		}

	}

	// Set the guid of `wrapper` function to the same of original callback, so
	// it can be removed in jQuery 1.4+ .unbind or .die by using the original
	// callback as a reference.
	if ( $ && $.guid ) {
		wrapper.guid = callback.guid = callback.guid || $.guid++;
	}

	// Return the wrapper function.
	return wrapper;

};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[5])(5)
});