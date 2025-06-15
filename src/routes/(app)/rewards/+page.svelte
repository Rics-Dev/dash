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
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import * as Pagination from '$lib/components/ui/pagination/index.js';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Progress } from '$lib/components/ui/progress';
	import { toast } from 'svelte-sonner';
	import {
		Search,
		Plus,
		Edit2,
		Trash2,
		Gift,
		Star,
		Package,
		CheckCircle,
		XCircle,
		Eye,
		BarChart3,
		PieChart,
		Target,
		Layers,
		TrendingUp,
		Award,
		Users,
		Activity
	} from 'lucide-svelte';

	let { data } = $props();
	let rewards = $state(data.rewards || []);
	let error = data.error;

	// Search and pagination
	let searchQuery = $state('');
	let currentPage = $state(1);
	let itemsPerPage = $state(10);

	let filteredRewards = $derived(
		rewards.filter(
			(reward: Reward) =>
				reward.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				reward.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				reward.description?.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	let totalPages = $derived(Math.ceil(filteredRewards.length / itemsPerPage));
	let paginatedRewards = $derived(
		filteredRewards.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
	);

	$effect(() => {
		searchQuery;
		currentPage = 1;
	});

	// Modal states
	let showAddModal = $state(false);
	let showEditModal = $state(false);
	let showDeleteDialog = $state(false);
	let showDetailsModal = $state(false);
	let selectedReward = $state<Reward | null>(null);
	let deleteRewardId = $state(0);
	let loading = $state(false);

	type FormErrors = {
		name?: string;
		description?: string;
		pointsRequired?: string;
		category?: string;
		[key: string]: string | undefined;
	};

	let formState = $state({
		id: '',
		name: '',
		description: '',
		pointsRequired: 0,
		category: '',
		available: true,
		errors: {} as FormErrors
	});

	function formatPoints(points: number): string {
		return new Intl.NumberFormat('en-US').format(points);
	}

	// Helper functions
	function getUniqueCategories() {
		return [...new Set(rewards.map((reward: Reward) => reward.category))];
	}

	function getTotalPointsRequired() {
		return rewards.reduce(
			(total: number, reward: Reward) => total + (reward.pointsRequired || 0),
			0
		);
	}

	function getAveragePointsRequired() {
		if (rewards.length === 0) return 0;
		return getTotalPointsRequired() / rewards.length;
	}

	// Analytics
	let analytics = $derived(() => {
		// Category analysis
		const categoryGroups = rewards.reduce((acc: Record<string, Reward[]>, reward: Reward) => {
			const category = reward.category || 'Uncategorized';
			if (!acc[category]) acc[category] = [];
			acc[category].push(reward);
			return acc;
		}, {});

		const categoryData = (Object.entries(categoryGroups) as [string, Reward[]][])
			.map(([category, rewardsInCategory]: [string, Reward[]]) => ({
				category,
				count: rewardsInCategory.length,
				totalPoints: rewardsInCategory.reduce(
					(sum: number, reward: Reward) => sum + (reward.pointsRequired || 0),
					0
				),
				avgPoints:
					rewardsInCategory.length > 0
						? rewardsInCategory.reduce(
								(sum: number, reward: Reward) => sum + (reward.pointsRequired || 0),
								0
							) / rewardsInCategory.length
						: 0,
				availableCount: rewardsInCategory.filter((r: Reward) => r.available).length
			}))
			.sort((a, b) => b.totalPoints - a.totalPoints);

		// Points ranges
		const pointRanges = [
			{ range: '0-100 Points', min: 0, max: 100, count: 0, value: 0 },
			{ range: '100-500 Points', min: 100, max: 500, count: 0, value: 0 },
			{ range: '500-1000 Points', min: 500, max: 1000, count: 0, value: 0 },
			{ range: '1000-5000 Points', min: 1000, max: 5000, count: 0, value: 0 },
			{ range: '5000+ Points', min: 5000, max: Infinity, count: 0, value: 0 }
		];

		rewards.forEach((reward: Reward) => {
			const points = reward.pointsRequired || 0;
			const range = pointRanges.find((r) => points >= r.min && points < r.max);
			if (range) {
				range.count++;
				range.value += points;
			}
		});

		// Top rewards by points
		const topRewards = [...rewards]
			.sort((a, b) => (b.pointsRequired || 0) - (a.pointsRequired || 0))
			.slice(0, 5);

		// Category with highest total points
		const topCategory = categoryData.length > 0 ? categoryData[0] : null;

		// Most popular category (by count)
		const popularCategory =
			categoryData.length > 0 ? [...categoryData].sort((a, b) => b.count - a.count)[0] : null;

		// Available vs unavailable analysis
		const availableCount = rewards.filter((r: Reward) => r.available).length;
		const unavailableCount = rewards.length - availableCount;
		const availabilityRate = rewards.length > 0 ? (availableCount / rewards.length) * 100 : 0;

		return {
			totalRewards: rewards.length,
			totalPointsRequired: getTotalPointsRequired(),
			averagePointsRequired: getAveragePointsRequired(),
			categoriesCount: Object.keys(categoryGroups).length,
			categoryData,
			pointRanges,
			topRewards,
			topCategory,
			popularCategory,
			availableCount,
			unavailableCount,
			availabilityRate,
			// Additional metrics
			highestPoints:
				rewards.length > 0 ? Math.max(...rewards.map((r: Reward) => r.pointsRequired || 0)) : 0,
			lowestPoints:
				rewards.length > 0 ? Math.min(...rewards.map((r: Reward) => r.pointsRequired || 0)) : 0
		};
	});

	// Modal handlers
	function openAddModal() {
		formState = {
			id: '',
			name: '',
			description: '',
			pointsRequired: 0,
			category: '',
			available: true,
			errors: {}
		};
		showAddModal = true;
	}

	function openEditModal(reward: Reward) {
		formState = {
			id: reward.id?.toString() || '',
			name: reward.name || '',
			description: reward.description || '',
			pointsRequired: reward.pointsRequired || 0,
			category: reward.category || '',
			available: reward.available !== false,
			errors: {}
		};
		selectedReward = reward;
		showEditModal = true;
	}

	function openDeleteDialog(rewardId: number | undefined) {
		if (!rewardId) return;
		deleteRewardId = rewardId;
		showDeleteDialog = true;
	}

	function openDetailsModal(reward: Reward) {
		selectedReward = reward;
		showDetailsModal = true;
	}

	function closeModals() {
		showAddModal = false;
		showEditModal = false;
		showDeleteDialog = false;
		showDetailsModal = false;
		formState.errors = {};
		selectedReward = null;
	}

	function handleCreateResult(result: any) {
		loading = false;

		if (result.type === 'success' && result.data?.success) {
			toast.success('Reward created successfully!');
			if (result.data.data) {
				rewards = [...rewards, result.data.data];
			}
			closeModals();
		} else if (result.type === 'failure' && result.data) {
			formState.errors = result.data.errors || {};
			if (result.data.error) {
				toast.error(result.data.error);
			}
			if (result.data.name !== undefined) formState.name = result.data.name;
			if (result.data.description !== undefined) formState.description = result.data.description;
			if (result.data.pointsRequired !== undefined)
				formState.pointsRequired = Number(result.data.pointsRequired);
			if (result.data.category !== undefined) formState.category = result.data.category;
			if (result.data.available !== undefined) formState.available = result.data.available;
		}
	}

	function handleUpdateResult(result: any) {
		loading = false;

		if (result.type === 'success' && result.data?.success) {
			toast.success('Reward updated successfully!');
			if (result.data.data && selectedReward) {
				const updatedReward = result.data.data;
				rewards = rewards.map((r: Reward) => (r.id === selectedReward!.id ? updatedReward : r));
			}
			closeModals();
		} else if (result.type === 'failure' && result.data) {
			formState.errors = result.data.errors || {};
			if (result.data.error) {
				toast.error(result.data.error);
			}
		}
	}

	function handleDeleteResult(result: any) {
		loading = false;

		if (result.type === 'success' && result.data?.success) {
			toast.success('Reward deleted successfully!');
			if (result.data.deletedRewardId) {
				rewards = rewards.filter((r: Reward) => r.id?.toString() !== result.data.deletedRewardId);
			}
			closeModals();
		} else if (result.type === 'failure' && result.data) {
			if (result.data.error) {
				toast.error(result.data.error);
			}
		}
	}

	// Update rewards when new data comes from the server
	$effect(() => {
		if (data.rewards) {
			rewards = data.rewards;
		}
	});
</script>

<Toaster position="top-center" richColors />

<div class="p-6">
	<div class="mx-auto max-w-none space-y-6">
		<!-- Header -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="rounded-lg bg-primary/10 p-2">
					<BarChart3 class="h-6 w-6 text-primary" />
				</div>
				<div>
					<h1 class="text-3xl font-bold tracking-tight">Rewards Analytics</h1>
					<p class="text-muted-foreground">Loyalty program insights and reward management</p>
				</div>
			</div>
			<Button onclick={openAddModal} disabled={loading} class="gap-2">
				<Plus class="h-4 w-4" />
				Add Reward
			</Button>
		</div>

		<!-- Analytics Cards -->
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<Card class="border-l-4 border-l-blue-500">
				<CardContent class="p-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-muted-foreground">Total Points Pool</p>
							<p class="text-2xl font-bold">{formatPoints(analytics().totalPointsRequired)}</p>
							<p class="text-xs text-muted-foreground">
								{analytics().totalRewards} rewards
							</p>
						</div>
						<div class="rounded-full bg-blue-500/10 p-3">
							<Star class="h-6 w-6 text-blue-600" />
						</div>
					</div>
				</CardContent>
			</Card>

			<Card class="border-l-4 border-l-green-500">
				<CardContent class="p-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-muted-foreground">Average Points</p>
							<p class="text-2xl font-bold">
								{formatPoints(Math.round(analytics().averagePointsRequired))}
							</p>
							<p class="text-xs text-muted-foreground">
								Range: {formatPoints(analytics().lowestPoints)} - {formatPoints(
									analytics().highestPoints
								)}
							</p>
						</div>
						<div class="rounded-full bg-green-500/10 p-3">
							<Target class="h-6 w-6 text-green-600" />
						</div>
					</div>
				</CardContent>
			</Card>

			<Card class="border-l-4 border-l-orange-500">
				<CardContent class="p-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-muted-foreground">Categories</p>
							<p class="text-2xl font-bold">{analytics().categoriesCount}</p>
							<p class="text-xs text-orange-600">
								{analytics().popularCategory
									? `Top: ${analytics().popularCategory?.category}`
									: 'No categories'}
							</p>
						</div>
						<div class="rounded-full bg-orange-500/10 p-3">
							<Layers class="h-6 w-6 text-orange-600" />
						</div>
					</div>
				</CardContent>
			</Card>

			<Card class="border-l-4 border-l-purple-500">
				<CardContent class="p-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-muted-foreground">Availability Rate</p>
							<p class="text-2xl font-bold">{analytics().availabilityRate.toFixed(1)}%</p>
							<p class="text-xs text-muted-foreground">
								{analytics().availableCount} of {analytics().totalRewards} available
							</p>
						</div>
						<div class="rounded-full bg-purple-500/10 p-3">
							<Activity class="h-6 w-6 text-purple-600" />
						</div>
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Category Analysis & Points Distribution -->
		<div class="grid gap-4 md:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<PieChart class="h-4 w-4" />
						Category Breakdown
					</CardTitle>
				</CardHeader>
				<CardContent>
					{#if analytics().categoryData.length > 0}
						<div class="space-y-3">
							{#each analytics().categoryData.slice(0, 6) as category}
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<div class="h-3 w-3 rounded-full bg-primary/20"></div>
										<span class="text-sm font-medium">{category.category}</span>
										<Badge variant="secondary" class="text-xs">{category.count}</Badge>
									</div>
									<div class="text-right">
										<span class="text-sm font-semibold">{formatPoints(category.totalPoints)}</span>
										<div class="text-xs text-muted-foreground">
											{category.availableCount} available
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<p class="py-4 text-center text-muted-foreground">No categories to display</p>
					{/if}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<BarChart3 class="h-4 w-4" />
						Points Distribution
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="space-y-3">
						{#each analytics().pointRanges as range}
							<div class="space-y-1">
								<div class="flex items-center justify-between text-sm">
									<span>{range.range}</span>
									<span class="font-medium">{range.count} rewards</span>
								</div>
								<div class="flex items-center gap-2">
									<div class="h-2 flex-1 rounded-full bg-muted">
										<div
											class="h-2 rounded-full bg-primary transition-all"
											style="width: {analytics().totalRewards > 0
												? (range.count / analytics().totalRewards) * 100
												: 0}%"
										></div>
									</div>
									<span class="min-w-16 text-xs text-muted-foreground">
										{formatPoints(range.value)}
									</span>
								</div>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Top Rewards -->
		{#if analytics().topRewards.length > 0}
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Award class="h-4 w-4" />
						Highest Point Rewards
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="space-y-3">
						{#each analytics().topRewards as reward, index}
							<div class="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
								<div
									class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
								>
									{index + 1}
								</div>
								<div class="flex-1">
									<p class="font-medium">{reward.name}</p>
									<div class="flex items-center gap-2">
										<Badge variant="secondary" class="text-xs">{reward.category}</Badge>
										<Badge variant={reward.available ? 'default' : 'secondary'} class="text-xs">
											{reward.available ? 'Available' : 'Unavailable'}
										</Badge>
									</div>
								</div>
								<div class="text-right">
									<div class="flex items-center gap-1">
										<Star class="h-4 w-4 text-yellow-500" />
										<span class="font-semibold">{formatPoints(reward.pointsRequired || 0)}</span>
									</div>
									{#if reward.description}
										<p class="text-xs text-muted-foreground">
											{reward.description.length > 30
												? reward.description.substring(0, 30) + '...'
												: reward.description}
										</p>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		{/if}

		<!-- Stats Cards -->
		<div class="grid gap-4 md:grid-cols-3">
			<Card>
				<CardContent class="p-6">
					<div class="flex items-center gap-2">
						<Package class="h-4 w-4 text-muted-foreground" />
						<p class="text-sm font-medium text-muted-foreground">Total Rewards</p>
					</div>
					<p class="text-2xl font-bold">{rewards.length}</p>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="p-6">
					<div class="flex items-center gap-2">
						<CheckCircle class="h-4 w-4 text-green-600" />
						<p class="text-sm font-medium text-muted-foreground">Available</p>
					</div>
					<p class="text-2xl font-bold text-green-600">
						{rewards.filter((r: Reward) => r.available).length}
					</p>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="p-6">
					<div class="flex items-center gap-2">
						<XCircle class="h-4 w-4 text-red-600" />
						<p class="text-sm font-medium text-muted-foreground">Unavailable</p>
					</div>
					<p class="text-2xl font-bold text-red-600">
						{rewards.filter((r: Reward) => !r.available).length}
					</p>
				</CardContent>
			</Card>
		</div>

		<!-- Search and Filters -->
		<Card>
			<CardContent class="p-6">
				<div class="flex items-center gap-4">
					<div class="relative flex-1">
						<Search
							class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							placeholder="Search rewards by name, category, or description..."
							bind:value={searchQuery}
							class="pl-10"
						/>
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Main Table Card -->
		<Card>
			<CardHeader>
				<div class="flex items-center justify-between">
					<CardTitle>Rewards ({filteredRewards.length})</CardTitle>
					{#if error}
						<Badge variant="destructive">{error}</Badge>
					{/if}
				</div>
			</CardHeader>
			<CardContent class="p-0">
				{#if paginatedRewards.length === 0}
					<div class="flex flex-col items-center justify-center py-12 text-center">
						<Gift class="mb-4 h-16 w-16 text-muted-foreground opacity-50" />
						<h3 class="text-lg font-semibold text-muted-foreground">No rewards found</h3>
						<p class="text-sm text-muted-foreground">
							{searchQuery
								? 'Try adjusting your search terms'
								: 'Get started by creating your first reward'}
						</p>
						{#if !searchQuery}
							<Button onclick={openAddModal} class="mt-4 gap-2">
								<Plus class="h-4 w-4" />
								Add Reward
							</Button>
						{/if}
					</div>
				{:else}
					<Table>
						<TableHeader>
							<TableHead>Name</TableHead>
							<TableHead>Category</TableHead>
							<TableHead>Points Required</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Description</TableHead>
							<TableHead class="text-right">Actions</TableHead>
						</TableHeader>
						<TableBody>
							{#each paginatedRewards as reward (reward.id)}
								<TableRow class="group">
									<TableCell class="font-medium">
										<div class="flex items-center gap-3">
											<div class="rounded-lg bg-primary/10 p-2">
												<Gift class="h-4 w-4 text-primary" />
											</div>
											<div>
												<p class="font-semibold">{reward.name}</p>
												<p class="text-xs text-muted-foreground">ID: {reward.id}</p>
											</div>
										</div>
									</TableCell>
									<TableCell>
										<Badge variant="secondary">
											{reward.category}
										</Badge>
									</TableCell>
									<TableCell>
										<div class="flex items-center gap-1">
											<Star class="h-4 w-4 text-yellow-500" />
											<span class="font-semibold">{formatPoints(reward.pointsRequired)}</span>
										</div>
									</TableCell>
									<TableCell>
										<Badge variant={reward.available ? 'default' : 'secondary'}>
											{reward.available ? 'Available' : 'Unavailable'}
										</Badge>
									</TableCell>
									<TableCell>
										<p class="max-w-xs truncate text-sm text-muted-foreground">
											{reward.description || 'No description'}
										</p>
									</TableCell>
									<TableCell class="text-right">
										<div class="flex items-center justify-end gap-1">
											<Button
												variant="ghost"
												size="sm"
												onclick={() => openDetailsModal(reward)}
												class="h-8 w-8 p-0"
											>
												<Eye class="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onclick={() => openEditModal(reward)}
												class="h-8 w-8 p-0"
											>
												<Edit2 class="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onclick={() => openDeleteDialog(reward.id)}
												class="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
									filteredRewards.length
								)} of {filteredRewards.length} results
							</div>

							<Pagination.Root
								count={filteredRewards.length}
								perPage={itemsPerPage}
								page={currentPage}
							>
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
</div>

<!-- Reward Details Modal -->
<Dialog.Root open={showDetailsModal} onOpenChange={(open) => !loading && (showDetailsModal = open)}>
	<Dialog.Content class="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-lg">
		<Dialog.Header class="flex-shrink-0">
			<Dialog.Title class="flex items-center gap-2">
				<Gift class="h-5 w-5" />
				Reward Details
			</Dialog.Title>
		</Dialog.Header>
		{#if selectedReward}
			<div class="flex-1 space-y-4 overflow-y-auto pr-2">
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-semibold">{selectedReward.name}</h3>
					<Badge variant={selectedReward.available ? 'default' : 'secondary'}>
						{selectedReward.available ? 'Available' : 'Unavailable'}
					</Badge>
				</div>
				<Separator />
				<div class="grid grid-cols-2 gap-4 text-sm">
					<div>
						<p class="font-medium text-muted-foreground">ID</p>
						<p>{selectedReward.id}</p>
					</div>
					<div>
						<p class="font-medium text-muted-foreground">Category</p>
						<Badge variant="secondary">
							{selectedReward.category}
						</Badge>
					</div>
					<div class="col-span-2">
						<p class="font-medium text-muted-foreground">Points Required</p>
						<div class="flex items-center gap-1">
							<Star class="h-4 w-4 text-yellow-500" />
							<span class="text-lg font-semibold"
								>{formatPoints(selectedReward.pointsRequired)}</span
							>
						</div>
					</div>
					{#if selectedReward.description}
						<div class="col-span-2">
							<p class="font-medium text-muted-foreground">Description</p>
							<p class="mt-1">{selectedReward.description}</p>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<!-- Add Reward Modal -->
<Dialog.Root open={showAddModal} onOpenChange={(open) => !loading && (showAddModal = open)}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Plus class="h-5 w-5" />
				Add New Reward
			</Dialog.Title>
		</Dialog.Header>
		<form
			method="POST"
			action="?/create"
			use:enhance={() => {
				loading = true;
				return async ({ result }) => {
					await applyAction(result);
					handleCreateResult(result);
				};
			}}
		>
			<div class="space-y-4">
				<div>
					<Label for="name">Reward Name</Label>
					<Input
						id="name"
						name="name"
						required
						bind:value={formState.name}
						disabled={loading}
						placeholder="e.g., 1000 DZD Gift Card"
					/>
					{#if formState.errors.name}
						<p class="mt-1 text-xs text-red-600">{formState.errors.name}</p>
					{/if}
				</div>
				<div>
					<Label for="description">Description</Label>
					<Textarea
						id="description"
						name="description"
						bind:value={formState.description}
						disabled={loading}
						placeholder="Describe the reward..."
						rows={3}
					/>
					{#if formState.errors.description}
						<p class="mt-1 text-xs text-red-600">{formState.errors.description}</p>
					{/if}
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<Label for="pointsRequired">Points Required</Label>
						<Input
							id="pointsRequired"
							name="pointsRequired"
							type="number"
							min="0"
							required
							bind:value={formState.pointsRequired}
							disabled={loading}
							placeholder="100"
						/>
						{#if formState.errors.pointsRequired}
							<p class="mt-1 text-xs text-red-600">{formState.errors.pointsRequired}</p>
						{/if}
					</div>
					<div>
						<Label for="category">Category</Label>
						<Input
							id="category"
							name="category"
							bind:value={formState.category}
							disabled={loading}
							required
							placeholder="e.g., Electronics, Food & Dining, Shopping..."
						/>
						{#if formState.errors.category}
							<p class="mt-1 text-xs text-red-600">{formState.errors.category}</p>
						{/if}
					</div>
				</div>
				<div class="flex items-center space-x-2">
					<Switch
						id="available"
						name="available"
						value={formState.available ? 'true' : 'false'}
						bind:checked={formState.available}
						disabled={loading}
					/>
					<Label for="available">Available for redemption</Label>
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
					{#if loading}
						<div
							class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
						></div>
					{/if}
					Create Reward
				</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Edit Reward Modal -->
<Dialog.Root open={showEditModal} onOpenChange={(open) => !loading && (showEditModal = open)}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Edit2 class="h-5 w-5" />
				Edit Reward
			</Dialog.Title>
		</Dialog.Header>
		<form
			method="POST"
			action="?/update"
			use:enhance={() => {
				loading = true;
				return async ({ result }) => {
					await applyAction(result);
					handleUpdateResult(result);
				};
			}}
		>
			<input type="hidden" name="id" value={formState.id} />
			<div class="space-y-4">
				<div>
					<Label for="edit-name">Reward Name</Label>
					<Input
						id="edit-name"
						name="name"
						required
						bind:value={formState.name}
						disabled={loading}
						placeholder="e.g., 1000 DZD Gift Card"
					/>
					{#if formState.errors.name}
						<p class="mt-1 text-xs text-red-600">{formState.errors.name}</p>
					{/if}
				</div>
				<div>
					<Label for="edit-description">Description</Label>
					<Textarea
						id="edit-description"
						name="description"
						bind:value={formState.description}
						disabled={loading}
						placeholder="Describe the reward..."
						rows={3}
					/>
					{#if formState.errors.description}
						<p class="mt-1 text-xs text-red-600">{formState.errors.description}</p>
					{/if}
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<Label for="edit-pointsRequired">Points Required</Label>
						<Input
							id="edit-pointsRequired"
							name="pointsRequired"
							type="number"
							min="0"
							required
							bind:value={formState.pointsRequired}
							disabled={loading}
							placeholder="100"
						/>
						{#if formState.errors.pointsRequired}
							<p class="mt-1 text-xs text-red-600">{formState.errors.pointsRequired}</p>
						{/if}
					</div>
					<div>
						<Label for="edit-category">Category</Label>
						<Input
							id="edit-category"
							name="category"
							bind:value={formState.category}
							disabled={loading}
							required
							placeholder="e.g., Electronics, Food & Dining, Shopping..."
						/>
						{#if formState.errors.category}
							<p class="mt-1 text-xs text-red-600">{formState.errors.category}</p>
						{/if}
					</div>
				</div>
				<div class="flex items-center space-x-2">
					<Switch
						id="edit-available"
						name="available"
						value={formState.available ? 'true' : 'false'}
						bind:checked={formState.available}
						disabled={loading}
					/>
					<Label for="edit-available">Available for redemption</Label>
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
					{#if loading}
						<div
							class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
						></div>
					{/if}
					Update Reward
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
			<AlertDialog.Title class="flex items-center gap-2">
				<Trash2 class="h-5 w-5 text-destructive" />
				Delete Reward
			</AlertDialog.Title>
			<AlertDialog.Description>
				Are you sure you want to delete this reward? This action cannot be undone and will affect
				any users who have redeemed this reward.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel disabled={loading}>Cancel</AlertDialog.Cancel>
			<form
				method="POST"
				action="?/delete"
				use:enhance={() => {
					loading = true;
					return async ({ result }) => {
						await applyAction(result);
						handleDeleteResult(result);
					};
				}}
			>
				<input type="hidden" name="rewardId" value={deleteRewardId} />
				<AlertDialog.Action
					type="submit"
					class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					disabled={loading}
				>
					{#if loading}
						<div
							class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
						></div>
					{/if}
					Delete Reward
				</AlertDialog.Action>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
