<script>
import manageSideEffects from 'manage-side-effects';
import { KEY_RETURN, KEY_ESCAPE, KEY_UP, KEY_DOWN } from 'keycode-js';
import Option from './option.svelte';

function isMouseClick(keycode) {
	return keycode >= 1 && keycode <= 3;
}

function moveCursorToEnd(element) {
	if (typeof element.selectionStart === 'number') {
		element.selectionStart = element.selectionEnd = element.value.length;
	} else if (typeof element.createTextRange !== 'undefined') {
		element.focus();
		const range = element.createTextRange();
		range.collapse(false);
		range.select();
	}
}

function rAFSideEffect(callback) {
	const id = requestAnimationFrame(callback);
	return () => {
		cancelAnimationFrame(id);
	};
}

/**
 * @param  {string[]} namespaces
 * @param  {string} suffix
 *
 * @returns {string}
 */
function createElementNamespace(namespaces, suffix) {
	return namespaces
		.filter(
			(namespace) =>
				(typeof namespace === 'undefined' ? '' : namespace) !== ''
		)
		.map((namespace) => `${namespace}${suffix}`)
		.join(' ');
}

let count = 0;

export default {
	components: {
		Option
	},
	oncreate() {
		this.sideEffects = manageSideEffects();

		this.sideEffects.add(() => {
			return rAFSideEffect(() => {
				this.sideEffects.add(() => {
					const observer = new MutationObserver((mutations) => {
						mutations.forEach((mutation) => {
							if (mutation.attributeName === 'disabled') {
								if (mutation.oldValue === null) {
									this.set({
										isOpened: false
									});
								}
							}
						});
					});
					observer.observe(this.refs.input, {
						attributes: true,
						attributeFilter: ['disabled'],
						attributeOldValue: true
					});

					return () => {
						observer.disconnect();
					};
				});

				this.sideEffects.add(() => {
					return rAFSideEffect(() =>
						moveCursorToEnd(this.refs.input)
					);
				});
			});
		});
	},
	ondestroy() {
		this.refs.input.removeAttribute('autocomplete');
		this.sideEffects.removeAll();
	},
	onupdate({ changed, current }) {
		if (changed.position && current.direction === KEY_UP) {
			this.sideEffects.removeAll();
			this.sideEffects.add(() => {
				return rAFSideEffect(() => moveCursorToEnd(this.refs.input));
			});
		}
	},
	data() {
		const id = count;
		count = count + 1;
		return {
			namespace: 'x-Autosuggest',
			value: '',
			fixedValue: '', // Original user input value
			isOpened: false,
			loading: false,
			id: id,
			position: null,
			results: [],
			direction: null,
			isComponentActive: true
		};
	},
	computed: {
		identifierNamespace({ namespace }) {
			const namespaces = [namespace];
			return {
				container: createElementNamespace(namespaces, ''),
				input: createElementNamespace(namespaces, '-input'),
				results: createElementNamespace(namespaces, '-results'),
				list: createElementNamespace(namespaces, '-list'),
				item: createElementNamespace(namespaces, '-item')
			};
		},
		classNames({ namespace, htmlClassNamespace }) {
			const namespaces = [namespace, htmlClassNamespace];
			return {
				container: createElementNamespace(namespaces, ''),
				input: createElementNamespace(namespaces, '-input'),
				results: createElementNamespace(namespaces, '-results'),
				list: createElementNamespace(namespaces, '-list'),
				item: createElementNamespace(namespaces, '-item')
			};
		},
		hasResults: ({ results }) => results.length !== 0,
		preparedResults: ({ results }) => {
			return results.map((result, index) => {
				let id = `${result.content}`;

				if (result.value === null) {
					id = `null${index}${id}`;
				} else {
					id = `${result.value}${id}`;
				}
				if (typeof result.meta !== 'undefined') {
					id = `${JSON.stringify(result.meta)}${id}`;
				}
				return {
					...result,
					id: id
				};
			});
		}
	},
	events: {
		inputdecorated(node, callback) {
			const { decorateInputEvent } = this.get();
			const listener = decorateInputEvent(callback);
			const fixedValueListener = (event) => {
				const value = event.target.value;
				this.set({
					fixedValue: value
				});
			};
			node.addEventListener('input', listener, false);
			node.addEventListener('input', fixedValueListener, false);
			return {
				destroy() {
					node.removeEventListener('input', listener, false);
					node.removeEventListener(
						'input',
						fixedValueListener,
						false
					);
				}
			};
		}
	},
	methods: {
		setValue(value) {
			const { results } = this.get();
			this.set({
				value: value,
				fixedValue: value,
				position: null,
				isOpened: false,
				results: results.map((result, index) => ({
					...result,
					active: false
				}))
			});
		},
		handlePointerSelect(event, value, meta, selectedIndex) {
			const { results, onOptionSelect } = this.get();
			this.setValue(value);
			onOptionSelect(event, value, meta);
		},
		handleGlobalEvent(event) {
			const { fixedValue } = this.get();
			const keycode = event.which;
			const target = event.target;
			if (isMouseClick(keycode) && this.refs.container.contains(target)) {
				return;
			}
			this.set({
				value: fixedValue,
				position: null,
				isOpened: false
			});
		},
		handleKeydownEvent(event) {
			const keycode = event.which;
			const {
				isOpened,
				onOptionSelect,
				position,
				results,
				fixedValue
			} = this.get();

			switch (keycode) {
				case KEY_UP:
				case KEY_DOWN:
					this.set({
						isOpened: true,
						direction: keycode
					});
					this.navigate();
					break;

				case KEY_ESCAPE:
					// We want to prevent default action for `[type="search"]`
					event.preventDefault();

					this.set({
						value: fixedValue,
						position: null,
						isOpened: false
					});
					break;

				case KEY_RETURN:
					if (isOpened && position !== null) {
						const result = results[position];

						// We want to prevent default action so `form` elements can be handled
						event.preventDefault();

						this.setValue(result.value);
						onOptionSelect(event, result.value, result.meta);
					}
					break;
			}
		},
		handleInputEvent(event) {
			const { value: query, onQueryInput } = this.get();
			this.set({ loading: true });
			onQueryInput(query).then((results) => {
				this.set({
					loading: false,
					position: null,
					isOpened: results.length !== 0,
					results: results.map((result) => ({
						...result,
						active: false
					}))
				});
				return null;
			});
		},
		handleFocusEvent(event) {
			const { results: rawCurrentResults, onFocus } = this.get();
			const currentResults = rawCurrentResults.map((result) => ({
				...result,
				active: false
			}));
			this.set({ loading: true, isOpened: currentResults.length !== 0 });
			onFocus(currentResults).then((results) => {
				this.set({
					loading: false,
					position: null,
					isOpened: results.length !== 0,
					results: results.map((result) => ({
						...result,
						active: false
					}))
				});
				return null;
			});
		},
		handleBlurEvent(event) {
			const { fixedValue } = this.get();
			const target = event.relatedTarget;
			if (target && this.refs.container.contains(target)) {
				return;
			}
			this.set({
				value: fixedValue,
				position: null,
				isOpened: false
			});
		},
		navigate() {
			const {
				results,
				position,
				direction,
				fixedValue,
				value
			} = this.get();
			let newPosition = position;
			let newValue = value;

			if (results.length === 0) {
				return;
			}

			if (direction === KEY_UP) {
				if (newPosition === null) {
					newPosition = results.length - 1;
				} else if (newPosition === 0) {
					newPosition = null;
				} else {
					newPosition = newPosition - 1;
				}
			} else if (direction === KEY_DOWN) {
				if (newPosition === null) {
					newPosition = 0;
				} else if (newPosition === results.length - 1) {
					newPosition = null;
				} else {
					newPosition = newPosition + 1;
				}
			}

			if (newPosition !== null) {
				let validIndexes = results
					.map((result, index) =>
						result.value !== null ? index : null
					)
					.filter((value) => value !== null);

				if (direction === KEY_UP) {
					validIndexes.reverse();
				}

				newPosition = validIndexes
					.filter((index) => {
						if (direction === KEY_UP) {
							return index <= newPosition;
						}
						return index >= newPosition;
					})
					.shift();

				if (typeof newPosition !== 'number') {
					newPosition = null;
				}
			}

			if (newPosition === null) {
				newValue = fixedValue;
			} else {
				newValue = results[newPosition].value;
			}

			this.set({
				value: newValue,
				position: newPosition,
				results: results.map((result, index) => ({
					...result,
					active: index === newPosition
				}))
			});
		}
	}
};
</script>

