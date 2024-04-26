# Popkat (by Purrquinox, for use with Sveltekit)

Popkat is a Upload Widget (for Sveltekit), designed to make uploading files to your server using our self-hosted API. Our API is constantly under development to ensure that it is always optimized to it's best; making the User Experience even better for all of our users, no matter their network speeds. This component uses SkeletonCSS with TailwindCSS to help create the innovative design that it has. You can choose it's theme by setting the `data-theme` within your `app.html` file inside of your Sveltekit app. Please note that you **MUST** self host our API for usage of this component. We do **NOT** provide any image hosting for this.

The available theme options are:

- skeleton
- wintry
- modern
- rocket
- seafoam
- vintage
- sahara
- hamlindigo
- gold-nouveau
- crimson

# Popkat (API)

Popkat is a Upload Widget (for Sveltekit) and API, designed to make uploading files to our server from our websites even easier than before. We utilize the use of SeaweedFS (S3) for this, however pure AWS S3 should work without any changes to the actual code; as long as the Environment Variables within the `.env` file is configured correctly. With the help of the Express Middlewares that we use, the performance of our API and Upload Widget should be extremely quick. We try our best to maintain this, to ensure it's optimized at all times. You **MUST** self host our API for usage of this component. You may find the Github Repository to it @ [@Purrquinox/Popkat](https://github.com/Purrquinox/Popkat).
