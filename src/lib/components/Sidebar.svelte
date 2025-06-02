<script lang="ts">
	import { BarChart2, Home, Store, LogOut, Gift , History} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import UserIcon from '$lib/assets/User.svelte';
	import { goto } from '$app/navigation';
	import Logo from '$lib/assets/Logo.svelte';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { page } from '$app/state';
	let { user } = $props();
	const mainNavItems = $derived([
		{
			icon: Home,
			label: 'Dashboard',
			href: '/dashboard',
			active: page.url.pathname.startsWith('/dashboard')
		},
		{
			icon: UserIcon,
			label: 'Users',
			href: '/users',
			active: page.url.pathname.startsWith('/users')
		},
		{
			icon: Gift,
			label: 'Rewards',
			href: '/rewards',
			active: page.url.pathname.startsWith('/rewards')
		},	
		{
			icon: Store,
			label: 'Articles',
			href: '/articles',
			active: page.url.pathname.startsWith('/articles')
		},
		{
			icon: History,
			label: 'Transactions',
			href: '/transactions',
			active: page.url.pathname.startsWith('/transactions')
		},
	]);
</script>

<div class="flex h-full w-60 flex-col border-r bg-background">
	<div class="flex items-center gap-2 p-3">
		<Logo width="24" height="24" />
		<span class="font-medium">Fideligo</span>
	</div>

	<div class="p-2">
		{#each mainNavItems as item}
			<Button
				variant={item.active ? 'default' : 'ghost'}
				size="sm"
				class="mb-1 w-full justify-start gap-2 {item.active
					? 'bg-primary text-primary-foreground'
					: ''}"
				onclick={() => goto(item.href)}
			>
				<item.icon />
				{item.label}
			</Button>
		{/each}
	</div>

	<div class="mt-auto flex items-center justify-between border-t p-3">
		<div class="flex items-center gap-2">
			<Avatar>
				<AvatarFallback>
					<UserIcon />
				</AvatarFallback>
			</Avatar>
			<div class="text-left">
				<div class="text-sm font-medium">{user?.username ?? 'Unknown User'}</div>
				<div class="text-xs text-muted-foreground">{user?.email ?? ''}</div>
			</div>
		</div>

		<form method="POST" action="/dashboard?/logout" class="m-0 p-0">
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button
							variant="ghost"
							size="icon"
							type="submit"
							title="Logout"
							class="group hover:bg-red-100 focus:bg-red-100"
							aria-label="Logout"
						>
							<LogOut class="text-red-500 group-hover:text-red-700 group-focus:text-red-700" />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content side="left" align="center">Logout</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
		</form>
	</div>
</div>
