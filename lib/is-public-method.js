import $ from 'jquery';

/**
 * @param  {Array} methods
 *
 * @return {Function}
 */
function isPublicMethod ( methods ) {

	/**
	 * @param  {String} name
	 *
	 * @return {Boolean}
	 */
	return function ( name ) {
		return typeof (name) === 'string' && $.inArray(name, methods || []) !== -1;
	};

}

export default isPublicMethod;
