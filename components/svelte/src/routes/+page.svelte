<script lang="ts">
	import Upload from '../components/upload.svelte';

	let Open: Boolean = true;
</script>

<Upload {Open} on:close={() => (Open = false)} />
