<script lang="ts">
	import Upload from '../lib/upload.svelte';

	let Open: Boolean = true;
</script>

<Upload
	AllowedFileTypes={['image/jpg', 'image/jpeg', 'image/png']}
	MaxFileSize={50}
	MultipleFilesAllowed={true}
	API_URL="http://localhost:5600"
	Logo="https://sparkyflight.xyz/logo.png"
    UserID="0"
    Platform="testservice"
	{Open}
	on:close={() => (Open = false)}
/>
