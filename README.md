# Popkat (by Purrquinox)

Popkat is a Upload Widget (for Sveltekit) and API, designed to make uploading files to our server from our websites even easier than before. We utilize the use of SeaweedFS (S3) for this, however pure AWS S3 should work without any changes to the actual code; as long as the Environment Variables within the `.env` file is configured correctly. With the help of the Express Middlewares that we use, the performance of our API and Upload Widget should be extremely quick. We try our best to maintain this, to ensure it's optimized at all times.
