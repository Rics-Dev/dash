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

<div class="flex h-screen bg-gray-50">
	<Sidebar user={data.user} />
	<div class="flex h-screen flex-1 flex-col">
		<Header title={pageTitle()} />
		<div class="no-scroll flex-1 overflow-y-auto p-4">
			{@render children()}
		</div>
	</div>
</div>