var $ = require('jquery');
var dom = require('./dom');
var keymap = require('./keymap');
var meta = require('./meta');
var emit = require('kist-toolbox/lib/event-emitter')(meta.name);
var debounce = require('throttle-debounce').debounce;

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