<svelte:document on:click="handleGlobalEvent(event)" />
<div ref:container class={classNames.container} class:is-opened="isOpened">
	<input
		ref:input
		on:inputdecorated="handleInputEvent(event)"
		on:keydown="handleKeydownEvent(event)"
		on:focusin="handleFocusEvent(event)"
		on:focusout="handleBlurEvent(event)"
		autocomplete={isComponentActive ? "off" : null}
		bind:value="value"
		class={`${elementClassName}${isComponentActive ? ` ${classNames.input}` : ''}`}
		role={isComponentActive ? "combobox" : null}
		aria-autocomplete={isComponentActive ? "list" : null}
		aria-owns={isComponentActive && hasResults ? `${identifierNamespace.results}-${id}` : null}
		aria-activedescendant={isComponentActive ? (position !== null ? `${identifierNamespace.item}-${id}-${position}` : null) : null}
	/>
	{#if hasResults}
	<div
		id={`${identifierNamespace.results}-${id}`}
		role="listbox"
		aria-expanded={isOpened ? 'true' : 'false'}
		class={classNames.results}
		class:is-opened="isOpened"
	>
		<ul class={classNames.list}>
			{#each preparedResults as result, index (result.id)}
			<Option
				identifierNamespace={identifierNamespace}
				classNames={classNames}
				id={id}
				index={index}
				content={result.content}
				isActive={result.active}
				value={result.value}
				decorateOption={decorateOption}
				on:click="handlePointerSelect(event, result.value, result.meta, index)"
			/>
			{/each}
		</ul>
	</div>
	{/if}
</div>
