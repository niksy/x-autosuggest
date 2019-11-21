import simulant from 'simulant';
import { KEY_DOWN, KEY_UP, KEY_ESCAPE, KEY_RETURN, KEY_A } from 'keycode-js';

function nextFrame() {
	return new Promise((resolve) => {
		requestAnimationFrame(resolve);
	});
}

async function inputCharacter(element) {
	element.focus();
	element.value = 'a';
	simulant.fire(element, 'input', { which: KEY_A });
	await nextFrame();
}

function goDown(element) {
	simulant.fire(element, 'keydown', { which: KEY_DOWN });
}

function goUp(element) {
	simulant.fire(element, 'keydown', { which: KEY_UP });
}

function pressEscape(element) {
	simulant.fire(element, 'keydown', { which: KEY_ESCAPE });
}

function pressEnter(element) {
	simulant.fire(element, 'keydown', { which: KEY_RETURN });
}

function mouseClick(element) {
	simulant.fire(element, 'click', { button: 1 });
}

function nodesExist(selectors) {
	return selectors
		.map((selector) => {
			if (Array.isArray(selector)) {
				const [selectorQuery, callback] = selector;
				const node = document.querySelector(selectorQuery);
				return callback(node);
			}
			return document.querySelector(selector);
		})
		.every(Boolean);
}

async function blurElement(element) {
	element.blur();
	await nextFrame();
}

export {
	nextFrame,
	inputCharacter,
	goDown,
	goUp,
	pressEscape,
	pressEnter,
	mouseClick,
	nodesExist,
	blurElement
};
