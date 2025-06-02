import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { RequestEvent } from '@sveltejs/kit';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
export type WithoutChildren<T> = T extends { children?: any }
  ? Omit<T, "children">
  : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & {
  ref?: U | null;
};


export function handleLoginRedirect(
	event: RequestEvent,
	message: string = 'You must be logged in to access this page'
) {
	const redirectTo = event.url.pathname + event.url.search;
	return `/login?redirectTo=${redirectTo}&message=${message}`;
}