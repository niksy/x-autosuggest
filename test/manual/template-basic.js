import $ from 'jquery';
import Fn from '../../index';
import './index.css';

$('input').autosuggest({
	source: function ( query ) {
		return $.ajax({
			url: `http://${process.env.SEARCH_ENDPOINT_URL}:3000/search`,
			data: {
				value: query
			}
		});
	},
	selectors: {
		toggler: 'i',
		value: 'u'
	},
	templates: {
		item: function ( data ) {
			return '<strong><i>Item:</i> <u>' + data.value + '</u></strong>';
		}
	}
});
