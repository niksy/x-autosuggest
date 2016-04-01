var $ = require('jquery');
var meta = require('./meta');
var htmlClasses = require('./html-classes');
var emit = require('./event-emitter')(meta.name);

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
