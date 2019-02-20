import $ from 'jquery';
import Ctor from './lib/constructor';
import meta from './lib/meta';
import isPublicMethodFactory from './lib/is-public-method';

const isPublicMethod = isPublicMethodFactory(meta.publicMethods);

/**
 * @param  {Object|String} options
 *
 * @return {jQuery}
 */
const plugin = $.fn[meta.name] = function ( options ) {

	options = options || {};

	return this.each(function () {

		var instance = $.data(this, meta.name);

		if ( isPublicMethod(options) && instance ) {
			instance[options]();
		} else if ( typeof (options) === 'object' && !instance ) {
			$.data(this, meta.name, new Ctor(this, options));
		}

	});

};
plugin.defaults = Ctor.prototype.defaults;

export default plugin;
