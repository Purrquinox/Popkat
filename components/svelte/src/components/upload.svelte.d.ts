import { SvelteComponentTyped } from 'svelte';
declare const __propDef: {
	props: {
		AllowedFileTypes: string[];
		MaxFileSize?: number | undefined;
		MultipleFilesAllowed: boolean;
		API_URL: string;
		Logo: string;
		Open?: Boolean | undefined;
		Uploading?: boolean | undefined;
	};
	events: {
		close: CustomEvent<any>;
		upload_finished: CustomEvent<any>;
		error: CustomEvent<any>;
	} & {
		[evt: string]: CustomEvent<any>;
	};
	slots: {};
};
export type UploadProps = typeof __propDef.props;
export type UploadEvents = typeof __propDef.events;
export type UploadSlots = typeof __propDef.slots;
export default class Upload extends SvelteComponentTyped<UploadProps, UploadEvents, UploadSlots> {}
export {};
