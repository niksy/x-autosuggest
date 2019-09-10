<script>
import manageSideEffects from 'manage-side-effects';
import {
	KEY_RETURN,
	KEY_ESCAPE,
	KEY_UP,
	KEY_DOWN,
} from 'keycode-js';
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

function moveCursorToEndSideEffect(element) {
	const id = requestAnimationFrame(() => {
		moveCursorToEnd(element);
	});
	return () => {
		cancelAnimationFrame(id);
	};
}

let count = 0;

export default {
	components: {
		Option
	},
	oncreate() {
		this.sideEffects = manageSideEffects();

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
			return moveCursorToEndSideEffect(this.refs.input);
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
				return moveCursorToEndSideEffect(this.refs.input);
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
			node.addEventListener('input', listener, false);
			return {
				destroy() {
					node.removeEventListener('input', listener, false);
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
			if (
				isMouseClick(keycode) &&
				this.refs.container.contains(target)
			) {
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
					// We need to prevent default action for `[type="search"]`
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
						this.setValue(result.value);
						onOptionSelect(event, result.value, result.meta);
					}
					break;
			}
		},
		handleInputEvent(event) {
			const { value } = this.get();
			this.set({
				fixedValue: value
			});
			this.getData(value);
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
		getData(query) {
			const { onQueryInput } = this.get();
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
				return results;
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
<div ref:container class={namespace} class:is-opened="isOpened">
	<input
		ref:input
		on:inputdecorated="handleInputEvent(event)"
		on:keydown="handleKeydownEvent(event)"
		on:focusout="handleBlurEvent(event)"
		autocomplete={isComponentActive ? "off" : null}
		bind:value="value"
		class:x-Autosuggest-input="isComponentActive"
		role={isComponentActive ? "combobox" : null}
		aria-autocomplete={isComponentActive ? "list" : null}
		aria-owns={isComponentActive && hasResults ? `${namespace}-results-${id}` : null}
		aria-activedescendant={isComponentActive ? (position !== null ? `${namespace}-item-${id}-${position}` : null) : null}
	/>
	{#if hasResults}
	<div
		id={`${namespace}-results-${id}`}
		role="listbox"
		aria-expanded={isOpened ? 'true' : 'false'}
		class={`${namespace}-results`}
		class:is-opened="isOpened"
	>
		<ul class={`${namespace}-list`}>
			{#each preparedResults as result, index (result.id)}
			<Option
				namespace={namespace}
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
