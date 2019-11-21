import simulant from 'simulant';
import { KEY_DOWN, KEY_UP, KEY_ESCAPE, KEY_RETURN, KEY_A } from 'keycode-js';

function nextFrame() {
	return new Promise((resolve) => {
		setTimeout(resolve, 0);
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
				const node = document.querySelector(selector[0]);
				return selector[1](node);
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
