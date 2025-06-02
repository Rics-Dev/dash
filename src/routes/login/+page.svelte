<script lang="ts">
	import { enhance, applyAction } from '$app/forms';
	import { goto } from '$app/navigation';
	import Logo from '$lib/assets/Logo.svelte';
	import { toast } from 'svelte-sonner';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import Eye from 'lucide-svelte/icons/eye';
	import EyeOff from 'lucide-svelte/icons/eye-off';
	import type { ActionResult } from '@sveltejs/kit';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	$effect(() => {
		if (data.message) {
			toast.warning(data.message);
		}
	});

	let formErrors = $state<{ email?: string; password?: string }>({});
	let loading = $state(false);
	let showPassword = $state(false);

	function validateForm(formData: FormData): boolean {
		const errors: typeof formErrors = {};
		const email = formData.get('email')?.toString();
		const password = formData.get('password')?.toString();

		if (!email) errors.email = 'Email is required';
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email address';

		if (!password) errors.password = 'Password is required';

		formErrors = errors;
		return Object.keys(errors).length === 0;
	}

	function handleActionResult(result: ActionResult) {
		if (result.type === 'success' && result.data?.success) {
			toast.success('Login successful!');
			const redirectTo = result.data.redirectTo || '/dashboard';
			goto(redirectTo, { replaceState: true });
		} else if (result.type === 'failure' && result.data) {
			const errorMessages: Record<string, string> = {
				missingEmail: result.data.message || 'Email is required',
				missingPassword: result.data.message || 'Password is required',
				authError: result.data.message || 'Authentication failed',
				insufficientPermissions:
					result.data.message || 'You do not have permission to access this area'
			};
			const errorKey = Object.keys(errorMessages).find((key) => result.data && result.data[key]);
			if (errorKey) {
				toast.error(errorMessages[errorKey]);
			} else {
				toast.error('Login failed. Please try again.');
			}
		} else if (result.type === 'error') {
			toast.error('An unexpected error occurred');
		}
	}

	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}
</script>

<svelte:head>
	<title>Fideligo - Admin Login</title>
</svelte:head>

<Toaster position="top-center" richColors />

<main class="flex min-h-screen items-center justify-center bg-muted">
	<Card class="w-full max-w-md border shadow-lg">
		<CardHeader class="flex flex-col items-center gap-2 pb-0">
			<div class="rounded-full bg-white p-2 shadow">
				<Logo width="40" height="40" />
			</div>
			<CardTitle class="text-center text-2xl font-bold">Admin Login</CardTitle>
			<p class="text-sm text-muted-foreground">
				Enter your credentials to access the admin dashboard
			</p>
		</CardHeader>
		<CardContent class="pt-4">
			<form
				method="POST"
				class="space-y-5"
				use:enhance={({ formData, cancel }) => {
					if (!validateForm(formData)) {
						cancel();
						return;
					}
					loading = true;
					return async ({ result }) => {
						loading = false;
						handleActionResult(result);
						if (!(result.type === 'success' && result.data?.success)) {
							await applyAction(result);
						}
					};
				}}
			>
				<div class="space-y-2">
					<Label for="email">Email Address</Label>
					<Input
						id="email"
						type="email"
						name="email"
						value={form?.email ?? ''}
						placeholder="you@example.com"
						class={formErrors.email ? 'border-destructive ring-2 ring-destructive' : ''}
					/>
					{#if formErrors.email}
						<p class="flex items-center gap-1 text-xs text-destructive">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/></svg
							>
							{formErrors.email}
						</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="password">Password</Label>
					<div class="relative">
						<Input
							id="password"
							type={showPassword ? 'text' : 'password'}
							name="password"
							value={form?.password ?? ''}
							placeholder="••••••••"
							class={formErrors.password
								? 'border-destructive pr-10 ring-2 ring-destructive'
								: 'pr-10'}
						/>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							class="hover:bg-transparent hover:text-current absolute right-1 top-1/2 -translate-y-1/2"
							onclick={togglePasswordVisibility}
							tabindex={-1}
						>
							{#if showPassword}
								<EyeOff class="h-5 w-5 text-muted-foreground" />
							{:else}
								<Eye class="h-5 w-5 text-muted-foreground" />
							{/if}
						</Button>
					</div>
					{#if formErrors.password}
						<p class="flex items-center gap-1 text-xs text-destructive">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/></svg
							>
							{formErrors.password}
						</p>
					{/if}
				</div>

				<Button type="submit" class="mt-4 w-full" disabled={loading}>
					{#if loading}
						<svg
							class="mr-2 h-4 w-4 animate-spin text-white"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							><circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle><path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path></svg
						>
						Authenticating...
					{:else}
						Sign in to Dashboard
					{/if}
				</Button>
			</form>
			<div class="mt-6 text-center">
				<div class="text-sm text-muted-foreground">
					Need help? <a
						href="mailto:ricdev.io@gmail.com"
						class="font-medium text-primary hover:underline">Contact support</a
					>
				</div>
			</div>
		</CardContent>
		<div class="rounded-b-lg border-t bg-muted px-8 py-4">
			<div class="flex items-center justify-center">
				<div class="text-xs text-muted-foreground">© 2025 Fideligo. All rights reserved.</div>
			</div>
		</div>
	</Card>
</main>
