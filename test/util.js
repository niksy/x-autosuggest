import simulant from 'simulant';

function nextFrame() {
	return new Promise((resolve) => {
		setTimeout(resolve, 0);
	});
}

async function inputCharacter(element) {
	element.focus();
	element.value = 'a';
	simulant.fire(element, 'input', { which: 65 });
	await nextFrame();
}

function goDown(element) {
	simulant.fire(element, 'keydown', { which: 40 });
}

function goUp(element) {
	simulant.fire(element, 'keydown', { which: 38 });
}

function pressEscape(element) {
	simulant.fire(element, 'keydown', { which: 27 });
}

function pressEnter(element) {
	simulant.fire(element, 'keydown', { which: 13 });
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
