var express = require('express');
var cors = require('cors');
var path = require('path');
var app = express();

app.use(cors());

var fixtures = {
	simple: require('../fixtures/simple.js'),
	group: require('../fixtures/group.js')
};

function filter ( data, query ) {
	var filtered = [];
	if ( !query ) {
		return filtered;
	}
	query = new RegExp(query, 'i');
	data.forEach(function ( el, index, arr ) {
		if ( query.test(el.value) ) {
			filtered.push(el);
		}
	});
	return filtered;
}

function filterGroup ( data, query ) {
	var filtered = [];
	data.forEach(function ( el, index, arr ) {
		var filteredSimple = filter(el.items, query);
		if ( filteredSimple.length ) {
			filtered.push({
				group: el.group,
				items: filteredSimple
			});
		}
	});
	return filtered;
}

app.get('/search', function ( req, res ) {
	res.json(filter(fixtures.simple, req.query.value));
});

app.get('/searchGroup', function ( req, res ) {
	res.json(filterGroup(fixtures.group, req.query.value));
});

app.listen(3000);
