const KEY = {
	enter: 13,
	escape: 27,
	up: 38,
	down: 40,
	mouseLeft: 1,
	mouseRight: 3
};
const WHITELIST = [ 16, 17, 18, 20, 37, KEY.up, 39, KEY.down, 91, 93 ];
const BLACKLIST = [ 9, KEY.enter, KEY.escape ].concat(WHITELIST);

export default {
	KEY: KEY,
	BLACKLIST: BLACKLIST,
	WHITELIST: WHITELIST
};
