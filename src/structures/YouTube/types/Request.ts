import { ResourcePart, ResourceType } from './Resource';

export interface RequestQueryString {
	key?: string;
	maxResults?: number;
	options?: Record<string, string>;
	pageToken?: string;
}

export interface RequestOptions {
	part?: ResourcePart;
	q?: string;
	type?: ResourceType;
	safeSearch?: "strict" | "moderate" | "none";
}

export interface RequestResult {
	items: any[];
	kind: string;
	nextPageToken?: string;
}
