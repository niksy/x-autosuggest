;(function ( $, window, document, undefined ) {

	var pluginName           = 'KistAutocomplete';
	var pluginDomNamespace   = 'kist-autocomplete';
	var pluginClassNamespace = 'KistAutocomplete';
	var pluginEventNamespace = '.kist.autocomplete';

	var keyboardCodesBlacklist = [9,13,16,17,18,37,38,39,40,91];

	var KistAutocomplete = function ( element, options ) {

		this.element     = element;
		this.settings    = $.extend( {}, this.defaults, options );

		this.instanceId  = 'instance' + new Date().getTime();
		this.instanceENS = pluginEventNamespace + '.' + this.instanceId;

	};

	$.extend( KistAutocomplete.prototype, (function () {

		var o = {};

		o.cachedResults = {};
		o.arrListItems = [];
		o.elInputValue = '';

		o.defaults = {
			minimalKeywordLength: 2,
			maxNumberOfItems: 15,
			jsonDataUrl: 'data/data.json',
			jsonDataUrlValueResolver: 'value',
			jsonDataValueProperty: 'value',
			submitOnItemSelect: true,
			showInputHint: false,
			onItemSelect: function(){},
			classes: {
				elInputClass: pluginName + '-input',
				elInputHintClass: pluginName + '-inputHint',
				elFormClass: pluginName + '-form',
				elListClass: pluginName + '-list',
				elWrapperClass: pluginName,
				listItemClass: pluginName + '-listItem',
				listItemLinkClass: pluginName + '-listItem-link',
				highlightedSearchMatchClass: pluginName + '-highlightedSearchMatch',
				preloaderElClass: pluginName + '-preloader',
				isHiddenClass: 'is-hidden',
				isSelectedClass: 'is-selected',
				isActiveClass: 'is-active'
			}
		};

		o.init = function () {

			this.getDomRefs();
			this.createList();
			this.createWrapper();

			this.bindUiActions();

		};

		o.getDomRefs = function () {

			this.domRefs            = {};
			this.domRefs.elDocument = $(document);
			this.domRefs.elInput    = $(this.element).addClass(this.settings.classes.elInputClass);
			this.domRefs.elForm     = $(this.element).closest('form').addClass(this.settings.classes.elFormClass);

			if( this.settings.showInputHint ){
				this.domRefs.elInputHint = this.domRefs.elInput.clone().addClass(this.settings.classes.elInputHintClass);
			}

		};

		o.bindUiActions = function () {

			this.domRefs.elInput
				.on('keyup' + this.instanceENS, ('debounce' in $ ? $.debounce(300, $.proxy(this.getResults, this)) : $.proxy(this.getResults, this)))
				.on('keyup' + this.instanceENS, $.proxy(this.onEmptyInput, this))
				.on('keydown' + this.instanceENS, $.proxy(this.focusListOnKeyboardEvent, this))
				.on('focus' + this.instanceENS, $.proxy(this.showList, this));

			this.domRefs.elList
				.on('click' + this.instanceENS, '.' + this.settings.classes.listItemLinkClass, $.proxy(this.pointerSelectListItem, this));

			this.domRefs.elDocument
				.on('click' + this.instanceENS, $.proxy(this.globalEventsHandler, this))
				.on('keydown' + this.instanceENS, $.proxy(this.globalEventsHandler, this));

			this.domRefs.elForm
				.on('submit' + this.instanceENS, $.proxy(this.keyboardSelectListItem, this));

		};

		/**
		 * Set cached data results
		 *
		 * @param {Array} pData
		 */
		o.setCacheResults = function ( pData ) {

			// If our cached results object doesn’t have a key corresponding to
			// input value, store fetched data to new key based on it
			if( !this.cachedResultsExist( this.elInputValue ) ){
				this.cachedResults[this.elInputValue] = pData;
			}

		};

		/**
		 * Get cached data results
		 *
		 * @param  {String} pKey
		 *
		 * @return {Array}
		 */
		o.getCacheResults = function ( pKey ) {

			// If our cached results object has a key corresponding to
			// input value, return stored data
			if( this.cachedResultsExist( pKey ) ){
				return this.cachedResults[ pKey ];
			}

		};

		/**
		 * Get cached results existence based on object key
		 *
		 * @param  {String} pKey
		 *
		 * @return {Boolean}
		 */
		o.cachedResultsExist = function ( pKey ) {

			return this.cachedResults.hasOwnProperty( pKey );

		};

		/**
		 * Document events handler
		 *
		 * @param  {Event} pEvent
		 */
		o.globalEventsHandler = function( pEvent ) {

			var keycode = pEvent.which;
			var elTarget = $(pEvent.target);

			/**
			 * Hide list when:
			 *   * Escape key is pressed and cursor is inside input element
			 *   * Mouse button isn’t clicked inside wrapper element
			 */
			if(
				( keycode == 27 && elTarget.is( this.domRefs.elInput ) ) ||
				( ( keycode >= 1 && keycode <= 3 ) && elTarget.closest( this.domRefs.elWrapper ).length === 0 )
			){
				this.hideList();
			}

		};

		/**
		 * Create wrapper for items list, input element and hint input element
		 */
		o.createWrapper = function () {

			var elCollection = this.domRefs.elInput;

			this.domRefs.preloaderEl = $('<div />',{
				'class': this.settings.classes.preloaderElClass
			});
			this.domRefs.elWrapper = $('<div />',{
				'class': this.settings.classes.elWrapperClass
			});

			if( this.settings.showInputHint ){
				elCollection = elCollection.add( this.domRefs.elInputHint );
			}

			elCollection = elCollection.add( this.domRefs.elList );
			elCollection = elCollection.add( this.domRefs.preloaderEl );

			elCollection.wrapAll( this.domRefs.elWrapper );

			// Recache wrapper element
			this.domRefs.elWrapper = $('.' + this.settings.classes.elWrapperClass);

		};

		/**
		 * Create items list
		 */
		o.createList = function () {

			this.domRefs.elList = $('<ul />');
			this.domRefs.elList
				.addClass(this.settings.classes.elListClass)
				.addClass(this.settings.classes.isHiddenClass)
				.insertAfter( this.domRefs.elInput );

		};

		/**
		 * Update items list
		 *
		 *   * Empty current DOM state and populate it with new items
		 *   * Populate list with new items
		 *     We do this here so we don’t touch the DOM when we don’t need to
		 *   * Empty array of items so it’s clean for new set of items
		 */
		o.updateList = function () {

			this.domRefs.elList.empty();
			this.domRefs.elList.append( this.getArrListItems() );

		};

		/**
		 * Show items list
		 */
		o.showList = function () {

			// Don’t show list if there are no children elements inside
			if( this.domRefs.elList.is(':empty') ){
				return;
			}
			this.domRefs.elList.removeClass(this.settings.classes.isHiddenClass);

		};

		/**
		 * Hide items list
		 */
		o.hideList = function () {

			this.domRefs.elList.addClass(this.settings.classes.isHiddenClass);

		};

		/**
		 * Hide items list if input element is empty
		 *
		 * @param {Event} pEvent
		 *
		 */
		o.onEmptyInput = function ( pEvent ) {

			// If input element is empty, hide list
			if( $(pEvent.target).val() === '' ){
				this.hideList();
				this.updateHintInputValue('');
			}

		};

		/**
		 * Highlight search match
		 *
		 * @param  {String} pTextValue
		 *
		 * @return {String}
		 */
		o.highlightSearchMatch = function ( pTextValue ) {

			// Case-insensitive matching for current input value
			var regex = new RegExp(this.elInputValue, 'i');

			// Wrap matched text with HTML element and use matched value as inner content
			return pTextValue.replace(regex, '<mark class="' + this.settings.classes.highlightedSearchMatchClass + '">$&</mark>');

		};

		/**
		 * Create list items using provided data
		 *
		 * After creation, update list items array
		 *
		 * @param  {Object} pItem
		 *
		 * @return {jQuery Object}
		 */
		o.createListItem = function( pItem ) {

			var elListItem;
			var elListValue;

			elListItem = $('<li />', {
				'class': this.settings.classes.listItemClass
			});
			elListValue = $('<button />', {
				'type': 'button',
				'class': this.settings.classes.listItemLinkClass
			});

			elListValue.html( this.highlightSearchMatch( pItem[this.settings.jsonDataValueProperty] ) );

			elListItem.append( elListValue );

			// Populate list items array
			this.populateArrListItems( elListItem );

		};

		/**
		 * Iterate over provided data and create list items
		 *
		 * @param  {Array} pData
		 */
		o.createListItems = function( pData ) {

			$.each( pData, $.proxy( function( index, value ){

				if ( index == this.settings.maxNumberOfItems ) {
					return false;
				}

				// Pass element to list item creator
				this.createListItem( value );

			}, this ) );

		};

		/**
		 * Populate list items array
		 *
		 * This array will be used as single entry point for list appending
		 * We want to touch the DOM as less is possible
		 *
		 * @param  {jQuery object} pListItem
		 */
		o.populateArrListItems = function( pListItem ) {

			this.arrListItems.push( pListItem );

		};

		/**
		 * Get list items array
		 *
		 * @return {array}
		 */
		o.getArrListItems = function () {

			return this.arrListItems;

		};

		/**
		 * Empty list items array
		 *
		 * @return {array} empty array
		 */
		o.emptyArrListItems = function () {

			this.arrListItems = [];

		};

		/**
		 * Focus list items when direction keyboard buttons (up/down) are pressed
		 * It reacts only to up and down buttons
		 *
		 * @param  {Event} pEvent
		 */
		o.focusListOnKeyboardEvent = function( pEvent ) {

			var keycode = pEvent.which;

			// If we are talking about up or down buttons
			if( keycode == 38 || keycode == 40 ){

				if( keycode == 40 ){

					// If list is closed when pressing down button, open it
					if( this.domRefs.elList.hasClass(this.settings.classes.isHiddenClass) ){
						this.showList();
					}

					this.keyboardFocusListItem( 'down' );

				} else {

					this.keyboardFocusListItem( 'up' );

				}

			}

		};

		/**
		 * Select list item with pointer (e.g. mouse)
		 *
		 * @param  {Event} pEvent
		 */
		o.pointerSelectListItem = function( pEvent ){

			this.domRefs.selectedListItem = $(pEvent.target).parent();

			this.updateHintInputValue('');
			this.updateSelectedItemState();
			this.updateInputValue(this.domRefs.selectedListItem.text());

			this.hideList();

			this.settings.onItemSelect();

			if( this.settings.submitOnItemSelect ){
				this.domRefs.elForm.trigger('submit');
			}

		};

		/**
		 * Select list item when pressing "Enter" key
		 * This is coincidentally also form submitting
		 *
		 * @param {Event} pEvent
		 */
		o.keyboardSelectListItem = function ( pEvent ) {

			if( !this.settings.submitOnItemSelect ){
				pEvent.preventDefault();
				this.settings.onItemSelect();
			}

		};

		/**
		 * Select list item with direction keyboard buttons (up/down)
		 *
		 * @param {String} pDirection
		 */
		o.keyboardFocusListItem = function( pDirection ) {

			this.domRefs.selectedListItem = this.domRefs.selectedListItem || this.domRefs.elList.find('.' + this.settings.classes.isSelectedClass);

			// If we’ve already interacted with the list items,
			// we have to create references for previously selected items
			// and move to the next/previous sibling
			if( this.domRefs.selectedListItem.length !== 0  ){

				this.domRefs.previousSelectedListItem = this.domRefs.selectedListItem;
				this.domRefs.selectedListItem = this.domRefs.selectedListItem[ ( pDirection == 'down' ? 'next': 'prev' ) ]();

				// If we are at the top, we should go to the bottom, and vice versa :)
				if( this.domRefs.selectedListItem.length === 0 ){
					this.domRefs.selectedListItem = this.domRefs.elList.children(':' + ( pDirection == 'down' ? 'first' : 'last' ) + '-child');
				}

			} else {

				// First time interacting with list? Select starting item according to keyboard event (up = last item; down = first item)
				this.domRefs.selectedListItem = this.domRefs.elList.children(':' + ( pDirection == 'down' ? 'first' : 'last' ) + '-child');

			}

			this.updateHintInputValue('');
			this.updateSelectedItemState();
			this.updateInputValue(this.domRefs.selectedListItem.text());

		};

		/**
		 * Update selected item state
		 *
		 * Update selected item to act as new one
		 * and remove selected state from the old item
		 */
		o.updateSelectedItemState = function () {

			// We don’t have registered previous selected list item,
			// so we will cache it here for later use
			if( !this.domRefs.previousSelectedListItem ){
				this.domRefs.previousSelectedListItem = this.domRefs.selectedListItem.siblings(this.settings.classes.isSelectedClass);
			}
			this.domRefs.previousSelectedListItem.removeClass(this.settings.classes.isSelectedClass);
			this.domRefs.selectedListItem.addClass(this.settings.classes.isSelectedClass);

			// Recache previous selected item to current selected list item
			// Why? When next time this function is called, that reference will point to current one
			// and for the new selected list item we will set it accordingly depending on interaction
			// (keyboard or mouse) at earlier stage
			this.domRefs.previousSelectedListItem = this.domRefs.selectedListItem;

		};

		/**
		 * Update input element value
		 *
		 * @param  {String} pValue
		 */
		o.updateInputValue = function( pValue ) {

			this.domRefs.elInput.val( pValue );

		};

		/**
		 * Update hint input element value
		 *
		 * @param  {String} pValue
		 */
		o.updateHintInputValue = function( pValue ) {

			if( this.settings.showInputHint ){
				this.domRefs.elInputHint.val( pValue );
			}

		};

		/**
		 * Display hint input element value
		 *
		 * @param  {Array} pData
		 */
		o.displayHintInputValue = function( pData ) {

			// Case-insensitive matching for current input value
			var regexValueExists = new RegExp(this.elInputValue, 'i');
			// Case-insensitive matching for current input value at the beginning of the string
			var regexBeginsWithValue = new RegExp("^" + this.elInputValue, 'i');

			var loopDeferred = $.Deferred();
			var pDataLength = pData.length;
			var value;

			// If input string value is too short, remove hint input value
			// and exit early
			if( this.elInputValue.length <= this.settings.minimalKeywordLength ) {
				this.updateHintInputValue('');
				return;
			}

			$.each( pData, $.proxy( function(){

				value = arguments[1][this.settings.jsonDataValueProperty];

				// Do we have any element with this string?
				if( value.match(regexValueExists) ) {

					// Find first element which matches expression where it begins
					// with specific value and exit after text transformation
					if ( value.match(regexBeginsWithValue) ) {

						loopDeferred.resolve( value );
						return false;
					}


				} else {

					// This is the end, my only friend, the end…
					if( arguments[0] == pDataLength-1 ){
						loopDeferred.reject( value );
					}

				}

				return loopDeferred.promise();

			}, this ) );

			// If value exists…
			loopDeferred.done($.proxy(function( value ){

				// Replace matched text with input value text
				// This is so we can overlay both values regardless of case-sensitivity
				value = value.replace(regexBeginsWithValue,this.elInputValue);

				// Update hidden input value
				this.updateHintInputValue(value);

			}, this));

			// If value doesn’t exist…
			loopDeferred.fail($.proxy(function(){

				// Update hidden input value
				this.updateHintInputValue('');

			},this));

		};

		/**
		 * Fetch results from JSON data
		 *
		 * @param  {Event} pEvent
		 */
		o.getResults = function( pEvent ) {

			var keycode = pEvent.which;
			var jsonAdditionalData = {};
			this.elInputValue = $(pEvent.target).val();

			// If it’s not standard alphanumeric key
			// or length of current string is to small, exit early
			if(
				$.inArray( keycode, keyboardCodesBlacklist ) != -1 ||
				this.elInputValue.length < this.settings.minimalKeywordLength

			){
				// Don’t close if we use up/down keys
				if ( keycode == 38 || keycode == 40 ) {
					return;
				}

				this.hideList();
				return;
			}

			// If we can get data array from the cached results object,
			// we don’t need to call the server for new data,
			// because we can use our cached data array
			if( this.cachedResultsExist( this.elInputValue ) ){
				this.showResults( this.getCacheResults( this.elInputValue ) );
				return;
			}

			// Create additional data for sending to server
			// (e.g. custom term key)
			jsonAdditionalData[this.settings.jsonDataUrlValueResolver] = this.elInputValue;

			this.domRefs.preloaderEl.addClass(this.settings.classes.isActiveClass);

			$.ajax({
				url: this.settings.jsonDataUrl,
				type: 'get',
				dataType: 'json',
				data: $.extend({}, jsonAdditionalData)
			})
			.done($.proxy(this.showResults, this));

		};

		/**
		 * Show filtered JSON data results
		 *
		 * @param {Array} pData
		 */
		o.showResults = function( pData ) {

			this.domRefs.preloaderEl.removeClass(this.settings.classes.isActiveClass);

			// If no data found, exit early
			if ( pData === null ) {
				return;
			}

			this.setCacheResults( pData );
			this.createListItems( pData );
			this.updateList();
			this.emptyArrListItems();
			this.showList();

			if( this.settings.showInputHint ){
				this.displayHintInputValue( pData );
			}

		};

		return o;

	})() );

	$[pluginName]          = {};
	$[pluginName].defaults = KistAutocomplete.prototype.defaults;

	$.fn[pluginName] = function( options ) {
		return this.each(function () {
			if (!$.data(this, pluginName)) {
				$.data(this, pluginName, new KistAutocomplete(this, options).init() );
			}
		});
	};

})( jQuery, window, document );
