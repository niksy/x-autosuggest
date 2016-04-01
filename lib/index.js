var $ = require('jquery');
var Ctor = require('./constructor');
var meta = require('./meta');
var isPublicMethod = require('./is-public-method')(meta.publicMethods);

/**
 * @param  {Object|String} options
 *
 * @return {jQuery}
 */
var plugin = $.fn[meta.name] = module.exports = function ( options ) {

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
