<script lang="ts">
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
	import * as Pagination from '$lib/components/ui/pagination/index.js';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { Progress } from '$lib/components/ui/progress';
	import { toast } from 'svelte-sonner';
	import {
		Search,
		Plus,
		CreditCard,
		DollarSign,
		Receipt,
		CheckCircle,
		XCircle,
		Eye,
		Clock,
		TrendingUp,
		Users,
		Calendar,
		Activity,
		BarChart3,
		PieChart,
		ArrowUpRight,
		ArrowDownRight
	} from 'lucide-svelte';

	let { data } = $props();
	let transactions = $state(data.transactions || []);
	let error = data.error;

	// Search and pagination
	let searchQuery = $state('');
	let currentPage = $state(1);
	let itemsPerPage = $state(10);
	let selectedTimeframe = $state('all');
	let selectedStatus = $state('all');

	// Advanced filtering
	let filteredTransactions = $derived(
		transactions.filter((transaction: Transaction) => {
			// Text search
			const matchesSearch =
				transaction.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				transaction.authorizationCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				transaction.pan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				transaction.amount?.toString().includes(searchQuery);

			// Status filter
			const matchesStatus =
				selectedStatus === 'all' ||
				(selectedStatus === 'approved' && transaction.responseCode === '00') ||
				(selectedStatus === 'declined' &&
					transaction.responseCode &&
					transaction.responseCode !== '00') ||
				(selectedStatus === 'pending' && !transaction.responseCode);

			// Time filter
			const matchesTime = (() => {
				if (selectedTimeframe === 'all') return true;
				const transactionDate = new Date(transaction.timestamp);
				const now = new Date();
				const daysAgo = new Date();

				switch (selectedTimeframe) {
					case '24h':
						daysAgo.setDate(now.getDate() - 1);
						return transactionDate >= daysAgo;
					case '7d':
						daysAgo.setDate(now.getDate() - 7);
						return transactionDate >= daysAgo;
					case '30d':
						daysAgo.setDate(now.getDate() - 30);
						return transactionDate >= daysAgo;
					case '90d':
						daysAgo.setDate(now.getDate() - 90);
						return transactionDate >= daysAgo;
					default:
						return true;
				}
			})();

			return matchesSearch && matchesStatus && matchesTime;
		})
	);

	// Advanced analytics
	let analytics = $derived(() => {
		const now = new Date();
		const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
		const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

		// Filter transactions by time periods
		const todaysTransactions = transactions.filter(
			(t: Transaction) => new Date(t.timestamp) >= yesterday
		);
		const weekTransactions = transactions.filter(
			(t: Transaction) => new Date(t.timestamp) >= weekAgo
		);
		const monthTransactions = transactions.filter(
			(t: Transaction) => new Date(t.timestamp) >= monthAgo
		);

		const approved = transactions.filter((t: Transaction) => t.responseCode === '00');
		const declined = transactions.filter(
			(t: Transaction) => t.responseCode && t.responseCode !== '00'
		);
		const pending = transactions.filter((t: Transaction) => !t.responseCode);

		const totalRevenue = approved.reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);
		const todaysRevenue = todaysTransactions
			.filter((t: Transaction) => t.responseCode === '00')
			.reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);
		const weekRevenue = weekTransactions
			.filter((t: Transaction) => t.responseCode === '00')
			.reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);
		const monthRevenue = monthTransactions
			.filter((t: Transaction) => t.responseCode === '00')
			.reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);

		// Success rates
		const totalProcessed = approved.length + declined.length;
		const successRate = totalProcessed > 0 ? (approved.length / totalProcessed) * 100 : 0;
		const dailySuccessRate =
			todaysTransactions.length > 0
				? (todaysTransactions.filter((t: Transaction) => t.responseCode === '00').length /
						todaysTransactions.filter((t: Transaction) => t.responseCode).length) *
					100
				: 0;

		// Average transaction value
		const avgTransactionValue = approved.length > 0 ? totalRevenue / approved.length : 0;
		const todaysAvgValue =
			todaysTransactions.filter((t: Transaction) => t.responseCode === '00').length > 0
				? todaysRevenue /
					todaysTransactions.filter((t: Transaction) => t.responseCode === '00').length
				: 0;


		// Daily transaction trends (last 7 days)
		const dailyTrends = [];
		for (let i = 6; i >= 0; i--) {
			const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
			const dayStart = new Date(date.setHours(0, 0, 0, 0));
			const dayEnd = new Date(date.setHours(23, 59, 59, 999));

			const dayTransactions = transactions.filter((t: Transaction) => {
				const transactionDate = new Date(t.timestamp);
				return transactionDate >= dayStart && transactionDate <= dayEnd;
			});

			const dayApproved = dayTransactions.filter((t: Transaction) => t.responseCode === '00');
			const dayRevenue = dayApproved.reduce(
				(sum: number, t: Transaction) => sum + (t.amount || 0),
				0
			);

			dailyTrends.push({
				date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
				transactions: dayTransactions.length,
				approved: dayApproved.length,
				revenue: dayRevenue
			});
		}

		// Top performing hours
		const hourlyData = transactions.reduce(
			(acc: Record<number, number>, t: Transaction) => {
				const hour = new Date(t.timestamp).getHours();
				acc[hour] = (acc[hour] || 0) + 1;
				return acc;
			},
			{} as Record<number, number>
		);

		const peakHour =
			Object.entries(hourlyData).reduce((a, b) =>
				hourlyData[Number(a[0])] > hourlyData[Number(b[0])] ? a : b
			)?.[0] || '0';

		return {
			total: transactions.length,
			approved: approved.length,
			declined: declined.length,
			pending: pending.length,
			totalRevenue,
			todaysRevenue,
			weekRevenue,
			monthRevenue,
			successRate,
			dailySuccessRate,
			avgTransactionValue,
			todaysAvgValue,
			dailyTrends,
			peakHour: parseInt(peakHour),
			todaysTransactions: todaysTransactions.length,
			weekTransactions: weekTransactions.length,
			monthTransactions: monthTransactions.length,
			hourlyData
		};
	});

	let transactionAnalytics = $derived(analytics());

	let totalPages = $derived(Math.ceil(filteredTransactions.length / itemsPerPage));
	let paginatedTransactions = $derived(
		filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
	);

	$effect(() => {
		searchQuery;
		selectedTimeframe;
		selectedStatus;
		currentPage = 1;
	});

	// Modal states
	let showAddModal = $state(false);
	let showEditModal = $state(false);
	let showDeleteDialog = $state(false);
	let showDetailsModal = $state(false);
	let selectedTransaction = $state<Transaction | null>(null);
	let deleteTransactionId = $state('');
	let loading = $state(false);

	type FormErrors = {
		amount?: string;
		referenceNumber?: string;
		authorizationCode?: string;
		responseCode?: string;
		pan?: string;
		userId?: string;
		[key: string]: string | undefined;
	};

	let formState = $state({
		id: '',
		amount: 0,
		referenceNumber: '',
		authorizationCode: '',
		responseCode: '',
		pan: '',
		userId: 0,
		errors: {} as FormErrors
	});

	function formatAmount(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
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

	function getStatusColor(
		responseCode?: string
	): 'secondary' | 'default' | 'destructive' | 'outline' {
		if (!responseCode) return 'secondary';
		return responseCode === '00' ? 'default' : 'destructive';
	}

	function getStatusText(responseCode?: string): string {
		if (!responseCode) return 'Pending';
		return responseCode === '00' ? 'Approved' : 'Declined';
	}


	function openDetailsModal(transaction: Transaction) {
		selectedTransaction = transaction;
		showDetailsModal = true;
	}

	function closeModals() {
		showAddModal = false;
		showEditModal = false;
		showDeleteDialog = false;
		showDetailsModal = false;
		formState.errors = {};
		selectedTransaction = null;
	}

	function handleCreateResult(result: any) {
		loading = false;

		if (result.type === 'success' && result.data?.success) {
			toast.success('Transaction created successfully!');
			if (result.data.data) {
				transactions = [...transactions, result.data.data];
			}
			closeModals();
		} else if (result.type === 'failure' && result.data) {
			formState.errors = result.data.errors || {};
			if (result.data.error) {
				toast.error(result.data.error);
			}
			if (result.data.amount !== undefined) formState.amount = Number(result.data.amount);
			if (result.data.referenceNumber !== undefined)
				formState.referenceNumber = result.data.referenceNumber;
			if (result.data.authorizationCode !== undefined)
				formState.authorizationCode = result.data.authorizationCode;
			if (result.data.responseCode !== undefined) formState.responseCode = result.data.responseCode;
			if (result.data.pan !== undefined) formState.pan = result.data.pan;
			if (result.data.userId !== undefined) formState.userId = Number(result.data.userId);
		}
	}

	function handleUpdateResult(result: any) {
		loading = false;

		if (result.type === 'success' && result.data?.success) {
			toast.success('Transaction updated successfully!');
			if (result.data.data && selectedTransaction) {
				const updatedTransaction = result.data.data;
				transactions = transactions.map((t: Transaction) =>
					t.id === selectedTransaction!.id ? updatedTransaction : t
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
			toast.success('Transaction deleted successfully!');
			if (result.data.deletedTransactionId) {
				transactions = transactions.filter(
					(t: Transaction) => t.id?.toString() !== result.data.deletedTransactionId
				);
			}
			closeModals();
		} else if (result.type === 'failure' && result.data) {
			if (result.data.error) {
				toast.error(result.data.error);
			}
		}
	}

	// Update transactions when new data comes from the server
	$effect(() => {
		if (data.transactions) {
			transactions = data.transactions;
		}
	});
</script>

<Toaster position="top-center" richColors />

<div class="container mx-auto space-y-6 p-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<div class="rounded-lg bg-primary/10 p-2">
				<BarChart3 class="h-6 w-6 text-primary" />
			</div>
			<div>
				<h1 class="text-3xl font-bold tracking-tight">Transactions </h1>
				<p class="text-muted-foreground">
					Comprehensive transaction insights
				</p>
			</div>
		</div>
	</div>

	<!-- Enhanced Stats Cards -->
	<div class="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
		<Card class="border-l-4 border-l-blue-500">
			<CardContent class="p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-muted-foreground">Total Revenue</p>
						<p class="text-2xl font-bold">{formatAmount(transactionAnalytics.totalRevenue)}</p>
						<div class="flex items-center gap-1 text-xs text-green-600">
							<TrendingUp class="h-3 w-3" />
							<span
								>+{(
									(transactionAnalytics.monthRevenue / transactionAnalytics.totalRevenue) *
									100
								).toFixed(1)}% this month</span
							>
						</div>
					</div>
					<div class="rounded-full bg-blue-500/10 p-3">
						<DollarSign class="h-6 w-6 text-blue-600" />
					</div>
				</div>
			</CardContent>
		</Card>

		<Card class="border-l-4 border-l-green-500">
			<CardContent class="p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-muted-foreground">Success Rate</p>
						<p class="text-2xl font-bold">{transactionAnalytics.successRate.toFixed(1)}%</p>
						<div class="mt-2">
							<Progress value={transactionAnalytics.successRate} class="h-1" />
						</div>
					</div>
					<div class="rounded-full bg-green-500/10 p-3">
						<CheckCircle class="h-6 w-6 text-green-600" />
					</div>
				</div>
			</CardContent>
		</Card>

		<Card class="border-l-4 border-l-orange-500">
			<CardContent class="p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-muted-foreground">Avg Transaction</p>
						<p class="text-2xl font-bold">
							{formatAmount(transactionAnalytics.avgTransactionValue)}
						</p>
						<div class="flex items-center gap-1 text-xs text-orange-600">
							<Activity class="h-3 w-3" />
							<span>Today: {formatAmount(transactionAnalytics.todaysAvgValue)}</span>
						</div>
					</div>
					<div class="rounded-full bg-orange-500/10 p-3">
						<Receipt class="h-6 w-6 text-orange-600" />
					</div>
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Time-based Performance Metrics -->
	<div class="grid gap-4 md:grid-cols-3">
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Calendar class="h-5 w-5" />
					Today's Performance
				</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">Transactions</span>
					<span class="font-semibold">{transactionAnalytics.todaysTransactions}</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">Revenue</span>
					<span class="font-semibold text-green-600"
						>{formatAmount(transactionAnalytics.todaysRevenue)}</span
					>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">Success Rate</span>
					<span class="font-semibold">{transactionAnalytics.dailySuccessRate.toFixed(1)}%</span>
				</div>
				<Progress value={transactionAnalytics.dailySuccessRate} class="h-2" />
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Activity class="h-5 w-5" />
					Weekly Trends
				</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">Transactions</span>
					<span class="font-semibold">{transactionAnalytics.weekTransactions}</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">Revenue</span>
					<span class="font-semibold text-green-600"
						>{formatAmount(transactionAnalytics.weekRevenue)}</span
					>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">Avg Daily</span>
					<span class="font-semibold">{Math.round(transactionAnalytics.weekTransactions / 7)}</span>
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<TrendingUp class="h-5 w-5" />
					Monthly Overview
				</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">Transactions</span>
					<span class="font-semibold">{transactionAnalytics.monthTransactions}</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">Revenue</span>
					<span class="font-semibold text-green-600"
						>{formatAmount(transactionAnalytics.monthRevenue)}</span
					>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">Avg Daily</span>
					<span class="font-semibold"
						>{Math.round(transactionAnalytics.monthTransactions / 30)}</span
					>
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Status Breakdown -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<PieChart class="h-5 w-5" />
				Transaction Status Breakdown
			</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="grid gap-4 md:grid-cols-3">
				<div class="flex items-center justify-between rounded-lg bg-green-500/10 p-4">
					<div class="flex items-center gap-3">
						<div class="rounded-full bg-green-500 p-2">
							<CheckCircle class="h-4 w-4 text-white" />
						</div>
						<div>
							<p class="font-semibold text-green-700">Approved</p>
							<p class="text-sm text-green-600">
								{((transactionAnalytics.approved / transactionAnalytics.total) * 100).toFixed(1)}%
								of total
							</p>
						</div>
					</div>
					<p class="text-2xl font-bold text-green-700">{transactionAnalytics.approved}</p>
				</div>

				<div class="flex items-center justify-between rounded-lg bg-red-500/10 p-4">
					<div class="flex items-center gap-3">
						<div class="rounded-full bg-red-500 p-2">
							<XCircle class="h-4 w-4 text-white" />
						</div>
						<div>
							<p class="font-semibold text-red-700">Declined</p>
							<p class="text-sm text-red-600">
								{((transactionAnalytics.declined / transactionAnalytics.total) * 100).toFixed(1)}%
								of total
							</p>
						</div>
					</div>
					<p class="text-2xl font-bold text-red-700">{transactionAnalytics.declined}</p>
				</div>

				<div class="flex items-center justify-between rounded-lg bg-yellow-500/10 p-4">
					<div class="flex items-center gap-3">
						<div class="rounded-full bg-yellow-500 p-2">
							<Clock class="h-4 w-4 text-white" />
						</div>
						<div>
							<p class="font-semibold text-yellow-700">Pending</p>
							<p class="text-sm text-yellow-600">
								{((transactionAnalytics.pending / transactionAnalytics.total) * 100).toFixed(1)}% of
								total
							</p>
						</div>
					</div>
					<p class="text-2xl font-bold text-yellow-700">{transactionAnalytics.pending}</p>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Daily Trends -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<BarChart3 class="h-5 w-5" />
				7-Day Transaction Trends
			</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="grid gap-2 md:grid-cols-7">
				{#each transactionAnalytics.dailyTrends as trend, index}
					<div class="rounded-lg bg-muted p-4 text-center">
						<p class="text-sm font-semibold">{trend.date}</p>
						<Separator class="my-2" />
						<div class="space-y-1 text-xs">
							<div class="flex justify-between">
								<span class="text-muted-foreground">Total</span>
								<span class="font-medium">{trend.transactions}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-green-600">Approved</span>
								<span class="font-medium text-green-600">{trend.approved}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-muted-foreground">Revenue</span>
								<span class="font-medium">{formatAmount(trend.revenue)}</span>
							</div>
						</div>
						{#if index > 0}
							{@const prevTrend = transactionAnalytics.dailyTrends[index - 1]}
							{@const change = trend.transactions - prevTrend.transactions}
							{#if change > 0}
								<div class="mt-2 flex items-center justify-center gap-1 text-xs text-green-600">
									<ArrowUpRight class="h-3 w-3" />
									<span>+{change}</span>
								</div>
							{:else if change < 0}
								<div class="mt-2 flex items-center justify-center gap-1 text-xs text-red-600">
									<ArrowDownRight class="h-3 w-3" />
									<span>{change}</span>
								</div>
							{:else}
								<div class="mt-2 text-xs text-muted-foreground">No change</div>
							{/if}
						{/if}
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>

	<!-- Payment Methods & Peak Hours -->
	<div class="grid gap-4 md:grid-cols-1">

		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Clock class="h-5 w-5" />
					Peak Performance
				</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="rounded-lg bg-primary/10 p-4 text-center">
					<div class="text-2xl font-bold text-primary">{transactionAnalytics.peakHour}:00</div>
					<p class="text-sm text-muted-foreground">Peak Transaction Hour</p>
					<p class="text-xs text-muted-foreground">
						{transactionAnalytics.hourlyData[transactionAnalytics.peakHour] || 0} transactions
					</p>
				</div>
				<div class="grid grid-cols-3 gap-2 text-center text-xs">
					<div>
						<p class="font-semibold">Morning</p>
						<p class="text-muted-foreground">6-12</p>
						<p class="font-medium">
							{Object.entries(transactionAnalytics.hourlyData)
								.filter(([hour]) => parseInt(hour) >= 6 && parseInt(hour) < 12)
								.reduce((sum, [, count]) => sum + (count as number), 0)}
						</p>
					</div>
					<div>
						<p class="font-semibold">Afternoon</p>
						<p class="text-muted-foreground">12-18</p>
						<p class="font-medium">
							{Object.entries(transactionAnalytics.hourlyData)
								.filter(([hour]) => parseInt(hour) >= 12 && parseInt(hour) < 18)
								.reduce((sum, [, count]) => sum + (count as number), 0)}
						</p>
					</div>
					<div>
						<p class="font-semibold">Evening</p>
						<p class="text-muted-foreground">18-24</p>
						<p class="font-medium">
							{Object.entries(transactionAnalytics.hourlyData)
								.filter(([hour]) => parseInt(hour) >= 18)
								.reduce((sum, [, count]) => sum + (count as number), 0)}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Advanced Filters -->
	<Card>
		<CardContent class="p-6">
			<div class="flex flex-wrap items-center gap-4">
				<div class="relative min-w-64 flex-1">
					<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search transactions by reference number, auth code, PAN, or amount..."
						bind:value={searchQuery}
						class="pl-10"
					/>
				</div>
				<Separator orientation="vertical" class="h-10" />
				<div class="flex items-center gap-2">
					<Label class="text-sm">Status:</Label>
					<select bind:value={selectedStatus} class="bg-transparent rounded border px-3 py-1 text-sm">
						<option value="all">All</option>
						<option value="approved">Approved</option>
						<option value="declined">Declined</option>
						<option value="pending">Pending</option>
					</select>
				</div>
				<div class="flex items-center gap-2">
					<Label class="text-sm">Timeframe:</Label>
					<select bind:value={selectedTimeframe} class="bg-transparent rounded border px-3 py-1 text-sm">
						<option value="all">All Time</option>
						<option value="24h">Last 24 Hours</option>
						<option value="7d">Last 7 Days</option>
						<option value="30d">Last 30 Days</option>
						<option value="90d">Last 90 Days</option>
					</select>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Transaction Table -->
	<Card>
		<CardHeader>
			<div class="flex items-center justify-between">
				<CardTitle>Transactions ({filteredTransactions.length})</CardTitle>
				{#if error}
					<Badge variant="destructive">{error}</Badge>
				{/if}
			</div>
		</CardHeader>
		<CardContent class="p-0">
			{#if paginatedTransactions.length === 0}
				<div class="flex flex-col items-center justify-center py-12 text-center">
					<BarChart3 class="mb-4 h-16 w-16 text-muted-foreground opacity-50" />
					<h3 class="text-lg font-semibold text-muted-foreground">No transactions found</h3>
					<p class="text-sm text-muted-foreground">
						{searchQuery || selectedStatus !== 'all' || selectedTimeframe !== 'all'
							? 'Try adjusting your filters'
							: 'Get started by processing your first transaction'}
					</p>
				</div>
			{:else}
				<Table>
					<TableHeader>
						<TableHead>Reference</TableHead>
						<TableHead>Amount</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Date</TableHead>
						<TableHead>User</TableHead>
						<TableHead>Auth Code</TableHead>
						<TableHead class="text-right">Actions</TableHead>
					</TableHeader>
					<TableBody>
						{#each paginatedTransactions as transaction (transaction.id)}
							<TableRow class="group hover:bg-muted/50">
								<TableCell class="font-medium">
									<div class="flex items-center gap-3">
										<div class="rounded-lg bg-primary/10 p-2">
											<Receipt class="h-4 w-4 text-primary" />
										</div>
										<div>
											<p class="font-semibold">{transaction.referenceNumber}</p>
											<p class="text-xs text-muted-foreground">ID: {transaction.id}</p>
										</div>
									</div>
								</TableCell>
								<TableCell>
									<div class="flex items-center gap-1">
										<span class="font-semibold">{formatAmount(transaction.amount || 0)}</span>
									</div>
								</TableCell>
								<TableCell>
									<Badge variant={getStatusColor(transaction.responseCode)}>
										{getStatusText(transaction.responseCode)}
									</Badge>
								</TableCell>
								<TableCell>
									<div class="flex items-center gap-1">
										<Clock class="h-4 w-4 text-muted-foreground" />
										<span class="text-sm">{formatDate(transaction.timestamp)}</span>
									</div>
								</TableCell>
								<TableCell>
									<Badge variant="outline">
										User #{transaction.userId}
									</Badge>
								</TableCell>
								<TableCell>
									<span class="font-mono text-sm">
										{transaction.authorizationCode || 'N/A'}
									</span>
								</TableCell>
								<TableCell class="text-right">
									<div class="flex items-center justify-end gap-1">
										<Button
											variant="ghost"
											size="sm"
											onclick={() => openDetailsModal(transaction)}
											class="h-8 w-8 p-0"
										>
											<Eye class="h-4 w-4" />
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
								filteredTransactions.length
							)} of {filteredTransactions.length} results
						</div>

						<Pagination.Root
							count={filteredTransactions.length}
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

<!-- Enhanced Transaction Details Modal -->
<Dialog.Root open={showDetailsModal} onOpenChange={(open) => !loading && (showDetailsModal = open)}>
	<Dialog.Content class="sm:max-w-2xl">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Receipt class="h-5 w-5" />
				Transaction Details
			</Dialog.Title>
		</Dialog.Header>
		{#if selectedTransaction}
			<div class="space-y-6">
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-semibold">{selectedTransaction.referenceNumber}</h3>
					<Badge variant={getStatusColor(selectedTransaction.responseCode)} class="text-sm">
						{getStatusText(selectedTransaction.responseCode)}
					</Badge>
				</div>

				<Separator />

				<div class="grid grid-cols-2 gap-6 text-sm">
					<div class="space-y-4">
						<div>
							<p class="mb-1 font-medium text-muted-foreground">Transaction ID</p>
							<p class="font-mono">{selectedTransaction.id}</p>
						</div>
						<div>
							<p class="mb-1 font-medium text-muted-foreground">Amount</p>
							<p class="text-xl font-bold text-green-600">
								{formatAmount(selectedTransaction.amount || 0)}
							</p>
						</div>
						<div>
							<p class="mb-1 font-medium text-muted-foreground">User</p>
							<Badge variant="outline" class="text-sm">
								User #{selectedTransaction.userId}
							</Badge>
						</div>
					</div>

					<div class="space-y-4">
						<div>
							<p class="mb-1 font-medium text-muted-foreground">Date & Time</p>
							<p>{formatDate(selectedTransaction.timestamp)}</p>
						</div>
						<div>
							<p class="mb-1 font-medium text-muted-foreground">Authorization Code</p>
							<p class="font-mono">{selectedTransaction.authorizationCode || 'N/A'}</p>
						</div>
						<div>
							<p class="mb-1 font-medium text-muted-foreground">Response Code</p>
							<p class="font-mono">{selectedTransaction.responseCode || 'N/A'}</p>
						</div>
					</div>
				</div>

				{#if selectedTransaction.pan}
					<Separator />
					<div>
						<p class="mb-2 font-medium text-muted-foreground">Payment Information</p>
						<div class="rounded-lg bg-muted p-4">
							<div class="flex items-center gap-2">
								<CreditCard class="h-4 w-4 text-muted-foreground" />
								<span class="font-mono">****-****-****-{selectedTransaction.pan.slice(-4)}</span>
							</div>
						</div>
					</div>
				{/if}

				{#if selectedTransaction.transactionItems && selectedTransaction.transactionItems.length > 0}
					<Separator />
					<div>
						<p class="mb-3 font-medium text-muted-foreground">Transaction Items</p>
						<div class="space-y-2">
							{#each selectedTransaction.transactionItems as item}
								<div class="flex items-center justify-between rounded-lg bg-muted p-3">
									<div>
										<p class="font-medium">{item.article.name}</p>
										<p class="text-sm text-muted-foreground">Qty: {item.quantity}</p>
									</div>
									<p class="font-semibold">{formatAmount(item.article.price * item.quantity)}</p>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
