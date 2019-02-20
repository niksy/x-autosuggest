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
	classes: {
		wrapper: $.fn.autosuggest.defaults.classes.wrapper + ' Foobar',
		input: $.fn.autosuggest.defaults.classes.input + ' Foobar-input'
	}
});
