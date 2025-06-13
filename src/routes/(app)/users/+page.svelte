<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { Toaster } from '$lib/components/ui/sonner';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import {
		Table,
		TableHeader,
		TableHead,
		TableBody,
		TableRow,
		TableCell
	} from '$lib/components/ui/table';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import * as Pagination from '$lib/components/ui/pagination/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { Badge } from '$lib/components/ui/badge';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
	import { Separator } from '$lib/components/ui/separator';
	import { toast } from 'svelte-sonner';
	import {
		Search,
		Plus,
		Edit2,
		Trash2,
		Users,
		Mail,
		Eye,
		Gift,
		CreditCard,
		X,
		Calendar,
		DollarSign
	} from 'lucide-svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	let { data } = $props();
	let users = $state(data.users || []);

	// Initialize userTransactions and userRewards as reactive state
	let userTransactions = $state<Record<string, Transaction[]>>(data.userTransactions || {});
	let userRewards = $state<Record<string, Reward[]>>(data.userRewards || {});
	let error = data.error;

	// Search and pagination
	let searchQuery = $state('');
	let currentPage = $state(1);
	let itemsPerPage = $state(10);

	let filteredUsers = $derived(
		users.filter(
			(user: User) =>
				user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
				user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
				user.role?.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	let totalPages = $derived(Math.ceil(filteredUsers.length / itemsPerPage));
	let paginatedUsers = $derived(
		filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
	);

	$effect(() => {
		searchQuery;
		currentPage = 1;
	});

	// Modal states
	let showAddModal = $state(false);
	let showEditModal = $state(false);
	let showDeleteDialog = $state(false);
	let showUserDetailsModal = $state(false);
	let selectedUser = $state<User | null>(null);
	let deleteUserId = $state(0);
	let loading = $state(false);
	let detailsViewType = $state<'transactions' | 'rewards'>('transactions');
	let loadingUserData = $state<Record<string, boolean>>({});

	type FormErrors = {
		email?: string;
		displayName?: string;
		password?: string;
		loyaltyPoints?: string;
		[key: string]: string | undefined;
	};

	let formState = $state({
		id: '',
		email: '',
		displayName: '',
		password: '',
		loyaltyPoints: 0,
		enabled: true,
		errors: {} as FormErrors
	});

	// Helper functions
	function getInitials(name: string): string {
		return name
			.split(' ')
			.map((word) => word[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	function getRoleBadgeVariant(role: string | undefined) {
		switch (role?.toLowerCase()) {
			case 'admin':
				return 'destructive';
			case 'manager':
				return 'default';
			case 'user':
				return 'secondary';
			default:
				return 'outline';
		}
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('ar-DZ', {
			style: 'currency',
			currency: 'DZD'
		}).format(amount);
	}

	// Modal handlers
	function openAddModal() {
		formState = {
			id: '',
			email: '',
			displayName: '',
			password: '',
			loyaltyPoints: 0,
			enabled: true,
			errors: {}
		};
		showAddModal = true;
	}

	function openEditModal(user: User) {
		formState = {
			id: user.id?.toString() ?? '',
			email: user.email,
			displayName: user.username,
			password: '',
			loyaltyPoints: user.loyaltyPoints ?? 0,
			enabled: user.enabled ?? true,
			errors: {}
		};
		selectedUser = user;
		showEditModal = true;
	}

	function openDeleteDialog(userId: number | undefined) {
		if (!userId) {
			toast.error('Invalid user ID');
			return;
		}
		deleteUserId = userId;
		showDeleteDialog = true;
	}

	async function openUserDetailsModal(
		user: User,
		viewType: 'transactions' | 'rewards' = 'transactions'
	) {
		selectedUser = user;
		detailsViewType = viewType;
		showUserDetailsModal = true;

		const userId = user.id?.toString() ?? '';

		// Only fetch data if we don't already have it
		await loadUserDataIfNeeded(userId, viewType);
	}

	async function loadUserDataIfNeeded(userId: string, viewType: 'transactions' | 'rewards') {
		if (viewType === 'transactions' && userTransactions[userId] !== undefined) {
			return; // Data already exists
		}
		if (viewType === 'rewards' && userRewards[userId] !== undefined) {
			return; // Data already exists
		}

		const loadingKey = `${userId}-${viewType}`;
		if (loadingUserData[loadingKey]) {
			return; // Already loading
		}

		loadingUserData[loadingKey] = true;
		loadingUserData = { ...loadingUserData };

		try {
			await goto(`?userId=${userId}&viewType=${viewType}`, {
				keepFocus: true,
				noScroll: true,
				replaceState: true // Don't add to history stack
			});
		} catch (error) {
			console.error(`Failed to load ${viewType} for user ${userId}:`, error);
			if (viewType === 'transactions') {
				userTransactions[userId] = [];
			} else {
				userRewards[userId] = [];
			}
			userTransactions = { ...userTransactions };
			userRewards = { ...userRewards };
		} finally {
			// Clear loading state
			delete loadingUserData[loadingKey];
			loadingUserData = { ...loadingUserData };
		}
	}

	// Optimized tab change handler
	async function handleTabChange(value: string) {
		if (value === 'transactions' || value === 'rewards') {
			detailsViewType = value;

			if (selectedUser) {
				const userId = selectedUser.id?.toString() ?? '';
				await loadUserDataIfNeeded(userId, value);
			}
		}
	}

	// Enhanced effect to handle server data updates
	$effect(() => {
		// Update userTransactions when data changes
		if (data.userTransactions) {
			// Merge new data with existing data
			const newTransactions = { ...userTransactions };
			for (const [userId, transactions] of Object.entries(data.userTransactions)) {
				newTransactions[userId] = transactions;
			}
			userTransactions = newTransactions;
			console.log('Updated userTransactions from server:', userTransactions);
		}

		// Update userRewards when data changes
		if (data.userRewards) {
			// Merge new data with existing data
			const newRewards = { ...userRewards };
			for (const [userId, rewards] of Object.entries(data.userRewards)) {
				newRewards[userId] = rewards;
			}
			userRewards = newRewards;
			console.log('Updated userRewards from server:', userRewards);
		}
	});

	// Function to preload data (optional optimization)
	async function preloadUserData(userId: string, viewType: 'transactions' | 'rewards') {
		// Only preload if data doesn't exist and we're not already loading
		const loadingKey = `${userId}-${viewType}`;
		if (
			(viewType === 'transactions' && userTransactions[userId] === undefined) ||
			(viewType === 'rewards' && userRewards[userId] === undefined)
		) {
			if (!loadingUserData[loadingKey]) {
				await loadUserDataIfNeeded(userId, viewType);
			}
		}
	}

	// Enhanced close function to clean up URL
	function closeModals() {
		showAddModal = false;
		showEditModal = false;
		showDeleteDialog = false;
		showUserDetailsModal = false;
		formState.errors = {};
		selectedUser = null;

		// Clean up URL parameters when closing modal
		const url = new URL(window.location.href);
		if (url.searchParams.has('userId') || url.searchParams.has('viewType')) {
			url.searchParams.delete('userId');
			url.searchParams.delete('viewType');
			goto(url.pathname + url.search, {
				keepFocus: true,
				noScroll: true,
				replaceState: true
			});
		}
	}

	function handleCreateResult(result: any) {
		loading = false;

		if (result.type === 'success' && result.data?.success) {
			const newUser = result.data.data as User;
			users = [newUser, ...users];
			toast.success('User created successfully');
			closeModals();
		} else if (result.type === 'failure' && result.data) {
			toast.error(result.data.error || 'Failed to create user');
			formState.errors = result.data.errors || {};
		} else if (result.type === 'error') {
			toast.error('Unexpected error occurred');
		}
	}

	function handleUpdateResult(result: any) {
		loading = false;

		if (result.type === 'success' && result.data?.success) {
			const updatedUser = result.data.data as User;
			users = users.map((user: User) => (user.id === updatedUser.id ? updatedUser : user));
			toast.success('User updated successfully');
			closeModals();
		} else if (result.type === 'failure' && result.data) {
			toast.error(result.data.error || 'Failed to update user');
			formState.errors = result.data.errors || {};
		} else if (result.type === 'error') {
			toast.error('Unexpected error occurred');
		}
	}

	function handleDeleteResult(result: any) {
		loading = false;

		if (result.type === 'success' && result.data?.success) {
			users = users.filter((user: User) => user.id !== deleteUserId);
			toast.success('User deleted successfully');
			closeModals();
		} else if (result.type === 'failure' && result.data) {
			toast.error(result.data.error || 'Failed to delete user');
		} else if (result.type === 'error') {
			toast.error('Unexpected error occurred');
		}
	}

	// Reactive effect to update state when new data comes from the server
	$effect(() => {
		// Update userTransactions when data changes
		if (data.userTransactions) {
			userTransactions = { ...userTransactions, ...data.userTransactions };
			console.log('Updated userTransactions from server:', userTransactions);
		}
		// Update userRewards when data changes
		if (data.userRewards) {
			userRewards = { ...userRewards, ...data.userRewards };
			console.log('Updated userRewards from server:', userRewards);
		}
	});
</script>

<Toaster position="top-center" richColors />

<div class="container mx-auto space-y-6 p-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<div class="rounded-lg bg-primary/10 p-2">
				<Users class="h-6 w-6 text-primary" />
			</div>
			<div>
				<h1 class="text-3xl font-bold tracking-tight">User Management</h1>
				<p class="text-muted-foreground">Manage users, roles, and permissions</p>
			</div>
		</div>
		<Button onclick={openAddModal} disabled={loading} class="gap-2">
			<Plus class="h-4 w-4" />
			Add User
		</Button>
	</div>

	<Card>
		<CardContent class="p-6">
			<div class="flex items-center gap-2">
				<Users class="h-5 w-5 text-muted-foreground" />
				<div>
					<p class="text-sm font-medium text-muted-foreground">Total Users</p>
					<p class="text-2xl font-bold">{users.length}</p>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Main Table Card -->
	<Card>
		<CardHeader class="pb-4">
			<div class="flex items-center justify-between">
				<CardTitle class="text-xl">Users</CardTitle>
				<div class="flex items-center gap-4">
					<div class="flex items-center gap-2 text-sm text-muted-foreground">
						<span>Show</span>
						<select
							bind:value={itemsPerPage}
							class="rounded border bg-transparent px-2 py-1 text-sm"
							onchange={() => (currentPage = 1)}
						>
							<option value={5}>5</option>
							<option value={10}>10</option>
							<option value={25}>25</option>
							<option value={50}>50</option>
						</select>
						<span>per page</span>
					</div>
					<div class="relative w-72">
						<Search
							class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground"
						/>
						<Input placeholder="Search users..." bind:value={searchQuery} class="pl-10" />
					</div>
				</div>
			</div>
		</CardHeader>
		<CardContent class="p-0">
			{#if error}
				<div class="border-b bg-red-50 p-6 text-center text-red-600">
					{error}
				</div>
			{/if}

			{#if filteredUsers.length === 0}
				<div class="p-12 text-center">
					<Users class="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
					<p class="text-lg font-medium text-muted-foreground">
						{searchQuery ? 'No users found' : 'No users yet'}
					</p>
					<p class="mt-1 text-sm text-muted-foreground">
						{searchQuery
							? 'Try adjusting your search terms'
							: 'Get started by adding your first user'}
					</p>
				</div>
			{:else}
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>User</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Role</TableHead>
							<TableHead>Loyalty Points</TableHead>
							<TableHead>Status</TableHead>
							<TableHead class="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each paginatedUsers as user (user.id)}
							<TableRow class="group hover:bg-muted/50">
								<TableCell>
									<div class="flex items-center gap-3">
										<Avatar class="h-8 w-8">
											<AvatarFallback class="text-xs">
												{getInitials(user.username)}
											</AvatarFallback>
										</Avatar>
										<div>
											<p class="font-medium">{user.username}</p>
											<p class="text-sm text-muted-foreground">ID: {user.id}</p>
										</div>
									</div>
								</TableCell>
								<TableCell>
									<div class="flex items-center gap-2">
										<Mail class="h-4 w-4 text-muted-foreground" />
										{user.email}
									</div>
								</TableCell>
								<TableCell>
									<Badge variant={getRoleBadgeVariant(user.role)}>
										{user.role || 'User'}
									</Badge>
								</TableCell>
								<TableCell>
									<div class="font-mono text-sm">
										{(user.loyaltyPoints ?? 0).toLocaleString()}
									</div>
								</TableCell>
								<TableCell>
									<Badge variant={user.enabled ? 'default' : 'secondary'}>
										{user.enabled ? 'Active' : 'Inactive'}
									</Badge>
								</TableCell>
								<TableCell class="text-right">
									<div class="flex items-center justify-end gap-2">
										<Button
											size="sm"
											variant="ghost"
											onclick={() => openUserDetailsModal(user, 'transactions')}
											disabled={loading}
											class="h-8 w-8 p-0"
											title="View Details"
										>
											<Eye class="h-4 w-4" />
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onclick={() => openEditModal(user)}
											disabled={loading}
											class="h-8 w-8 p-0"
											title="Edit User"
										>
											<Edit2 class="h-4 w-4" />
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onclick={() => openDeleteDialog(user.id)}
											disabled={loading}
											class="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
											title="Delete User"
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>

				<!-- Pagination -->
				{#if totalPages > 1}
					<div class="flex items-center justify-between border-t px-6 py-4">
						<div class="text-sm text-muted-foreground">
							Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(
								currentPage * itemsPerPage,
								filteredUsers.length
							)} of {filteredUsers.length} results
						</div>

						<Pagination.Root count={filteredUsers.length} perPage={itemsPerPage} page={currentPage}>
							{#snippet children({ pages, currentPage: paginationCurrentPage })}
								<Pagination.Content>
									<Pagination.Item>
										<Pagination.PrevButton
											onclick={() => {
												if (currentPage > 1) {
													currentPage = currentPage - 1;
												}
											}}
										/>
									</Pagination.Item>
									{#each pages as page (page.key)}
										{#if page.type === 'ellipsis'}
											<Pagination.Item>
												<Pagination.Ellipsis />
											</Pagination.Item>
										{:else}
											<Pagination.Item>
												<Pagination.Link
													{page}
													isActive={paginationCurrentPage === page.value}
													onclick={() => {
														currentPage = page.value;
													}}
												>
													{page.value}
												</Pagination.Link>
											</Pagination.Item>
										{/if}
									{/each}
									<Pagination.Item>
										<Pagination.NextButton
											onclick={() => {
												if (currentPage < totalPages) {
													currentPage = currentPage + 1;
												}
											}}
										/>
									</Pagination.Item>
								</Pagination.Content>
							{/snippet}
						</Pagination.Root>
					</div>
				{/if}
			{/if}
		</CardContent>
	</Card>
</div>

<!-- User Details Modal with Tabs -->
<Dialog.Root
	open={showUserDetailsModal}
	onOpenChange={(open) => !loading && (showUserDetailsModal = open)}
>
	<Dialog.Content class="flex max-h-[80vh] flex-col overflow-hidden sm:max-w-5xl">
		<Dialog.Header class="flex-shrink-0 pb-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<Avatar class="h-12 w-12">
						<AvatarFallback class="text-lg">
							{selectedUser ? getInitials(selectedUser.username) : 'U'}
						</AvatarFallback>
					</Avatar>
					<div>
						<Dialog.Title class="text-xl font-semibold">
							{selectedUser?.username || 'User Details'}
						</Dialog.Title>
						<Dialog.Description class="text-sm text-muted-foreground">
							{selectedUser?.email} • ID: {selectedUser?.id}
						</Dialog.Description>
						<div class="mt-1 flex items-center gap-2">
							<Badge variant={getRoleBadgeVariant(selectedUser?.role || '')}>
								{selectedUser?.role || 'user'}
							</Badge>
							<Badge variant="outline">
								{selectedUser?.loyaltyPoints || 0} points
							</Badge>
							<Badge variant={selectedUser?.enabled ? 'default' : 'secondary'}>
								{selectedUser?.enabled ? 'Active' : 'Inactive'}
							</Badge>
						</div>
					</div>
				</div>
			</div>
		</Dialog.Header>

		{#if selectedUser}
			<Tabs.Root
				value={detailsViewType}
				onValueChange={handleTabChange}
				class="flex flex-1 flex-col overflow-hidden"
			>
				<Tabs.List class="grid w-full flex-shrink-0 grid-cols-2">
					<Tabs.Trigger value="transactions" class="flex items-center gap-2">
						<CreditCard class="h-4 w-4" />
						Transactions
						{@const userId = selectedUser?.id?.toString() ?? ''}
						{#if loadingUserData[`${userId}-transactions`]}
							<div
								class="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent"
							></div>
						{/if}
					</Tabs.Trigger>
					<Tabs.Trigger value="rewards" class="flex items-center gap-2">
						<Gift class="h-4 w-4" />
						Rewards
						{@const userId = selectedUser?.id?.toString() ?? ''}
						{#if loadingUserData[`${userId}-rewards`]}
							<div
								class="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent"
							></div>
						{/if}
					</Tabs.Trigger>
				</Tabs.List>

				<Tabs.Content
					value="transactions"
					class="flex-1 overflow-auto p-6 data-[state=active]:flex data-[state=active]:flex-col"
				>
					<div class="mb-4 flex items-center gap-2">
						<CreditCard class="h-5 w-5" />
						<h3 class="text-lg font-semibold">Transaction History</h3>
					</div>

					{@const userId = selectedUser?.id?.toString() ?? ''}
					{@const transactions = userTransactions[userId]}
					{@const isLoading = loadingUserData[`${userId}-transactions`]}

					{#if isLoading || transactions === undefined}
						<div class="flex flex-1 items-center justify-center">
							<div class="text-center">
								<div
									class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
								></div>
								<p class="text-muted-foreground">Loading transactions...</p>
							</div>
						</div>
					{:else if transactions.length === 0}
						<div class="flex flex-1 items-center justify-center">
							<div class="text-center text-muted-foreground">
								<CreditCard class="mx-auto mb-4 h-16 w-16 opacity-30" />
								<h4 class="mb-2 text-lg font-medium">No transactions found</h4>
								<p class="text-sm">This user hasn't made any transactions yet.</p>
							</div>
						</div>
					{:else}
						<!-- Transaction content remains the same -->
						<div class="space-y-4">
							<div class="mb-4 text-sm text-muted-foreground">
								{transactions.length} transaction{transactions.length !== 1 ? 's' : ''} found
							</div>
							{#each transactions as transaction (transaction.id)}
								<Card class="transition-all hover:shadow-md">
									<CardContent class="p-6">
										<div class="mb-4 flex items-start justify-between">
											<div class="flex items-center gap-4">
												<div class="rounded-lg bg-primary/10 p-3">
													<DollarSign class="h-5 w-5 text-primary" />
												</div>
												<div>
													<p class="text-lg font-semibold">
														Transaction #{transaction.referenceNumber}
													</p>
													<div class="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
														<Calendar class="h-3 w-3" />
														{formatDate(transaction.timestamp)}
													</div>
													{#if transaction.pan}
														<p class="mt-1 text-xs text-muted-foreground">
															Card: ****{transaction.pan.slice(-4)}
														</p>
													{/if}
												</div>
											</div>
											<div class="text-right">
												<p class="text-2xl font-bold">
													{formatCurrency(transaction.amount)}
												</p>
												<div class="mt-2 flex flex-col gap-1">
													{#if transaction.authorizationCode}
														<Badge variant="secondary" class="text-xs">
															Auth: {transaction.authorizationCode}
														</Badge>
													{/if}
													{#if transaction.responseCode}
														<Badge
															variant={transaction.responseCode === '00'
																? 'default'
																: 'destructive'}
															class="text-xs"
														>
															{transaction.responseCode === '00'
																? 'Approved'
																: `Error: ${transaction.responseCode}`}
														</Badge>
													{/if}
												</div>
											</div>
										</div>

										<!-- Transaction Items -->
										{#if transaction.transactionItems && transaction.transactionItems.length > 0}
											<Separator class="my-4" />
											<div>
												<p class="mb-3 flex items-center gap-2 text-sm font-semibold">
													<Users class="h-4 w-4" />
													Items Purchased ({transaction.transactionItems.length})
												</p>
												<div class="space-y-3">
													{#each transaction.transactionItems as item}
														<div
															class="flex items-start justify-between rounded-lg bg-muted/30 p-3"
														>
															<div class="flex-1">
																<div class="flex items-center gap-2">
																	<span class="font-medium">{item.article.name}</span>
																	<Badge variant="outline" class="text-xs">
																		Qty: {item.quantity}
																	</Badge>
																</div>
																{#if item.article.description}
																	<p class="mt-1 text-sm text-muted-foreground">
																		{item.article.description}
																	</p>
																{/if}
																<p class="mt-1 text-xs text-muted-foreground">
																	{formatCurrency(item.article.price)} each
																</p>
															</div>
															<div class="ml-4 text-right">
																<span class="text-lg font-semibold">
																	{formatCurrency(item.article.price * item.quantity)}
																</span>
															</div>
														</div>
													{/each}
												</div>
											</div>
										{/if}
									</CardContent>
								</Card>
							{/each}
						</div>
					{/if}
				</Tabs.Content>

				<Tabs.Content
					value="rewards"
					class="flex-1 overflow-auto p-6 data-[state=active]:flex data-[state=active]:flex-col"
				>
					<div class="mb-4 flex items-center gap-2">
						<Gift class="h-5 w-5" />
						<h3 class="text-lg font-semibold">Rewards History</h3>
					</div>

					{@const userId = selectedUser?.id?.toString() ?? ''}
					{@const rewards = userRewards[userId]}
					{@const isLoading = loadingUserData[`${userId}-rewards`]}

					{#if isLoading || rewards === undefined}
						<div class="flex flex-1 items-center justify-center">
							<div class="text-center">
								<div
									class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
								></div>
								<p class="text-muted-foreground">Loading rewards...</p>
							</div>
						</div>
					{:else if rewards.length === 0}
						<div class="flex flex-1 items-center justify-center">
							<div class="text-center text-muted-foreground">
								<Gift class="mx-auto mb-4 h-16 w-16 opacity-30" />
								<h4 class="mb-2 text-lg font-medium">No rewards claimed</h4>
								<p class="text-sm">This user hasn't claimed any rewards yet.</p>
							</div>
						</div>
					{:else}
						<!-- Rewards content remains the same -->
						<div class="space-y-4">
							<div class="mb-4 text-sm text-muted-foreground">
								{rewards.length} reward{rewards.length !== 1 ? 's' : ''} claimed
							</div>
							{#each rewards as userReward (userReward.id)}
								<Card class="transition-all hover:shadow-md">
									<CardContent class="p-6">
										<div class="flex items-center justify-between">
											<div class="flex items-center gap-4">
												<div class="rounded-lg bg-green-100 p-3">
													<Gift class="h-5 w-5 text-green-600" />
												</div>
												<div>
													<p class="text-lg font-semibold">Reward Claimed</p>
													<p class="text-sm text-muted-foreground">
														Reward ID: {userReward.id}
													</p>
												</div>
											</div>
											<Badge variant="secondary" class="px-3 py-1">Claimed</Badge>
										</div>
									</CardContent>
								</Card>
							{/each}
						</div>
					{/if}
				</Tabs.Content>
			</Tabs.Root>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<!-- Add User Modal -->
<Dialog.Root open={showAddModal} onOpenChange={(open) => !loading && (showAddModal = open)}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Add New User</Dialog.Title>
			<Dialog.Description>Create a new user account with the information below.</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			use:enhance={() => {
				loading = true;
				return async ({ result }) => {
					handleCreateResult(result);
					await applyAction(result);
				};
			}}
			action="?/create"
			class="space-y-4"
		>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<Label for="email">Email</Label>
					<Input
						id="email"
						name="email"
						type="email"
						required
						bind:value={formState.email}
						disabled={loading}
						placeholder="user@example.com"
					/>
					{#if formState.errors.email}
						<p class="mt-1 text-xs text-red-600">{formState.errors.email}</p>
					{/if}
				</div>
				<div>
					<Label for="displayName">Display Name</Label>
					<Input
						id="displayName"
						name="displayName"
						required
						bind:value={formState.displayName}
						disabled={loading}
						placeholder="John Doe"
					/>
					{#if formState.errors.displayName}
						<p class="mt-1 text-xs text-red-600">{formState.errors.displayName}</p>
					{/if}
				</div>
			</div>
			<div>
				<Label for="password">Password</Label>
				<Input
					id="password"
					name="password"
					type="password"
					required
					bind:value={formState.password}
					disabled={loading}
					placeholder="••••••••"
				/>
				{#if formState.errors.password}
					<p class="mt-1 text-xs text-red-600">{formState.errors.password}</p>
				{/if}
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<Label for="loyaltyPoints">Loyalty Points</Label>
					<Input
						id="loyaltyPoints"
						name="loyaltyPoints"
						type="number"
						min="0"
						bind:value={formState.loyaltyPoints}
						disabled={loading}
						placeholder="0"
					/>
					{#if formState.errors.loyaltyPoints}
						<p class="mt-1 text-xs text-red-600">{formState.errors.loyaltyPoints}</p>
					{/if}
				</div>
				<div class="flex items-end">
					<div class="flex items-center space-x-2">
						<Switch
							id="enabled"
							name="enabled"
							bind:checked={formState.enabled}
							disabled={loading}
						/>
						<Label for="enabled">Active Account</Label>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 pt-4">
				<Button
					type="button"
					variant="outline"
					onclick={() => !loading && closeModals()}
					disabled={loading}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={loading}>
					{loading ? 'Creating...' : 'Create User'}
				</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Edit User Modal -->
<Dialog.Root open={showEditModal} onOpenChange={(open) => !loading && (showEditModal = open)}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Edit User</Dialog.Title>
			<Dialog.Description>Update user information and settings.</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			use:enhance={() => {
				loading = true;
				return async ({ result }) => {
					handleUpdateResult(result);
					await applyAction(result);
				};
			}}
			action="?/update"
			class="space-y-4"
		>
			<input type="hidden" name="id" value={formState.id} />
			<div class="grid grid-cols-2 gap-4">
				<div>
					<Label for="email">Email</Label>
					<Input
						id="email"
						name="email"
						type="email"
						required
						bind:value={formState.email}
						disabled={loading}
					/>
					{#if formState.errors.email}
						<p class="mt-1 text-xs text-red-600">{formState.errors.email}</p>
					{/if}
				</div>
				<div>
					<Label for="displayName">Display Name</Label>
					<Input
						id="displayName"
						name="displayName"
						required
						bind:value={formState.displayName}
						disabled={loading}
					/>
					{#if formState.errors.displayName}
						<p class="mt-1 text-xs text-red-600">{formState.errors.displayName}</p>
					{/if}
				</div>
			</div>
			<div>
				<Label for="password">Password</Label>
				<Input
					id="password"
					name="password"
					type="password"
					bind:value={formState.password}
					disabled={loading}
					placeholder="Leave blank to keep unchanged"
				/>
				<p class="mt-1 text-xs text-muted-foreground">Leave blank to keep current password</p>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<Label for="loyaltyPoints">Loyalty Points</Label>
					<Input
						id="loyaltyPoints"
						name="loyaltyPoints"
						type="number"
						min="0"
						bind:value={formState.loyaltyPoints}
						disabled={loading}
					/>
					{#if formState.errors.loyaltyPoints}
						<p class="mt-1 text-xs text-red-600">{formState.errors.loyaltyPoints}</p>
					{/if}
				</div>
				<div class="flex items-end">
					<div class="flex items-center space-x-2">
						<Switch
							id="enabled"
							name="enabled"
							bind:checked={formState.enabled}
							disabled={loading}
						/>
						<Label for="enabled">Active Account</Label>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 pt-4">
				<Button
					type="button"
					variant="outline"
					onclick={() => !loading && closeModals()}
					disabled={loading}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={loading}>
					{loading ? 'Updating...' : 'Update User'}
				</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Confirmation Dialog -->
<AlertDialog.Root
	open={showDeleteDialog}
	onOpenChange={(open) => !loading && (showDeleteDialog = open)}
>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete User</AlertDialog.Title>
			<AlertDialog.Description>
				Are you sure you want to delete this user? This action cannot be undone and will permanently
				remove all user data.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel disabled={loading}>Cancel</AlertDialog.Cancel>
			<form
				method="POST"
				use:enhance={() => {
					loading = true;
					return async ({ result }) => {
						handleDeleteResult(result);
						await applyAction(result);
					};
				}}
				action="?/delete"
				style="display: inline;"
			>
				<input type="hidden" name="userId" value={deleteUserId} />
				<AlertDialog.Action
					type="submit"
					class={buttonVariants({ variant: 'destructive' })}
					disabled={loading}
				>
					{loading ? 'Deleting...' : 'Delete User'}
				</AlertDialog.Action>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
