var $ = require('jquery');
var meta = require('./meta');
var instance = 0;

module.exports = {
	setup: function () {
		this.uid = instance++;
		this.ens = meta.ns.event + '.' + this.uid;
	},
	destroy: function () {
		$.removeData(this.element, meta.name);
	}
};
