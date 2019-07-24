import Component from './lib/index.svelte';

export default (element, options = {}) => {
	const {
		decorateOption = (node) => {},
		decorateInputEvent = (listener) => listener,
		onOptionSelect = (event, value) => {},
		onQueryInput = (query) => Promise.resolve([])
	} = options;

	const instance = new Component({
		target: element.parentElement,
		elementToHandle: element,
		data: {
			decorateOption,
			decorateInputEvent,
			onOptionSelect,
			onQueryInput
		}
	});
	return {
		destroy: () => {
			instance.set({ isComponentActive: false });
			instance.destroy();
		}
	};
};
