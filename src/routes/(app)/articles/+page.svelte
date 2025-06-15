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
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { Progress } from '$lib/components/ui/progress';
	import { toast } from 'svelte-sonner';
	import { Chart, Area, Axis, Bars, Tooltip } from 'layerchart';
	import {
		Search,
		Plus,
		Edit2,
		Trash2,
		Package,
		DollarSign,
		Tag,
		Eye,
		ShoppingCart,
		TrendingUp,
		Activity,
		BarChart3,
		PieChart,
		Target,
		Star,
		Layers
	} from 'lucide-svelte';

	let { data } = $props();
	let articles = $state(data.articles || []);
	let error = data.error;

	// Search and pagination
	let searchQuery = $state('');
	let currentPage = $state(1);
	let itemsPerPage = $state(10);

	let filteredArticles = $derived(
		articles.filter(
			(article: Article) =>
				article.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				article.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				article.category.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	let totalPages = $derived(Math.ceil(filteredArticles.length / itemsPerPage));
	let paginatedArticles = $derived(
		filteredArticles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
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
	let selectedArticle = $state<Article | null>(null);
	let deleteArticleId = $state(0);
	let loading = $state(false);

	type FormErrors = {
		name?: string;
		description?: string;
		price?: string;
		category?: string;
		[key: string]: string | undefined;
	};

	let formState = $state({
		id: '',
		name: '',
		description: '',
		price: 0,
		category: '',
		errors: {} as FormErrors
	});

	// Helper functions
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('ar-DZ', {
			style: 'currency',
			currency: 'DZD'
		}).format(amount);
	}

	function getUniqueCategories() {
		return [...new Set(articles.map((article: Article) => article.category))];
	}

	function getTotalValue() {
		return articles.reduce((total: number, article: Article) => total + article.price, 0);
	}

	function getAveragePrice() {
		if (articles.length === 0) return 0;
		return getTotalValue() / articles.length;
	}

	// Analytics
	let analytics = $derived(() => {
		// Category analysis
		const categoryGroups = articles.reduce((acc: Record<string, Article[]>, article: Article) => {
			const category = article.category || 'Uncategorized';
			if (!acc[category]) acc[category] = [];
			acc[category].push(article);
			return acc;
		}, {});

		const categoryData = (Object.entries(categoryGroups) as [string, Article[]][])
			.map(([category, articlesInCategory]: [string, Article[]]) => ({
				category,
				count: articlesInCategory.length,
				totalValue: articlesInCategory.reduce(
					(sum: number, article: Article) => sum + article.price,
					0
				),
				avgPrice:
					articlesInCategory.length > 0
						? articlesInCategory.reduce((sum: number, article: Article) => sum + article.price, 0) /
							articlesInCategory.length
						: 0
			}))
			.sort((a, b) => b.totalValue - a.totalValue);

		// Price ranges
		const priceRanges = [
			{ range: '0-2500 DZD', min: 0, max: 2500, count: 0, value: 0 },
			{ range: '2500-10000 DZD', min: 2500, max: 10000, count: 0, value: 0 },
			{ range: '10000-50000 DZD', min: 10000, max: 50000, count: 0, value: 0 },
			{ range: '50000+ DZD', min: 50000, max: Infinity, count: 0, value: 0 }
		];

		articles.forEach((article: Article) => {
			const price = article.price || 0;
			const range = priceRanges.find((r) => price >= r.min && price < r.max);
			if (range) {
				range.count++;
				range.value += price;
			}
		});

		// Top products by value
		const topProducts = [...articles].sort((a, b) => b.price - a.price).slice(0, 5);

		// Category with highest value
		const topCategory = categoryData.length > 0 ? categoryData[0] : null;

		// Most popular category (by count)
		const popularCategory =
			categoryData.length > 0 ? [...categoryData].sort((a, b) => b.count - a.count)[0] : null;

		return {
			totalArticles: articles.length,
			totalValue: getTotalValue(),
			averagePrice: getAveragePrice(),
			categoriesCount: Object.keys(categoryGroups).length,
			categoryData,
			priceRanges,
			topProducts,
			topCategory,
			popularCategory,
			// Additional metrics
			highestPrice: articles.length > 0 ? Math.max(...articles.map((a: Article) => a.price)) : 0,
			lowestPrice: articles.length > 0 ? Math.min(...articles.map((a: Article) => a.price)) : 0
		};
	});

	// Modal handlers
	function openAddModal() {
		formState = {
			id: '',
			name: '',
			description: '',
			price: 0,
			category: '',
			errors: {}
		};
		showAddModal = true;
	}

	function openEditModal(article: Article) {
		formState = {
			id: article.id?.toString() || '',
			name: article.name || '',
			description: article.description || '',
			price: article.price || 0,
			category: article.category || '',
			errors: {}
		};
		selectedArticle = article;
		showEditModal = true;
	}

	function openDeleteDialog(articleId: number | undefined) {
		if (!articleId) return;
		deleteArticleId = articleId;
		showDeleteDialog = true;
	}

	function openDetailsModal(article: Article) {
		selectedArticle = article;
		showDetailsModal = true;
	}

	function closeModals() {
		showAddModal = false;
		showEditModal = false;
		showDeleteDialog = false;
		showDetailsModal = false;
		formState.errors = {};
		selectedArticle = null;
	}

	function validateForm(): boolean {
		const errors: FormErrors = {};

		if (!formState.name.trim()) {
			errors.name = 'Name is required';
		}

		if (!formState.category.trim()) {
			errors.category = 'Category is required';
		}

		if (formState.price <= 0) {
			errors.price = 'Price must be greater than 0';
		}

		formState.errors = errors;
		return Object.keys(errors).length === 0;
	}

	function handleCreateResult(result: any) {
		loading = false;

		if (result.type === 'success' && result.data?.success) {
			toast.success('Article created successfully!');
			if (result.data.data) {
				articles = [...articles, result.data.data];
			}
			closeModals();
		} else if (result.type === 'failure' && result.data) {
			formState.errors = result.data.errors || {};
			if (result.data.error) {
				toast.error(result.data.error);
			}
			if (result.data.name !== undefined) formState.name = result.data.name;
			if (result.data.description !== undefined) formState.description = result.data.description;
			if (result.data.price !== undefined) formState.price = Number(result.data.price);
			if (result.data.category !== undefined) formState.category = result.data.category;
		}
	}

	function handleUpdateResult(result: any) {
		loading = false;

		if (result.type === 'success' && result.data?.success) {
			toast.success('Article updated successfully!');
			if (result.data.data && selectedArticle) {
				const updatedArticle = result.data.data;
				articles = articles.map((a: Article) =>
					a.id === selectedArticle!.id ? updatedArticle : a
				);
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
			toast.success('Article deleted successfully!');
			if (result.data.deletedArticleId) {
				articles = articles.filter(
					(a: Article) => a.id?.toString() !== result.data.deletedArticleId
				);
			}
			closeModals();
		} else if (result.type === 'failure' && result.data) {
			if (result.data.error) {
				toast.error(result.data.error);
			}
		}
	}

	// Update articles when new data comes from the server
	$effect(() => {
		if (data.articles) {
			articles = data.articles;
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
					<h1 class="text-3xl font-bold tracking-tight">Articles Analytics</h1>
					<p class="text-muted-foreground">Catalog insights and inventory management</p>
				</div>
			</div>
			<Button onclick={openAddModal} disabled={loading} class="gap-2">
				<Plus class="h-4 w-4" />
				Add Article
			</Button>
		</div>

		<!-- Analytics Cards -->
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<Card class="border-l-4 border-l-blue-500">
				<CardContent class="p-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-muted-foreground">Total Catalog Value</p>
							<p class="text-2xl font-bold">{formatCurrency(analytics().totalValue)}</p>
							<p class="text-xs text-muted-foreground">
								{analytics().totalArticles} articles
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card class="border-l-4 border-l-green-500">
				<CardContent class="p-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-muted-foreground">Average Price</p>
							<p class="text-2xl font-bold">{formatCurrency(analytics().averagePrice)}</p>
							<p class="text-xs text-muted-foreground">
								Range: {formatCurrency(analytics().lowestPrice)} - {formatCurrency(
									analytics().highestPrice
								)}
							</p>
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
							<p class="text-sm font-medium text-muted-foreground">Top Category</p>
							{#if analytics().topCategory}
								<p class="text-lg font-bold">{analytics().topCategory?.category}</p>
								<p class="text-sm text-purple-600">
									{formatCurrency(analytics().topCategory?.totalValue || 0)}
								</p>
								<p class="text-xs text-muted-foreground">{analytics().topCategory?.count} items</p>
							{:else}
								<p class="text-lg font-bold">-</p>
								<p class="text-sm text-muted-foreground">No data</p>
							{/if}
						</div>
						<div class="rounded-full bg-purple-500/10 p-3">
							<Star class="h-6 w-6 text-purple-600" />
						</div>
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Category Analysis & Price Distribution -->
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
									<span class="text-sm font-semibold">{formatCurrency(category.totalValue)}</span>
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
						Price Distribution
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="space-y-3">
						{#each analytics().priceRanges as range}
							<div class="space-y-1">
								<div class="flex items-center justify-between text-sm">
									<span>{range.range}</span>
									<span class="font-medium">{range.count} items</span>
								</div>
								<div class="flex items-center gap-2">
									<div class="h-2 flex-1 rounded-full bg-muted">
										<div
											class="h-2 rounded-full bg-primary transition-all"
											style="width: {analytics().totalArticles > 0
												? (range.count / analytics().totalArticles) * 100
												: 0}%"
										></div>
									</div>
									<span class="min-w-16 text-xs text-muted-foreground">
										{formatCurrency(range.value)}
									</span>
								</div>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Top Products -->
		{#if analytics().topProducts.length > 0}
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Star class="h-4 w-4" />
						Highest Value Products
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="space-y-3">
						{#each analytics().topProducts as product, index}
							<div class="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
								<div
									class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
								>
									{index + 1}
								</div>
								<div class="flex-1">
									<p class="font-medium">{product.name}</p>
									<p class="text-sm text-muted-foreground">{product.category}</p>
								</div>
								<div class="text-right">
									<p class="font-semibold">{formatCurrency(product.price)}</p>
									{#if product.description}
										<p class="max-w-32 truncate text-xs text-muted-foreground">
											{product.description}
										</p>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		{/if}

		<!-- Search and Filters -->
		<Card>
			<CardContent class="p-6">
				<div class="flex items-center gap-4">
					<div class="relative flex-1">
						<Search
							class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							placeholder="Search articles by name, category, or description..."
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
					<CardTitle>Articles ({filteredArticles.length})</CardTitle>
					{#if error}
						<Badge variant="destructive">{error}</Badge>
					{/if}
				</div>
			</CardHeader>
			<CardContent class="p-0">
				{#if paginatedArticles.length === 0}
					<div class="flex flex-col items-center justify-center py-12 text-center">
						<Package class="mb-4 h-16 w-16 text-muted-foreground opacity-50" />
						<h3 class="text-lg font-semibold text-muted-foreground">No articles found</h3>
						<p class="text-sm text-muted-foreground">
							{searchQuery
								? 'Try adjusting your search terms'
								: 'Get started by creating your first article'}
						</p>
						{#if !searchQuery}
							<Button onclick={openAddModal} class="mt-4 gap-2">
								<Plus class="h-4 w-4" />
								Add Article
							</Button>
						{/if}
					</div>
				{:else}
					<Table>
						<TableHeader>
							<TableHead>Name</TableHead>
							<TableHead>Category</TableHead>
							<TableHead>Price</TableHead>
							<TableHead>Description</TableHead>
							<TableHead class="text-right">Actions</TableHead>
						</TableHeader>
						<TableBody>
							{#each paginatedArticles as article (article.id)}
								<TableRow class="group">
									<TableCell class="font-medium">
										<div class="flex items-center gap-3">
											<div class="rounded-lg bg-primary/10 p-2">
												{#if article.category.toLowerCase().includes('electronics')}
													<ShoppingCart class="h-4 w-4 text-primary" />
												{:else if article.category.toLowerCase().includes('clothing')}
													<Package class="h-4 w-4 text-primary" />
												{:else if article.category.toLowerCase().includes('books')}
													<Package class="h-4 w-4 text-primary" />
												{:else}
													<Tag class="h-4 w-4 text-primary" />
												{/if}
											</div>
											<div>
												<p class="font-semibold">{article.name}</p>
												<p class="text-xs text-muted-foreground">ID: {article.id}</p>
											</div>
										</div>
									</TableCell>
									<TableCell>
										<Badge variant="secondary">
											{article.category}
										</Badge>
									</TableCell>
									<TableCell>
										<div class="flex items-center gap-1">
											<span class="font-semibold">{formatCurrency(article.price)}</span>
										</div>
									</TableCell>
									<TableCell>
										<p class="max-w-xs truncate text-sm text-muted-foreground">
											{article.description || 'No description'}
										</p>
									</TableCell>
									<TableCell class="text-right">
										<div class="flex items-center justify-end gap-1">
											<Button
												variant="ghost"
												size="sm"
												onclick={() => openDetailsModal(article)}
												class="h-8 w-8 p-0"
											>
												<Eye class="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onclick={() => openEditModal(article)}
												class="h-8 w-8 p-0"
											>
												<Edit2 class="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onclick={() => openDeleteDialog(article.id)}
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
									filteredArticles.length
								)} of {filteredArticles.length} results
							</div>

							<Pagination.Root
								count={filteredArticles.length}
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

<!-- Article Details Modal -->
<Dialog.Root open={showDetailsModal} onOpenChange={(open) => !loading && (showDetailsModal = open)}>
	<Dialog.Content class="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-lg">
		<Dialog.Header class="flex-shrink-0">
			<Dialog.Title class="flex items-center gap-2">
				<Package class="h-5 w-5" />
				Article Details
			</Dialog.Title>
		</Dialog.Header>
		{#if selectedArticle}
			<div class="flex-1 space-y-4 overflow-y-auto pr-2">
				<div class="flex items-center gap-3">
					<div class="rounded-lg bg-primary/10 p-3">
						{#if selectedArticle.category.toLowerCase().includes('electronics')}
							<ShoppingCart class="h-6 w-6 text-primary" />
						{:else if selectedArticle.category.toLowerCase().includes('clothing')}
							<Package class="h-6 w-6 text-primary" />
						{:else if selectedArticle.category.toLowerCase().includes('books')}
							<Package class="h-6 w-6 text-primary" />
						{:else}
							<Tag class="h-6 w-6 text-primary" />
						{/if}
					</div>
					<div>
						<h3 class="text-lg font-semibold">{selectedArticle.name}</h3>
						<p class="text-sm text-muted-foreground">ID: {selectedArticle.id}</p>
					</div>
				</div>

				<Separator />

				<div class="grid grid-cols-2 gap-4">
					<div>
						<Label class="text-sm font-medium text-muted-foreground">Category</Label>
						<Badge variant="secondary" class="mt-1">
							{selectedArticle.category}
						</Badge>
					</div>
					<div>
						<Label class="text-sm font-medium text-muted-foreground">Price</Label>
						<p class="text-lg font-semibold">{formatCurrency(selectedArticle.price)}</p>
					</div>
				</div>

				{#if selectedArticle.description}
					<div>
						<Label class="text-sm font-medium text-muted-foreground">Description</Label>
						<p class="mt-1 text-sm">{selectedArticle.description}</p>
					</div>
				{/if}
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<!-- Add Article Modal -->
<Dialog.Root open={showAddModal} onOpenChange={(open) => !loading && (showAddModal = open)}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Plus class="h-5 w-5" />
				Add New Article
			</Dialog.Title>
			<Dialog.Description>Create a new article for your catalog.</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/create"
			use:enhance={({ formData, cancel }) => {
				if (!validateForm()) {
					cancel();
					return;
				}
				loading = true;
				return async ({ result }) => {
					await applyAction(result);
					handleCreateResult(result);
				};
			}}
		>
			<div class="space-y-4">
				<div>
					<Label for="name">Name *</Label>
					<Input
						id="name"
						name="name"
						required
						bind:value={formState.name}
						disabled={loading}
						placeholder="Enter article name"
						class={formState.errors.name ? 'border-red-500' : ''}
					/>
					{#if formState.errors.name}
						<p class="mt-1 text-xs text-red-600">{formState.errors.name}</p>
					{/if}
				</div>
				<div>
					<Label for="description">Description</Label>
					<Input
						id="description"
						name="description"
						bind:value={formState.description}
						disabled={loading}
						placeholder="Enter article description"
					/>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<Label for="category">Category *</Label>
						<Input
							id="category"
							name="category"
							required
							bind:value={formState.category}
							disabled={loading}
							placeholder="e.g., Electronics, Clothing, Books"
							class={formState.errors.category ? 'border-red-500' : ''}
						/>
						{#if formState.errors.category}
							<p class="mt-1 text-xs text-red-600">{formState.errors.category}</p>
						{/if}
					</div>
					<div>
						<Label for="price">Price *</Label>
						<Input
							id="price"
							name="price"
							type="number"
							step="0.01"
							min="0"
							required
							bind:value={formState.price}
							disabled={loading}
							placeholder="0.00"
							class={formState.errors.price ? 'border-red-500' : ''}
						/>
						{#if formState.errors.price}
							<p class="mt-1 text-xs text-red-600">{formState.errors.price}</p>
						{/if}
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
					{loading ? 'Creating...' : 'Create Article'}
				</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Edit Article Modal -->
<Dialog.Root open={showEditModal} onOpenChange={(open) => !loading && (showEditModal = open)}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Edit2 class="h-5 w-5" />
				Edit Article
			</Dialog.Title>
			<Dialog.Description>Update the article information.</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/update"
			use:enhance={({ formData, cancel }) => {
				if (!validateForm()) {
					cancel();
					return;
				}
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
					<Label for="edit-name">Name *</Label>
					<Input
						id="edit-name"
						name="name"
						required
						bind:value={formState.name}
						disabled={loading}
						placeholder="Enter article name"
						class={formState.errors.name ? 'border-red-500' : ''}
					/>
					{#if formState.errors.name}
						<p class="mt-1 text-xs text-red-600">{formState.errors.name}</p>
					{/if}
				</div>
				<div>
					<Label for="edit-description">Description</Label>
					<Input
						id="edit-description"
						name="description"
						bind:value={formState.description}
						disabled={loading}
						placeholder="Enter article description"
					/>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<Label for="edit-category">Category *</Label>
						<Input
							id="edit-category"
							name="category"
							required
							bind:value={formState.category}
							disabled={loading}
							placeholder="e.g., Electronics, Clothing, Books"
							class={formState.errors.category ? 'border-red-500' : ''}
						/>
						{#if formState.errors.category}
							<p class="mt-1 text-xs text-red-600">{formState.errors.category}</p>
						{/if}
					</div>
					<div>
						<Label for="edit-price">Price *</Label>
						<Input
							id="edit-price"
							name="price"
							type="number"
							step="0.01"
							min="0"
							required
							bind:value={formState.price}
							disabled={loading}
							placeholder="0.00"
							class={formState.errors.price ? 'border-red-500' : ''}
						/>
						{#if formState.errors.price}
							<p class="mt-1 text-xs text-red-600">{formState.errors.price}</p>
						{/if}
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
					{loading ? 'Updating...' : 'Update Article'}
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
				Delete Article
			</AlertDialog.Title>
			<AlertDialog.Description>
				Are you sure you want to delete this article? This action cannot be undone.
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
				<input type="hidden" name="id" value={deleteArticleId} />
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
					Delete Article
				</AlertDialog.Action>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
