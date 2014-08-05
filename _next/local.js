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
		wrapper: plugin.ns.css,
		results: plugin.ns.css + '-results',
		input: plugin.ns.css + '-input',
		form: plugin.ns.css + '-form',
		list: plugin.ns.css + '-list',
		item: plugin.ns.css + '-item',
		toggler: plugin.ns.css + '-toggler',
		value: plugin.ns.css + '-value',
		searchMatch: plugin.ns.css + '-searchMatch',
		preloader: plugin.ns.css + '-preloader',
		group: plugin.ns.css + '-group',
		groupTitle: plugin.ns.css + '-group-title',
		isHidden: 'is-hidden',
		isSelected: 'is-selected',
		isActive: 'is-active',
		isOpened: 'is-opened'
	};
	plugin.publicMethods = ['destroy'];

	var dom = {
		common: {
			document: $(document)
		},
		setup: function () {
			this.dom                 = this.dom || {};
			this.dom.el              = $(this.element);
			this.dom.form            = this.dom.el.closest('form');
			this.dom.items           = $();
			this.dom.selectableItems = $();
		},
		setupWrapper: function () {

			this.dom.wrapper = $('<div />', {
				'class': plugin.classes.wrapper
			});
			this.dom.preloader = $('<div />',{
				'class': plugin.classes.preloader
			});

			this.dom.wrapper
				.insertBefore(this.dom.el)
				.append( this.dom.el, this.dom.preloader );

		},
		setupAfter: function () {

			if (
				Boolean(this.options.source.url) === false &&
				this.dom.form.length !== 0
			) {
				this.options.source.url = this.dom.form.attr('action');
			}

			// Create results
			this.dom.results = $('<div />');
			this.dom.results
				.addClass(plugin.classes.results)
				.addClass(plugin.classes.isHidden)
				.appendTo(this.dom.wrapper);

			// Normalize input
			this.dom.el
				.addClass(plugin.classes.input)
				.attr({
					'autocomplete': 'off',
					'autocorrect': 'off'
				});

			this.dom.form
				.addClass(plugin.classes.form);

		},
		destroy: function () {
			this.dom.el.removeClass(plugin.classes.input);
			this.dom.form.removeClass(plugin.classes.form);

			this.dom.el.insertBefore(this.dom.wrapper);
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
				.on('click' + this.instance.ens, '.' + plugin.classes.toggler, $.proxy(pointerSelectitem, this));

			dom.common.document
				.on('click' + this.instance.ens, $.proxy(globalEventsHandler, this))
				.on('keydown' + this.instance.ens, $.proxy(globalEventsHandler, this));

			if ( !this.options.submitOnSelect ) {
				this.dom.form
					.on('submit' + this.instance.ens, function ( event ) {
						event.preventDefault();
					});
			}

		},
		destroy: function () {
			dom.common.document.off(this.instance.ens);
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

	var keyboardBlacklist = [9,13,16,17,18,27,37,38,39,40];

	/**
	 * @this {Autosuggest}
	 *
	 * @param  {String|Object} options
	 *
	 * @return {Object}
	 */
	function normalizeOptions ( options ) {

		options = options || {};

		switch ( $.type(options.source) ) {
			case 'array':
				options.local = true;
				break;
			case 'string':
				options.source = $.extend({}, this.defaults.source, { url: options.source });
				break;
		}

		return options;

	}

	/**
	 * @this {Autosuggest}
	 *
	 * @param  {Object} item
	 *
	 * @return {Object}
	 */
	function normalizeItemData ( item ) {
		if ( this.link ) {
			item.url = item[this.link];
		}
		return item;
	}

	/**
	 * @param  {String} query
	 * @param  {String} textValue
	 *
	 * @return {String}
	 */
	function highlightSearchMatch ( query, textValue ) {
		return textValue.replace((new RegExp(query, 'i')), '<mark class="' + plugin.classes.searchMatch + '">$&</mark>');
	}

	/**
	 * @this {Autosuggest}
	 *
	 * @param  {Object} item
	 *
	 * @return {jQuery}
	 */
	function createItem ( item ) {

		var itemEl;

		itemEl = $('<li />', {
			'class': plugin.classes.item
		});

		itemEl
			.append( $( this.options.templates.item.call(null, normalizeItemData.call(this.options, item)) ) )
			.find(this.options.selectors.toggler)
			.addClass(plugin.classes.toggler);

		itemEl
			.find(this.options.selectors.value)
			.addClass(plugin.classes.value)
			.html(highlightSearchMatch.call(this, this.getInputVal(), item[ this.options.map[ Boolean(item[this.options.map.label]) === true ? 'label' : 'query' ] ] ));

		/**
		 * Populate list items reference
		 *
		 * This array will be used as single entry point for list appending
		 * We want to touch the DOM as less is possible
		 */
		this.dom.items = this.dom.items.add(itemEl);

		return itemEl;

	}

	/**
	 * @this {Autosuggest}
	 *
	 * @param  {jQuery} item
	 *
	 * @return {}
	 */
	function updateSelectedItemState ( item ) {

		this.dom.selectedItem = item;

		if ( this.dom.prevSelectedItem ) {
			this.dom.prevSelectedItem.removeClass(plugin.classes.isSelected);
		}
		this.dom.selectedItem.addClass(plugin.classes.isSelected);

		this.dom.prevSelectedItem = this.dom.selectedItem;

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
			( keycode == 27 && elTarget.is(this.dom.el) ) ||
			( ( keycode >= 1 && keycode <= 3 ) && elTarget.closest(this.dom.results).length === 0 && !elTarget.is(this.dom.el) )
		) {
			this.hideResults();
		}

	}

	/**
	 * @this {Autosuggest}
	 *
	 * @param  {Function} cb
	 * @param  {Object}   event
	 *
	 * @return {}
	 */
	function inputEventHandler ( cb, e ) {

		var keycode = e.which;

		this.setInputVal($(e.target).val());

		// If it’s not standard alphanumeric key
		// or length of current string is to small
		if (
			$.inArray( keycode, keyboardBlacklist ) !== -1 ||
			this.getInputVal().length < this.options.minLength

		) {
			// Close if we are not using direction keys
			if ( $.inArray( keycode, [37,38,39,40] ) === -1 ) {
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

		switch ( e.which ) {

			// If we are talking about up/down button
			case 38:
			case 40:
				// If list is closed when pressing up/down button, open it
				if ( this.dom.results.hasClass(plugin.classes.isHidden) ){
					this.showResults();
				}

				this.navigate( e.which === 40 ? 'down' : 'up' );
				break;

			// "Enter" key is pressed on selected item
			case 13:
				this.options.select();
				break;
		}

	}

	/**
	 * @this {Autosuggest}
	 *
	 * @param {Object} e
	 */
	function pointerSelectitem ( e ) {

		var newSelectableItem = $(e.target).closest('.' + plugin.classes.item);

		updateSelectedItemState.call(this, newSelectableItem);
		this.setInputVal(newSelectableItem.find(this.options.selectors.value).text());

		this.hideResults();

		this.options.select();

		if ( this.options.submitOnSelect ) {
			this.dom.form.trigger('submit');
		}

	}

	/**
	 * @class
	 *
	 * @param {Element} element
	 * @param {String|Object} options
	 */
	function Autosuggest ( element, options ) {

		this.element = element;
		this.options = $.extend(true, {}, this.defaults, normalizeOptions.call(this, options));

		instance.setup.call(this);
		dom.setup.call(this);
		dom.setupWrapper.call(this);
		events.setup.call(this);
		dom.setupAfter.call(this);

	}

	$.extend(Autosuggest.prototype, {

		cache: {},
		inputVal: '',
		selectedPosition: 0,

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
		 * @param  {String} key
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
		 * @param  {String} key
		 *
		 * @return {Boolean}
		 */
		cacheDataExists: function ( key ) {
			return this.cache.hasOwnProperty(key);
		},

		showResults: function () {

			// Don’t show list if there are no children elements inside
			if (
				this.dom.selectableItems &&
				this.dom.selectableItems.length === 0
			) {
				return;
			}

			this.dom.results.removeClass(plugin.classes.isHidden);
			this.dom.form.addClass(plugin.classes.isOpened);

		},

		hideResults: function () {
			this.dom.results.addClass(plugin.classes.isHidden);
			this.dom.form.removeClass(plugin.classes.isOpened);
		},

		/**
		 * @param  {Object} data
		 *
		 * @return {jQuery}
		 */
		createGroup: function ( data ) {

			var groupsEl = $();
			var groupEl;

			$.each( data, $.proxy(function ( key, group ) {

				groupEl = $('<div />',{ 'class': plugin.classes.group });

				groupEl
					.append(
						$( this.options.templates.groupTitle.call(null, group) ),
						this.createList( group[this.options.map.groupItems] )
					)
					.find(this.options.selectors.groupTitle)
					.addClass(plugin.classes.groupTitle );

				groupsEl = groupsEl.add(groupEl);

			}, this));

			return groupsEl;

		},

		/**
		 * @param  {Object} data
		 *
		 * @return {jQuery}
		 */
		createList: function ( data ) {

			// Create list
			var list = $('<ul />', {
				'class': plugin.classes.list
			});

			// Create list items
			this.createItems( data );

			// Append list items to list
			list.append(this.dom.items);

			// Populate selectable items object with new elements
			this.dom.selectableItems = this.dom.selectableItems.add(this.dom.items);

			// Empty list items
			this.dom.items = $();

			// Return newly created list
			return list;

		},

		/**
		 * @param  {Array} data
		 */
		createItems: function ( data ) {

			$.each( data, $.proxy( function ( index, item ) {

				if ( index == this.options.maxItems ) {
					return false;
				}

				// Pass element to list item creator
				createItem.call(this, item );

			}, this ) );

		},

		/**
		 * @param {String} direction
		 */
		navigate: function ( direction ) {

			var newSelectableItem;
			var selectableitems = this.dom.selectableItems;

			// Exit if there are no selectable items (e.g. no data has been filtered)
			if ( selectableitems.length === 0 ) {
				return;
			}

			newSelectableItem = this.dom.selectedItem || selectableitems.filter('.' + plugin.classes.isSelected);

			// If we’ve already interacted with the list items…
			if ( newSelectableItem.length !== 0 ){

				newSelectableItem = selectableitems.eq(direction == 'down' ? ++this.selectedPosition: --this.selectedPosition);

				// If we are at the top, we should go to the bottom, and vice versa :)
				if (
					this.selectedPosition >= selectableitems.length ||
					this.selectedPosition < 0
				){
					if ( this.selectedPosition >= selectableitems.length ) {
						this.selectedPosition = 0;
					} else if ( this.selectedPosition < 0 ) {
						this.selectedPosition = selectableitems.length - 1;
					}

					newSelectableItem = selectableitems.eq(this.selectedPosition);

				}

			} else {

				// First time interacting with list? Select starting item according to keyboard event (up = last item; down = first item)
				newSelectableItem = selectableitems[direction == 'down' ? 'first' : 'last']();

			}

			updateSelectedItemState.call(this, newSelectableItem);
			this.setInputVal(newSelectableItem.find(this.options.selectors.value).text());

		},

		/**
		 * @param  {String} value
		 */
		setInputVal: function ( value ) {
			this.inputVal = value;
			this.dom.el.val( value );
		},

		/**
		 * @return {String}
		 */
		getInputVal: function () {
			return this.inputVal;
		},

		/**
		 * @param {String} query
		 */
		getData: function ( query ) {

			var jsonData = {};

			// If we can get data array from the cached results object,
			// we don’t need to call the server for new data,
			// because we can use our cached data array
			if ( this.cacheDataExists( query ) ){
				this.showData( this.getCacheData( query ) );
				return;
			}

			// Create additional data for sending to server (e.g. custom query key)
			jsonData[this.options.map.query] = query;

			this.dom.preloader
				.addClass(plugin.classes.isActive);

			if ( this.options.local ) {
				this.showData( this.options.source );
			} else {
				$.ajax($.extend(true, {}, this.options.source, { data: jsonData })).done($.proxy(this.showData, this));
			}

		},

		/**
		 * @param {Array} data
		 */
		showData: function ( data ) {

			this.dom.preloader.removeClass(plugin.classes.isActive);

			// Exit if no data found
			if ( !data ) {
				return;
			}

			this.setCacheData( data );
			this.cleanup();

			this[ this.options.response == 'simple' ? 'createList' : 'createGroup' ]( data )
				.appendTo( this.dom.results );

			this.showResults();

		},

		cleanup: function () {
			this.dom.results.empty();
			this.dom.selectableItems  = $();
			this.dom.selectedItem     = null;
			this.dom.prevSelectedItem = null;
			this.selectedPosition     = 0;
		},

		destroy: function () {
			dom.destroy.call(this);
			events.destroy.call(this);
			instance.destroy.call(this);
		},

		defaults: {
			source: {
				url: '',
				type: 'get',
				dataType: 'json'
			},
			local: false,
			response: 'simple',
			minLength: 2,
			maxItems: 10,
			submitOnSelect: false,
			link: null,
			map: {
				query: 'value',
				label: 'value',
				groupItems: 'items'
			},
			selectors: {
				toggler: '> button, > a',
				value: '> button > span, > a > span',
				groupTitle: '> h2'
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
			select: function () {}
		}

	});

	$.kist = $.kist || {};
	$.kist[plugin.name] = {
		defaults: Autosuggest.prototype.defaults,
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

		return this.each(function () {
			if (!$.data(this, plugin.name)) {
				$.data(this, plugin.name, new Autosuggest( this, options ));
			}
		});
	};

})( jQuery, window, document );
