import assert from 'assert';
import sinon from 'sinon';
import fn from '../index';
import {
	nextFrame,
	inputCharacter,
	goDown,
	goUp,
	pressEscape,
	pressEnter,
	mouseClick,
	nodesExist
} from './util';

function fetchData(options = {}) {
	const {
		addMeta = false
	} = options ;
	const data = ['bonnie', 'brutus', 'elvis'].map((value) => {
		return {
			content: `<a href="${value}">${value}</a>`,
			value: value,
			...(addMeta ? {
				meta: {
					value: value
				}
			} : {})
		};
	});
	return Promise.resolve(data);
}

before(function() {
	window.fixture.load('/test/fixtures/index.html');
});

after(function() {
	window.fixture.cleanup();
});

it('should display results', async function() {
	const element = document.querySelector('.Input');

	const instance = fn(element, {
		onQueryInput() {
			return fetchData();
		}
	});

	await inputCharacter(element);

	assert.ok(
		nodesExist([
			'.x-Autosuggest-input[autocomplete="off"][aria-autocomplete="list"][aria-owns="x-Autosuggest-results-0"]:not(aria-activedescendant)',
			'#x-Autosuggest-results-0[role="listbox"][aria-expanded="true"]',
			'#x-Autosuggest-item-0-0[role="option"][aria-selected="false"] a[href="bonnie"]',
			'#x-Autosuggest-item-0-1[role="option"][aria-selected="false"] a[href="brutus"]',
			'#x-Autosuggest-item-0-2[role="option"][aria-selected="false"] a[href="elvis"]'
		])
	);

	instance.destroy();
});

it('should handle keyboard movement', async function() {
	const element = document.querySelector('.Input');

	const instance = fn(element, {
		onQueryInput() {
			return fetchData();
		}
	});

	await inputCharacter(element);

	goDown(element);
	goDown(element);

	assert.ok(
		nodesExist([
			'.x-Autosuggest-input[aria-activedescendant="x-Autosuggest-item-1-1"]',
			'#x-Autosuggest-item-1-0[aria-selected="false"]',
			'#x-Autosuggest-item-1-1[aria-selected="true"]',
			'#x-Autosuggest-item-1-2[aria-selected="false"]',
			['.x-Autosuggest-input', (node) => node.value === 'brutus']
		])
	);

	goDown(element);

	assert.ok(
		nodesExist([
			'.x-Autosuggest-input[aria-activedescendant="x-Autosuggest-item-1-2"]',
			'#x-Autosuggest-item-1-0[aria-selected="false"]',
			'#x-Autosuggest-item-1-1[aria-selected="false"]',
			'#x-Autosuggest-item-1-2[aria-selected="true"]',
			['.x-Autosuggest-input', (node) => node.value === 'elvis']
		])
	);

	goUp(element);
	goUp(element);

	assert.ok(
		nodesExist([
			'.x-Autosuggest-input[aria-activedescendant="x-Autosuggest-item-1-0"]',
			'#x-Autosuggest-item-1-0[aria-selected="true"]',
			'#x-Autosuggest-item-1-1[aria-selected="false"]',
			'#x-Autosuggest-item-1-2[aria-selected="false"]',
			['.x-Autosuggest-input', (node) => node.value === 'bonnie']
		])
	);

	goUp(element);

	assert.ok(
		nodesExist([
			'.x-Autosuggest-input:not(aria-activedescendant)',
			'#x-Autosuggest-item-1-0[aria-selected="false"]',
			'#x-Autosuggest-item-1-1[aria-selected="false"]',
			'#x-Autosuggest-item-1-2[aria-selected="false"]',
			['.x-Autosuggest-input', (node) => node.value === 'a']
		])
	);

	goUp(element);
	goDown(element);

	assert.ok(
		nodesExist([
			'.x-Autosuggest-input:not(aria-activedescendant)',
			'#x-Autosuggest-item-1-0[aria-selected="false"]',
			'#x-Autosuggest-item-1-1[aria-selected="false"]',
			'#x-Autosuggest-item-1-2[aria-selected="false"]',
			['.x-Autosuggest-input', (node) => node.value === 'a']
		])
	);

	instance.destroy();
});

