import $ from 'jquery';
import meta from './meta';

let instance = 0;

export default {
	setup: function () {
		this.uid = instance++;
		this.ens = `${meta.ns.event}.${this.uid}`;
	},
	destroy: function () {
		$.removeData(this.element, meta.name);
	}
};
