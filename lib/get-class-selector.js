/**
 * @param  {String} className
 *
 * @return {String}
 */
module.exports = function ( className ) {
	return '.' + className.split(' ').join('.');
};
