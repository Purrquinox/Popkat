import { SvelteComponentTyped } from 'svelte';

interface FileTypings {
	name: string;
	type: string;
	size: string;
	url: string;
	uploaded: boolean;
}

interface EventTypes {
	upload_finished: FileTypings[] | null;
	error: Error;
	close: null;
}

declare const __propDef: {
	props: {
		AllowedFileTypes: string[];
		MaxFileSize?: number | undefined;
		MultipleFilesAllowed: boolean;
		API_URL: string;
		Logo: string;
        UserID: string;
        Platform: string;
		Open?: Boolean | undefined;
		Uploading?: boolean | undefined;
	};
	events: EventTypes & {
		[evt: string]: EventTypes<any>;
	};
	slots: {};
};
export type UploadProps = typeof __propDef.props;
export type UploadEvents = typeof __propDef.events;
export type UploadSlots = typeof __propDef.slots;
export default class Upload extends SvelteComponentTyped<UploadProps, UploadEvents, UploadSlots> {}
export {};
