<script lang="ts">
	import Upload from '../components/upload.svelte';

	let Open: Boolean = true;
</script>

<Upload
	AllowedFileTypes={['jpg', 'jpeg', 'png']}
	MaxFileSize={50}
	API_URL="http://localhost:5600/upload"
	Logo="https://sparkyflight.xyz/logo.png"
	{Open}
	on:close={() => (Open = false)}
/>
