<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { FileDropzone } from '@skeletonlabs/skeleton';
	export let Open: Boolean = true;

	const dispatch: any = createEventDispatcher();

	const onChangeHandler = (e: Event): void => {
		console.log('file data:', e);
	};
</script>

{#if Open}
	<div
		class="modal z-50 fixed w-full h-full top-0 left-0 flex items-center justify-center p-8 lg:p-0"
	>
		<div class="modal-overlay fixed w-full h-full bg-gray-900 opacity-50" />

		<div
			class="bg-surface-600 w-full lg:h-max lg:w-1/2 mx-auto rounded-lg shadow-xl z-50 overflow-y-auto"
		>
			<div
				class="flex justify-between items-center head bg-surface-800 text-primary-400 py-5 px-8 text-2xl font-extrabold"
			>
				<div class="flex">
					<img
						class="h-10 rounded-full"
						src="https://sparkyflight.xyz/logo.png"
						alt="Sparkyflight"
					/>
					<h2 class="ml-2 mt-1">Upload Files</h2>
				</div>

				<button
					class="p-2 bg-surface-500 hover:bg-surface-600 text-white rounded-full ml-4"
					on:click={() => dispatch('close')}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						height="24px"
						viewBox="0 0 24 24"
						width="24px"
						fill="currentColor"
						class="text-primary-400"
						><path d="M0 0h24v24H0V0z" fill="none" /><path
							d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
						/></svg
					>
				</button>
			</div>

			<div class="content p-5">
				<FileDropzone name="files" on:change={onChangeHandler}>
					<svelte:fragment slot="lead"
						><i class="fa-solid fa-file-arrow-up text-4xl" /></svelte:fragment
					>
					<svelte:fragment slot="message"><b>Upload a File</b> or drag and drop!</svelte:fragment>
					<svelte:fragment slot="meta"><b>JPEG | PNG | JPG (50MB MAX)</b></svelte:fragment>
				</FileDropzone>
			</div>
		</div>
	</div>
{/if}
