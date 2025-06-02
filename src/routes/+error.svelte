<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	const statusCategory = Math.floor((page.status || 500) / 100);
	
	const colorScheme = {
		4: {
			icon: '🔍',
			title: 'text-amber-700',
			border: 'border-amber-500',
			button: 'bg-amber-600 hover:bg-amber-700',
			badge: 'bg-amber-100 text-amber-800'
		},
		5: {
			icon: '😢',
			title: 'text-red-700',
			border: 'border-red-500',
			button: 'bg-red-600 hover:bg-red-700',
			badge: 'bg-red-100 text-red-800'
		}
	}[statusCategory] || {
		icon: '❓',
		title: 'text-blue-700',
		border: 'border-blue-500',
		button: 'bg-blue-600 hover:bg-blue-700',
		badge: 'bg-blue-100 text-blue-800'
	};

    type StatusCode = 400 | 401 | 403 | 404 | 429 | 500;
    type StatusMessages = Record<StatusCode, string>;

	const helpfulMessages: StatusMessages  = {
		404: "We couldn't find the page you're looking for. It might have been moved or deleted.",
		500: "We're experiencing some server issues. Please try again later.",
		403: "You don't have permission to access this resource.",
		401: "Authentication is required to access this resource.",
		400: "The request couldn't be processed. Please check your input.",
		429: "Too many requests. Please try again later."
	};

	const defaultMessage = "An unexpected error occurred. We're working on fixing it.";
	const errorMessage = page.error?.message || defaultMessage;
	const helpfulMessage = helpfulMessages[page.status as StatusCode] || '';
</script>


<main class="flex items-center justify-center min-h-screen bg-gray-100">
	<div class=" flex flex-col items-center justify-center bg-white rounded-xl shadow-lg p-16 mx-auto max-w-2xl border-t-4 {colorScheme.border} transition-all">
		<div class="flex flex-col items-center text-center">
			<span class="text-6xl sm:text-7xl mb-4 animate-bounce-soft" aria-hidden="true">{colorScheme.icon}</span>
			
			<div class="mb-2 flex items-center gap-3">
				<span class="px-3 py-1 text-sm font-medium rounded-full {colorScheme.badge}">
					{page.status || 'Error'}
				</span>
				<h1 class="text-xl sm:text-2xl font-bold {colorScheme.title}">
					Oops! Something went wrong
				</h1>
			</div>
			
			<div class="space-y-4 mb-8">
				<p class="text-gray-600  text-center max-w-md">
					{errorMessage}
				</p>
				{#if helpfulMessage}
					<p class="text-gray-500  text-sm text-center max-w-md">
						{helpfulMessage}
					</p>
				{/if}
			</div>
		</div>
		
		<div class="flex flex-col sm:flex-row gap-4">
			<button
				class="px-6 py-2.5 rounded-lg text-white font-medium transition-all {colorScheme.button} focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50 focus:outline-none focus:ring-blue-500"
				on:click={() => goto('/')}
			>
				Return Home
			</button>
			
			<button
				class="px-6 py-2.5 rounded-lg border border-gray-300  text-gray-700  font-medium hover:bg-gray-50  transition-all focus:ring-2 focus:ring-offset-2 focus:outline-none focus:ring-gray-500"
				on:click={() => window.location.reload()}
			>
				Try Again
			</button>
		</div>
	</div>
</main>