/* jshint node:true */

var express = require('express');
var cors = require('cors');
var path = require('path');
var app = express();

app.use(cors());

var data = {
	simple: require('./data/simple.js'),
	group: require('./data/group.js')
};

function filter ( data, query ) {
	if ( !query ) {
		return [];
	}
	query = new RegExp(query, 'i');
	return data.filter(function ( el ) {
		return query.test(el.value);
	});
}

function filterGroup ( data, query ) {
	return data.map(function ( el, index, arr ) {
			var filteredSimple = filter(el.groupItems, query);
			return {
				groupName: el.groupName,
				groupItems: filteredSimple
			};
		}).filter(function ( el ) {
			return el.groupItems.length;
		});

}

app.get('/search', function ( req, res ) {
	res.jsonp(filter(data.simple, req.query.value));
});

app.get('/searchGroup', function ( req, res ) {
	res.jsonp(filterGroup(data.group, req.query.value));
});

app.listen(3000);
