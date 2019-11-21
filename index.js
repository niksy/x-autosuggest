import Component from './lib/index.svelte';

export default (element, options = {}) => {
	const {
		htmlClassNamespace = '',
		decorateOption = (node) => {},
		decorateInputEvent = (listener) => listener,
		onOptionSelect = (event, value, meta) => {},
		onQueryInput = (query) => Promise.resolve([])
	} = options;

	const value = element.value;

	const instance = new Component({
		target: element.parentElement,
		elementToHandle: element,
		data: {
			value: value,
			fixedValue: value,
			elementClassName: element.className,
			htmlClassNamespace,
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
