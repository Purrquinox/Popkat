<script lang="ts">
	import Upload from '../components/upload.svelte';

	let Open: Boolean = true;
</script>

<Upload
	AllowedFileTypes={['image/jpg', 'image/jpeg', 'image/png']}
	MaxFileSize={50}
	MultipleFilesAllowed={true}
	API_URL="http://localhost:5600"
	Logo="https://sparkyflight.xyz/logo.png"
	{Open}
	on:close={() => (Open = false)}
/>
