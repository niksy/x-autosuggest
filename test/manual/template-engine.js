import $ from 'jquery';
import Mustache from 'mustache';
import Fn from '../../index';
import './index.css';

var template = $('#template').html();

Mustache.parse(template);

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
		value: 'span'
	},
	templates: {
		item: function ( data ) {
			return Mustache.render(template, data);
		}
	}
});
