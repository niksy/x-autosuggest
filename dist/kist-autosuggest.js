/*! kist-autosuggest 0.1.3 - Simple autosuggest plugin. | Author: Ivan Nikolić, 2014 | License: MIT */
;(function ( $, window, document, undefined ) {

	var plugin = {
		name: 'autosuggest',
		ns: {
			css: 'kist-Autosuggest',
			event: '.kist.autosuggest',
			dom: 'kist-autosuggest'
		},
		error: function ( message ) {
			throw new Error(plugin.name + ': ' + message);
		}
	};
	plugin.classes = {
		wrapper: '',
		results: '-results',
		input: '-input',
		form: '-form',
		list: '-list',
		item: '-item',
		toggler: '-toggler',
		value: '-value',
		match: '-match',
		preloader: '-preloader',
		group: '-group',
		groupTitle: '-group-title',
		isSelected: 'is-selected',
		isOpened: 'is-opened',
		isActive: 'is-active'
	};
	plugin.publicMethods = ['destroy'];

	var dom = {
		common: {
			doc: $(document)
		},
		setup: function () {
			this.dom                 = this.dom || {};
			this.dom.el              = $(this.element);
			this.dom.form            = this.dom.el.closest('form');
			this.dom.form            = this.dom.form.length ? this.dom.form : $();
		},
		setupWrapper: function () {

			this.dom.wrapper = $('<div />', {
				'class': this.options.classes.wrapper
			});
			this.dom.preloader = $('<div />');
			this.dom.preloader
				.addClass(this.options.classes.preloader)
				.removeClass(this.options.classes.isActive);

			this.dom.wrapper
				.insertBefore(this.dom.el)
				.append(this.dom.el, this.dom.preloader);

		},
		setupAfter: function () {

			if (
				!this.options.source.url &&
				this.dom.form.length !== 0
			) {
				this.options.source.url = this.dom.form.attr('action');
			}

			// Create results
			this.dom.results = $('<div />');
			this.dom.results
				.attr({
					'id': plugin.ns.css + plugin.classes.results + '-' + this.instance.id,
					'role': 'listbox',
					'aria-expanded': false
				})
				.addClass(this.options.classes.results)
				.removeClass(this.options.classes.isOpened)
				.appendTo(this.dom.wrapper);

			// Enhance input
			this.dom.el
				.addClass(this.options.classes.input)
				.attr({
					'role': 'combobox',
					'aria-autocomplete': 'list',
					'aria-owns': plugin.ns.css + plugin.classes.results + '-' + this.instance.id,
					'aria-activedescendant': '',
					'autocomplete': 'off',
					'autocorrect': 'off'
				});

			this.dom.form
				.addClass(this.options.classes.form);

		},
		destroy: function () {

			this.dom.el
				.removeClass(this.options.classes.input)
				.removeAttr('role aria-autocomplete aria-owns aria-activedescendant autocomplete autocorrect')
				.insertBefore(this.dom.wrapper);

			this.dom.form
				.removeClass(this.options.classes.form)
				.removeClass(this.options.classes.isOpened);

			this.dom.wrapper.remove();

		}
	};

	var events = {
		setup: function () {

			this.dom.el
				.on('keyup' + this.instance.ens, ('debounce' in $ ? $.debounce(300, $.proxy(inputEventHandler, this, this.getData)) : $.proxy(inputEventHandler, this, this.getData)))
				.on('keydown' + this.instance.ens, $.proxy(keyboardNavigation, this))
				.on('focus' + this.instance.ens, $.proxy(this.showResults, this));

			this.dom.wrapper
				.on('click' + this.instance.ens, '.' + this.options.classes.toggler, $.proxy(pointerSelectItem, this));

			dom.common.doc
				.on('click' + this.instance.ens, $.proxy(globalEventsHandler, this))
				.on('keydown' + this.instance.ens, $.proxy(globalEventsHandler, this));

			if ( this.options.preventSubmit ) {
				this.dom.form
					.on('submit' + this.instance.ens, function ( e ) {
						e.preventDefault();
					});
			}

		},
		destroy: function () {
			dom.common.doc.off(this.instance.ens);
			this.dom.el.off(this.instance.ens);
			this.dom.wrapper.off(this.instance.ens);
			this.dom.form.off(this.instance.ens);
		}
	};

	var instance = {
		id: 0,
		setup: function () {
			this.instance     = this.instance || {};
			this.instance.id  = instance.id++;
			this.instance.ens = plugin.ns.event + '.' + this.instance.id;
		},
		destroy: function () {
			delete $.data(this.element)[plugin.name];
		}
	};

	var key = {
		enter: 13,
		escape: 27,
		up: 38,
		down: 40,
		mouseLeft: 1,
		mouseRight: 3
	};

	var whitelist = [16,17,18,20,37,key.up,39,key.down,91,93];
	var blacklist = [9,key.enter,key.escape].concat(whitelist);

	/**
	 * @this {Autosuggest}
	 *
	 * @param {Object} options
	 */
	function constructOptions ( options ) {

		// Prepare URL
		if ( $.type(this.options.source) === 'string' ) {
			this.options.source = $.extend({}, this.defaults.source, { url: this.options.source });
		}

		// Prepare CSS classes
		this.options.classes = {};
		$.each(plugin.classes, $.proxy(function ( name, value ) {

			var ns        = $.trim(this.options.namespace);
			var pluginNs  = plugin.ns.css;
			var className = pluginNs + value;

			if ( /^is[A-Z]/.test(name) ) {
				className = value;
			} else if ( ns !== pluginNs && ns !== '' ) {
				className = pluginNs + value + ' ' + ns + value;
			}

			this.options.classes[name] = className;

		}, this));

	}

	/**
	 * @this {Autosuggest}
	 *
	 * @param {Object} item
	 *
	 * @return {Object}
	 */
	function normalizeItemData ( item ) {
		if ( this.map.url ) {
			item.url = item[this.map.url];
		}
		return item;
	}

	/**
	 * @param {String} query
	 * @param {String} textValue
	 *
	 * @return {String}
	 */
	function highlightMatch ( query, textValue ) {
		return textValue ? textValue.replace((new RegExp(query, 'i')), '<mark class="' + this.options.classes.match + '">$&</mark>') : '';
	}

	/**
	 * @this {Autosuggest}
	 *
	 * @param {Object} data
	 *
	 * @return {jQuery}
	 */
	function createItem ( data, index ) {

		data = normalizeItemData.call(this.options, data);

		var item;
		var match = highlightMatch.call(this, this.getInputVal(), data[this.options.map.label]);

		if ( !match ) {
			return;
		}

		item = $('<li />', {
			'id': plugin.ns.css + plugin.classes.item + '-' + this.instance.id + '-' + index,
			'class': this.options.classes.item,
			'role': 'option'
		});

		item
			.data(plugin.ns.dom + '-data', data)
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
		setItems.call(this, 'items', item);

		return item;

	}

	/**
	 * @param {String} type
	 * @param {jQuery} items
	 *
	 * @return {jQuery}
	 */
	function setItems ( type, items ) {

		if ( !this.dom[type] || ( this.dom[type] && items.length === 0 ) ) {
			this.dom[type] = $();

			if ( items.length === 0 ) {
				return this.dom[type];
			}
		}

		this.dom[type] = this.dom[type].add(items);
		return this.dom[type];

	}

	/**
	 * @param  {String} type
	 *
	 * @return {jQuery}
	 */
	function getItems ( type ) {
		return this.dom[type] || $();
	}

	/**
	 * @this {Autosuggest}
	 *
	 * @param {Object} e
	 *
	 * @return {}
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
			( keycode == key.escape && elTarget.is(this.dom.el) ) ||
			(
				( keycode >= key.mouseLeft && keycode <= key.mouseRight ) &&
				elTarget.closest(this.dom.results).length === 0 &&
				!elTarget.is(this.dom.el)
			)
		) {
			this.hideResults();
		}

	}

	/**
	 * @this {Autosuggest}
	 *
	 * @param {Function} cb
	 * @param {Object}   event
	 *
	 * @return {}
	 */
	function inputEventHandler ( cb, e ) {

		var keycode = e.which;

		this.setInputVal($(e.target).val(), true);

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
	function keyboardNavigation ( e ) {

		var keycode = e.which;

		switch ( keycode ) {

			// If we are talking about up/down button
			case key.up:
			case key.down:
				// If list is closed when pressing up/down button, open it
				if ( !this.dom.results.hasClass(this.options.classes.isOpened) ) {
					this.showResults();
				}
				this.navigate( keycode === key.down ? 'down' : 'up' );
				break;

			// "Enter" key is pressed on selected item
			case key.enter:
				itemSelected.call(this);
				break;
		}

	}

	/**
	 * @this {Autosuggest}
	 *
	 * @param {Object} e
	 */
	function pointerSelectItem ( e ) {

		var newSelectableItem = $(e.target).closest('.' + this.options.classes.item);

		this.setCurrentItem(newSelectableItem);
		this.setInputVal(newSelectableItem.find(this.options.selectors.value).text());

		itemSelected.call(this);

		if ( !this.options.preventSubmit ) {
			this.dom.form.trigger('submit');
		}

	}

	/**
	 * @this {Autosuggest}
	 */
	function itemSelected () {
		this.options.select.call(this.element, this.getCurrentItem(), this.getCurrentItem().data(plugin.ns.dom + '-data'));
		this.hideResults();
	}

	/**
	 * @class
	 *
	 * @param {Element} element
	 * @param {Object} options
	 */
	function Autosuggest ( element, options ) {

		this.element = element;
		this.options = $.extend(true, {}, this.defaults, options);

		constructOptions.call(this, options);

		instance.setup.call(this);
		dom.setup.call(this);
		dom.setupWrapper.call(this);
		dom.setupAfter.call(this);
		events.setup.call(this);

	}

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
			if ( getItems.call(this, 'selectableItems').length === 0 ) {
				return;
			}

			this.dom.results
				.attr('aria-expanded', true)
				.addClass(this.options.classes.isOpened);

			this.dom.form
				.addClass(this.options.classes.isOpened);

		},

		hideResults: function () {
			this.dom.results
				.attr('aria-expanded', false)
				.removeClass(this.options.classes.isOpened);

			this.dom.form
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

			$.each( data, $.proxy(function ( key, group ) {

				groupItem = $('<div />',{ 'class': this.options.classes.group });

				groupItem
					.append(
						$(this.options.templates.groupTitle.call(this.element, group)),
						this.createList(group[this.options.map.groupItems])
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
			this.createItems( data );

			// Append list items to list
			list.append(getItems.call(this, 'items'));

			// Populate selectable items object with new elements
			setItems.call(this, 'selectableItems', getItems.call(this, 'items'));

			// Empty list items
			setItems.call(this, 'items', $());

			// Return newly created list
			return list;

		},

		/**
		 * @param {Array} data
		 */
		createItems: function ( data ) {

			$.each( data, $.proxy( function ( index, item ) {

				if ( index == this.options.maxItems ) {
					return false;
				}

				// Pass element to list item creator
				createItem.call(this, item, index);

			}, this ) );

		},

		/**
		 * @param {String} direction
		 */
		navigate: function ( direction ) {

			var newSelectableItem = this.getCurrentItem();
			var selectableItems = getItems.call(this, 'selectableItems');

			// Exit if there are no selectable items (e.g. no data has been filtered)
			if ( selectableItems.length === 0 ) {
				return;
			}

			newSelectableItem = newSelectableItem.length ? newSelectableItem : selectableItems.filter('.' + this.options.classes.isSelected);

			// If we’ve already interacted with the list items…
			if ( newSelectableItem.length !== 0 ) {

				newSelectableItem = selectableItems.eq(direction == 'down' ? ++this.position: --this.position);

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

			this.setCurrentItem(newSelectableItem);
			this.setInputVal(newSelectableItem.find(this.options.selectors.value).text());

		},

		/**
		 * @this {Autosuggest}
		 *
		 * @param {jQuery} item
		 *
		 * @return {jQuery}
		 */
		setCurrentItem: function ( item ) {

			this.dom.currentItem = item;

			if ( item.length !== 0 ) {
				if ( this.dom.prevItem ) {
					this.dom.prevItem.removeClass(this.options.classes.isSelected);
				}
				this.dom.currentItem.addClass(this.options.classes.isSelected);
				this.dom.el.attr('aria-activedescendant', this.dom.currentItem.attr('id'));
			}

			this.dom.prevItem = this.dom.currentItem;

			return this.dom.currentItem;

		},

		/**
		 * @this {Autosuggest}
		 *
		 * @return {jQuery}
		 */
		getCurrentItem: function () {
			return this.dom.currentItem || $();
		},

		/**
		 * @param {String} value
		 * @param {Boolean} preventDomUpdate
		 */
		setInputVal: function ( value, preventDomUpdate ) {
			this.val = value;
			if ( !preventDomUpdate ) {
				this.dom.el.val(value);
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

			var jsonData = {};

			// If we can get data array from the cached results object,
			// we don’t need to call the server for new data,
			// because we can use our cached data array
			if ( this.cacheDataExists(query) ) {
				this.showData(this.getCacheData(query));
				return;
			}

			// Create additional data for sending to server (e.g. custom query key)
			jsonData[this.options.map.query] = query;

			this.dom.preloader.addClass(this.options.classes.isActive);

			$.ajax($.extend(true, {}, this.options.source, { data: jsonData })).done($.proxy(this.showData, this));

		},

		/**
		 * @param {Array} data
		 */
		showData: function ( data ) {

			this.dom.preloader.removeClass(this.options.classes.isActive);

			if ( !data || ( data && !data.length ) ) {
				this.hideResults();
				return;
			}

			this.setCacheData(data);
			this.cleanup();

			this[ this.options.response == 'simple' ? 'createList' : 'createGroup' ]( data )
				.appendTo(this.dom.results);

			this.showResults();

		},

		cleanup: function () {
			this.dom.results.empty();
			this.setCurrentItem($());
			setItems.call(this, 'selectableItems', $());
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
				url: '',
				type: 'get',
				dataType: 'json'
			},
			response: 'simple',
			minLength: 2,
			maxItems: 10,
			preventSubmit: true,
			map: {
				url: '',
				query: 'value',
				label: 'value',
				groupItems: 'items'
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
					return '<h2>' + data.group + ' </h2>';
				}
			},
			select: function () {},
			namespace: plugin.ns.css
		}

	});

	$.kist = $.kist || {};

	$.kist[plugin.name] = {
		defaults: Autosuggest.prototype.defaults
	};

	$.fn[plugin.name] = function ( options ) {

		if ( typeof(options) === 'string' && $.inArray(options, plugin.publicMethods) !== -1 ) {
			return this.each(function () {
				var pluginInstance = $.data(this, plugin.name);
				if ( pluginInstance ) {
					pluginInstance[options]();
				}
			});
		}

		options = typeof(options) === 'object' ? options : {};

		return this.each(function () {
			if (!$.data(this, plugin.name)) {
				$.data(this, plugin.name, new Autosuggest(this, options));
			}
		});
	};

})( jQuery, window, document );
