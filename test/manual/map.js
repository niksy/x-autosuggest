import $ from 'jquery';
import Fn from '../../index';
import './index.css';

$('input').autosuggest({
	source: function ( query ) {

		var dfd = $.Deferred();

		$.ajax({
			url: `http://${process.env.SEARCH_ENDPOINT_URL}:3000/search`,
			data: {
				value: query
			}
		})
			.done(function ( results ) {
				dfd.resolve($.map(results, function ( result ) {
					return {
						url: result.id,
						value: result.value
					};
				}))
			});

		return dfd;

	}
});
