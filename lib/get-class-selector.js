/**
 * @param  {String} className
 *
 * @return {String}
 */
function getClassSelector ( className ) {
	return `.${className.split(' ').join('.')}`;
}

export default getClassSelector;
