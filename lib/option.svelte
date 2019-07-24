<script>
import manageSideEffects from 'manage-side-effects';

export default {
	oncreate () {
		this.sideEffects = manageSideEffects();
	},
	onupdate ({ changed, current, previous }) {
		const { value, decorateOption } = current;
		if ( changed.content && value !== null ) {
			this.sideEffects.removeAll();
			this.sideEffects.add(() => {
				return decorateOption(this.refs.option);
			});
		}
	},
	ondestroy () {
		this.sideEffects.removeAll();
	}
};
</script>

{#if value !== null}
<li
	ref:option
	id={`${namespace}-item-${id}-${index}`}
	class={`${namespace}-item`}
	class:is-selected="isActive"
	role="option"
	aria-selected={isActive ? 'true' : 'false'}
	tabindex="-1"
	on:click
>
	{@html content}
</li>
{:else}
<li>
	{@html content}
</li>
{/if}
