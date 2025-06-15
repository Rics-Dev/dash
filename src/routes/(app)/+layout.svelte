<script lang="ts">
	import type { LayoutProps } from '../$types';
	import { page } from '$app/state';
	import Header from '$lib/components/Header.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { data, children }: LayoutProps = $props();

	const pageTitle = $derived(() => {
		const segments = page.url.pathname.split('/').filter(Boolean);
		const lastSegment = segments[segments.length - 1] || 'home';
		return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
	});
</script>

<div class="flex h-screen overflow-hidden bg-gray-50">
	<Sidebar user={data.user} />
	<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
		<Header title={pageTitle()} />
		<main class="custom-scroll max-h-full min-h-0 flex-1">
			{@render children()}
		</main>
	</div>
</div>
