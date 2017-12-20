// jscs:disable requireCapitalizedComments

var $ = require('jquery');
var meta = require('./meta');
var htmlClasses = require('./html-classes');
var dom = require('./dom');
var events = require('./events');
var instance = require('./instance');
var emit = require('./event-emitter')(meta.name);
var getClassSelector = require('./get-class-selector');

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
 * @param {String} matchClass
 * @param {String} query
 * @param {String} textValue
 *
 * @return {String}
 */
function getMatchHtml ( matchClass, query, textValue ) {
	return textValue ? textValue.replace((new RegExp(query, 'i')), '<mark class="' + matchClass + '">$&</mark>') : '';
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
		return [];
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

		var item = $();
		var match = getMatchHtml(this.options.classes.match, this.getInputVal(), data.value);

		if ( !match ) {
			return item;
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

		newSelectableItem = newSelectableItem.length ? newSelectableItem : selectableItems.filter(getClassSelector(this.options.classes.isSelected));

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
		var sourceResult, showDataCb, hidePreloaderCb;

		emit(this, 'search', [query]);

		// If we can get data array from the cached results object,
		// we don’t need to call the server for new data,
		// because we can use our cached data array
		if ( this.cacheDataExists(query) ) {
			this.showData(this.getCacheData(query));
			return;
		}

		this.showPreloader();

		sourceResult = this.options.source(query);
		showDataCb = $.proxy(this.showData, this);
		hidePreloaderCb = $.proxy(this.hidePreloader, this);

		if (
			'done' in sourceResult &&
			'always' in sourceResult
		) {
			sourceResult
				.done(showDataCb)
				.always(hidePreloaderCb);
		} else {
			sourceResult
				.then(showDataCb, hidePreloaderCb)
				.catch(hidePreloaderCb);
		}

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
		source: function ( query ) {
			return $.Deferred();
		},
		responseType: 'simple',
		minLength: 2,
		maxItems: 10,
		preventSubmit: true,
		debounceInputValue: 300,
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
