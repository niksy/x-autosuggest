import $ from 'jquery';
import Fn from '../../index';
import './index.css';

var input01 = $('#input-01');
var input02 = $('#input-02');
var input03 = $('#input-03');

$(document)
	.on('autosuggestopen', function () {
		console.info(arguments);
	});

input01
	.on('autosuggestcreate', function ( e, el ) {
		console.log(arguments);
	})
	.on('autosuggestopen', function ( e, el ) {
		console.log(arguments);
	})
	.on('autosuggestclose', function ( e, el ) {
		console.log(arguments);
	})
	.on('autosuggestfocus', function ( e, el ) {
		console.log(arguments);
	})
	.on('autosuggestblur', function ( e, el ) {
		console.log(arguments);
	})
	.on('autosuggestsearch', function ( e, query ) {
		console.log(arguments);
	})
	.on('autosuggestresponse', function ( e, data ) {
		console.log(arguments);
	})
	.on('autosuggestmove', function ( e, item, itemData ) {
		console.log(arguments);
	})
	.on('autosuggestselect', function ( e, item, itemData ) {
		console.log(arguments);
	})
	.on('autosuggestinput', function ( e, item, itemData ) {
		console.log(arguments);
	});

input01.autosuggest({
	source: function ( query ) {
		return $.ajax({
			url: `http://${process.env.SEARCH_ENDPOINT_URL}:3000/search`,
			data: {
				value: query
			}
		});
	},
	open: function ( el ) {
		console.info(arguments);
	},
	close: function ( el ) {
		console.warn(arguments);
	},
	input: function ( val ) {
		console.info(arguments);
	}
});

input02.autosuggest({
	source: function ( query ) {
		return $.ajax({
			url: `http://${process.env.SEARCH_ENDPOINT_URL}:3000/search`,
			data: {
				value: query
			}
		});
	}
});

input03.autosuggest({
	source: function ( query ) {
		return $.ajax({
			url: `http://${process.env.SEARCH_ENDPOINT_URL}:3000/search`,
			data: {
				value: query
			}
		});
	}
});