it('should handle keyboard events for closing', async function() {
	const element = document.querySelector('.Input');

	const instance = fn(element, {
		onQueryInput() {
			return fetchData();
		}
	});

	await inputCharacter(element);

	goDown(element);

	assert.ok(nodesExist(['#x-Autosuggest-results-2[aria-expanded="true"]']));

	pressEscape(element);

	assert.ok(nodesExist(['#x-Autosuggest-results-2[aria-expanded="false"]']));

	instance.destroy();
});

it('should handle mouse events for closing', async function() {
	const element = document.querySelector('.Input');

	const instance = fn(element, {
		onQueryInput() {
			return fetchData();
		}
	});

	await inputCharacter(element);

	goDown(element);

	assert.ok(nodesExist(['#x-Autosuggest-results-3[aria-expanded="true"]']));

	mouseClick(document.body);

	assert.ok(nodesExist(['#x-Autosuggest-results-3[aria-expanded="false"]']));

	instance.destroy();
});

it('should handle option select', async function() {
	const element = document.querySelector('.Input');
	const spy = sinon.spy();

	const instance = fn(element, {
		onOptionSelect: spy,
		onQueryInput() {
			return fetchData({ addMeta: true });
		}
	});

	await inputCharacter(element);

	goDown(element);
	pressEnter(element);

	assert.ok(
		nodesExist([
			'#x-Autosuggest-results-4[aria-expanded="false"]',
			['.x-Autosuggest-input', (node) => node.value === 'bonnie']
		])
	);
	assert.ok(spy.called);
	assert.equal(spy.firstCall.args[1], 'bonnie');
	assert.deepEqual(spy.firstCall.args[2], { value: 'bonnie' });

	instance.destroy();
});

it('should handle decorated option', async function() {
	const element = document.querySelector('.Input');

	const instance = fn(element, {
		decorateOption(node) {
			node.classList.add('is-decorated');
		},
		onQueryInput() {
			return fetchData();
		}
	});

	await inputCharacter(element);

	goDown(element);

	assert.ok(
		nodesExist([
			'#x-Autosuggest-item-5-0.is-decorated[aria-selected="true"]'
		])
	);

	instance.destroy();
});

it('should handle decorated input event', async function() {
	const element = document.querySelector('.Input');
	const spy = sinon.spy();

	const instance = fn(element, {
		decorateInputEvent(listener) {
			return (e) => {
				spy();
				listener(e);
			};
		},
		onQueryInput() {
			return fetchData();
		}
	});

	await inputCharacter(element);

	assert.ok(spy.called);

	instance.destroy();
});

it('should hide results if input is disabled', async function() {
	const element = document.querySelector('.Input');

	const instance = fn(element, {
		onQueryInput() {
			return fetchData();
		}
	});

	await inputCharacter(element);

	goDown(element);
	goDown(element);

	assert.ok(
		nodesExist([
			'#x-Autosuggest-results-7[role="listbox"][aria-expanded="true"]'
		])
	);

	element.disabled = true;

	await nextFrame();

	assert.ok(
		nodesExist([
			'#x-Autosuggest-results-7[role="listbox"][aria-expanded="false"]'
		])
	);

	element.disabled = false;
	instance.destroy();
});

it('should display placeholder elements', async function() {
	const element = document.querySelector('.Input');

	const instance = fn(element, {
		async onQueryInput() {
			const data = await fetchData();
			return [
				...data,
				{
					content: '<hr />',
					value: null
				}
			];
		}
	});

	await inputCharacter(element);

	goDown(element);

	assert.ok(
		nodesExist([
			'#x-Autosuggest-item-8-0[aria-selected="true"]',
			'#x-Autosuggest-item-8-1[aria-selected="false"]',
			'#x-Autosuggest-item-8-2[aria-selected="false"]',
			'#x-Autosuggest-results-8 li:last-child hr'
		])
	);

	instance.destroy();
});

it('should handle destroy and element reusability', function() {
	const element = document.querySelector('.Input');

	const instance = fn(element);

	assert.ok(nodesExist(['.x-Autosuggest-input']));
	assert.ok(element === document.querySelector('.x-Autosuggest-input'));

	instance.destroy();

	assert.ok(nodesExist(['input:not(.x-Autosuggest-input)']));
});
