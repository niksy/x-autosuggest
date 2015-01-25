var $ = require('jquery');
var Ctor = require('./constructor');
var meta = require('./meta');
var isPublicMethod = require('kist-toolbox/lib/is-public-method')(meta.publicMethods);
var appendClass = require('kist-toolbox/lib/append-class')(Ctor.prototype.defaults.classes);
var appendNamespacedClasses = require('kist-toolbox/lib/append-namespaced-classes')(Ctor.prototype.defaults.classes, meta.ns.htmlClass);

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
