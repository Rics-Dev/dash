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
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Calendar } from '$lib/components/ui/calendar';
	import { RangeCalendar } from '$lib/components/ui/range-calendar';
	import { toast } from 'svelte-sonner';
	import { Chart, Area, Axis, Bars, Tooltip } from 'layerchart';
	import { getLocalTimeZone } from '@internationalized/date';
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
		CalendarIcon,
		Activity,
		BarChart3,
		PieChart,
		ArrowUpRight,
		ArrowDownRight,
		Filter,
		Download,
		Zap,
		Target,
		TrendingDown
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

	// Date range selection
	let dateRangeStart = $state<Date | undefined>(undefined);
	let dateRangeEnd = $state<Date | undefined>(undefined);
	let showDatePicker = $state(false);
	let calendarMode = $state<'single' | 'range'>('range');
	let customDateRange = $state<any>(undefined);

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

			// Custom date range filter
			const matchesDateRange = (() => {
				if (!dateRangeStart && !dateRangeEnd) return true;
				const transactionDate = new Date(transaction.timestamp);

				if (dateRangeStart && dateRangeEnd) {
					return transactionDate >= dateRangeStart && transactionDate <= dateRangeEnd;
				} else if (dateRangeStart) {
					return transactionDate >= dateRangeStart;
				} else if (dateRangeEnd) {
					return transactionDate <= dateRangeEnd;
				}
				return true;
			})();

			return matchesSearch && matchesStatus && matchesTime && matchesDateRange;
		})
	);

	// Advanced analytics
	let analytics = $derived(() => {
		const now = new Date();
		const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
		const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

		// Filter transactions by time periods (use filteredTransactions for date range)
		const baseTransactions = dateRangeStart || dateRangeEnd ? filteredTransactions : transactions;

		const todaysTransactions = baseTransactions.filter(
			(t: Transaction) => new Date(t.timestamp) >= yesterday
		);
		const weekTransactions = baseTransactions.filter(
			(t: Transaction) => new Date(t.timestamp) >= weekAgo
		);
		const monthTransactions = baseTransactions.filter(
			(t: Transaction) => new Date(t.timestamp) >= monthAgo
		);

		const approved = baseTransactions.filter((t: Transaction) => t.responseCode === '00');
		const declined = baseTransactions.filter(
			(t: Transaction) => t.responseCode && t.responseCode !== '00'
		);
		const pending = baseTransactions.filter((t: Transaction) => !t.responseCode);

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

		// Daily transaction trends (last 30 days for better charts)
		const dailyTrends = [];
		for (let i = 29; i >= 0; i--) {
			const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
			const dayStart = new Date(date.setHours(0, 0, 0, 0));
			const dayEnd = new Date(date.setHours(23, 59, 59, 999));

			const dayTransactions = baseTransactions.filter((t: Transaction) => {
				const transactionDate = new Date(t.timestamp);
				return transactionDate >= dayStart && transactionDate <= dayEnd;
			});

			const dayApproved = dayTransactions.filter((t: Transaction) => t.responseCode === '00');
			const dayDeclined = dayTransactions.filter(
				(t: Transaction) => t.responseCode && t.responseCode !== '00'
			);
			const dayRevenue = dayApproved.reduce(
				(sum: number, t: Transaction) => sum + (t.amount || 0),
				0
			);

			dailyTrends.push({
				date: dayStart.toISOString().split('T')[0],
				dateLabel: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
				transactions: dayTransactions.length,
				approved: dayApproved.length,
				declined: dayDeclined.length,
				revenue: dayRevenue,
				success_rate:
					dayTransactions.length > 0 ? (dayApproved.length / dayTransactions.length) * 100 : 0
			});
		}

		// Hourly distribution for heatmap
		const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
			hour,
			count: baseTransactions.filter((t: Transaction) => new Date(t.timestamp).getHours() === hour)
				.length,
			revenue: baseTransactions
				.filter(
					(t: Transaction) => new Date(t.timestamp).getHours() === hour && t.responseCode === '00'
				)
				.reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0)
		}));

		// Transaction amount distribution
		const amountRanges = [
			{ range: '0-1000 DZD', min: 0, max: 1000, count: 0 },
			{ range: '1000-5000 DZD', min: 1000, max: 5000, count: 0 },
			{ range: '5000-10000 DZD', min: 5000, max: 10000, count: 0 },
			{ range: '10000-50000 DZD', min: 10000, max: 50000, count: 0 },
			{ range: '50000+ DZD', min: 50000, max: Infinity, count: 0 }
		];

		approved.forEach((t: Transaction) => {
			const amount = t.amount || 0;
			const range = amountRanges.find((r) => amount >= r.min && amount < r.max);
			if (range) range.count++;
		});

		// Top performing days of week
		const daysOfWeek = [
			'Sunday',
			'Monday',
			'Tuesday',
			'Wednesday',
			'Thursday',
			'Friday',
			'Saturday'
		];
		const weeklyData = daysOfWeek.map((day, index) => ({
			day,
			count: baseTransactions.filter((t: Transaction) => new Date(t.timestamp).getDay() === index)
				.length,
			revenue: baseTransactions
				.filter(
					(t: Transaction) => new Date(t.timestamp).getDay() === index && t.responseCode === '00'
				)
				.reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0)
		}));

		// Peak performance metrics
		const peakHour = hourlyData.reduce((max, current) =>
			current.count > max.count ? current : max
		);

		const peakDay = weeklyData.reduce((max, current) =>
			current.count > max.count ? current : max
		);

		// Growth calculations
		const lastWeekRevenue = baseTransactions
			.filter((t: Transaction) => {
				const date = new Date(t.timestamp);
				const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
				return date >= twoWeeksAgo && date < weekAgo && t.responseCode === '00';
			})
			.reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);

		const revenueGrowth =
			lastWeekRevenue > 0 ? ((weekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0;

		return {
			total: baseTransactions.length,
			approved: approved.length,
			declined: declined.length,
			pending: pending.length,
			totalRevenue,
			todaysRevenue,
			weekRevenue,
			monthRevenue,
			lastWeekRevenue,
			revenueGrowth,
			successRate,
			dailySuccessRate,
			avgTransactionValue,
			todaysAvgValue,
			dailyTrends,
			hourlyData,
			weeklyData,
			amountRanges,
			peakHour,
			peakDay,
			todaysTransactions: todaysTransactions.length,
			weekTransactions: weekTransactions.length,
			monthTransactions: monthTransactions.length
		};
	});

	let transactionAnalytics = $derived(analytics());

	let totalPages = $derived(Math.ceil(filteredTransactions.length / itemsPerPage));
	let paginatedTransactions = $derived(
		filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
	);

	$effect(() => {
		searchQuery;
		selectedStatus;
		dateRangeStart;
		dateRangeEnd;
		// When timeframe changes, clear custom date range if not custom
		if (selectedTimeframe !== 'custom') {
			dateRangeStart = undefined;
			dateRangeEnd = undefined;
		}
		currentPage = 1;
	});

	// Effect to set timeframe to custom when date range is selected
	$effect(() => {
		if ((dateRangeStart || dateRangeEnd) && selectedTimeframe !== 'custom') {
			selectedTimeframe = 'custom';
		}
	});

	// Date range helper functions
	function formatDateRange(): string {
		if (dateRangeStart && dateRangeEnd) {
			return `${dateRangeStart.toLocaleDateString()} - ${dateRangeEnd.toLocaleDateString()}`;
		} else if (dateRangeStart) {
			return `From ${dateRangeStart.toLocaleDateString()}`;
		} else if (dateRangeEnd) {
			return `Until ${dateRangeEnd.toLocaleDateString()}`;
		}
		return 'Select date range';
	}

	function clearDateRange() {
		dateRangeStart = undefined;
		dateRangeEnd = undefined;
		selectedTimeframe = 'all';
	}

	function setQuickDateRange(range: string) {
		const now = new Date();
		switch (range) {
			case 'today':
				dateRangeStart = new Date(now.setHours(0, 0, 0, 0));
				dateRangeEnd = new Date(now.setHours(23, 59, 59, 999));
				break;
			case 'yesterday':
				const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
				dateRangeStart = new Date(yesterday.setHours(0, 0, 0, 0));
				dateRangeEnd = new Date(yesterday.setHours(23, 59, 59, 999));
				break;
			case 'last7days':
				dateRangeStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
				dateRangeEnd = now;
				break;
			case 'last30days':
				dateRangeStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
				dateRangeEnd = now;
				break;
			case 'thisMonth':
				dateRangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
				dateRangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
				break;
		}
		selectedTimeframe = 'custom';
		showDatePicker = false;
	}

	// Export functionality
	function exportTransactions() {
		const dataToExport = filteredTransactions;
		const headers = [
			'ID',
			'Reference Number',
			'Amount',
			'Status',
			'Date',
			'User ID',
			'Auth Code',
			'PAN'
		];

		const csvContent = [
			headers.join(','),
			...dataToExport.map((transaction: Transaction) =>
				[
					transaction.id,
					transaction.referenceNumber,
					transaction.amount || 0,
					getStatusText(transaction.responseCode),
					new Date(transaction.timestamp).toISOString(),
					transaction.userId,
					transaction.authorizationCode || 'N/A',
					transaction.pan ? `****-****-****-${transaction.pan.slice(-4)}` : 'N/A'
				].join(',')
			)
		].join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		const url = URL.createObjectURL(blob);
		link.setAttribute('href', url);
		link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		toast.success(`Exported ${dataToExport.length} transactions to CSV`);
	}

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
		return new Intl.NumberFormat('ar-DZ', {
			style: 'currency',
			currency: 'DZD'
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
				<h1 class="text-3xl font-bold tracking-tight">Transactions Analytics</h1>
				<p class="text-muted-foreground">
					Comprehensive transaction insights and performance metrics
				</p>
			</div>
		</div>
		<div class="flex items-center gap-2">
			<Button variant="outline" size="sm" onclick={exportTransactions}>
				<Download class="mr-2 h-4 w-4" />
				Export
			</Button>
			<Popover.Root bind:open={showDatePicker}>
				<Popover.Trigger>
					<Button variant="outline" size="sm" class="min-w-[200px] justify-start">
						<CalendarIcon class="mr-2 h-4 w-4" />
						{formatDateRange()}
					</Button>
				</Popover.Trigger>
				<Popover.Content class="w-auto p-0" align="end">
					<div class="space-y-4 p-4">
						<div class="space-y-2">
							<p class="text-sm font-medium">Quick Select</p>
							<div class="grid grid-cols-2 gap-2">
								<Button variant="ghost" size="sm" onclick={() => setQuickDateRange('today')}>
									Today
								</Button>
								<Button variant="ghost" size="sm" onclick={() => setQuickDateRange('yesterday')}>
									Yesterday
								</Button>
								<Button variant="ghost" size="sm" onclick={() => setQuickDateRange('last7days')}>
									Last 7 days
								</Button>
								<Button variant="ghost" size="sm" onclick={() => setQuickDateRange('last30days')}>
									Last 30 days
								</Button>
								<Button variant="ghost" size="sm" onclick={() => setQuickDateRange('thisMonth')}>
									This month
								</Button>
								<Button variant="ghost" size="sm" onclick={clearDateRange}>Clear</Button>
							</div>
						</div>
						<Separator />
						<div class="space-y-2">
							<p class="text-sm font-medium">Custom Range</p>
							<RangeCalendar
								bind:value={customDateRange}
								onValueChange={(range) => {
									if (range?.start && range?.end) {
										dateRangeStart = range.start.toDate(getLocalTimeZone());
										dateRangeEnd = range.end.toDate(getLocalTimeZone());
									}
								}}
							/>
							<div class="flex gap-2">
								<Button size="sm" onclick={() => (showDatePicker = false)}>Apply</Button>
							</div>
						</div>
					</div>
				</Popover.Content>
			</Popover.Root>
		</div>
	</div>

	<!-- Enhanced Stats Cards -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
		<Card class="border-l-4 border-l-blue-500">
			<CardContent class="p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-muted-foreground">Total Revenue</p>
						<p class="text-2xl font-bold">{formatAmount(transactionAnalytics.totalRevenue)}</p>
						<div class="flex items-center gap-1 text-xs">
							{#if transactionAnalytics.revenueGrowth >= 0}
								<TrendingUp class="h-3 w-3 text-green-600" />
								<span class="text-green-600">+{transactionAnalytics.revenueGrowth.toFixed(1)}%</span
								>
							{:else}
								<TrendingDown class="h-3 w-3 text-red-600" />
								<span class="text-red-600">{transactionAnalytics.revenueGrowth.toFixed(1)}%</span>
							{/if}
							<span class="text-muted-foreground">vs last week</span>
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
							<Progress value={transactionAnalytics.successRate} class="h-2" />
						</div>
						<p class="mt-1 text-xs text-muted-foreground">
							Today: {transactionAnalytics.dailySuccessRate.toFixed(1)}%
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

		<Card class="border-l-4 border-l-purple-500">
			<CardContent class="p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-muted-foreground">Peak Performance</p>
						<p class="text-lg font-bold">{transactionAnalytics.peakDay.day}</p>
						<p class="text-sm text-purple-600">{transactionAnalytics.peakDay.count} transactions</p>
						<p class="text-xs text-muted-foreground">
							Best hour: {transactionAnalytics.peakHour.hour}:00
						</p>
					</div>
					<div class="rounded-full bg-purple-500/10 p-3">
						<Zap class="h-6 w-6 text-purple-600" />
					</div>
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Quick Performance Metrics -->
	<div class="grid gap-4 md:grid-cols-3">
		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="flex items-center gap-2 text-lg">
					<CalendarIcon class="h-4 w-4" />
					Today's Performance
				</CardTitle>
			</CardHeader>
			<CardContent class="space-y-3">
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
			<CardHeader class="pb-2">
				<CardTitle class="flex items-center gap-2 text-lg">
					<Activity class="h-4 w-4" />
					Weekly Summary
				</CardTitle>
			</CardHeader>
			<CardContent class="space-y-3">
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
					<span class="text-sm text-muted-foreground">Daily Average</span>
					<span class="font-semibold">{Math.round(transactionAnalytics.weekTransactions / 7)}</span>
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="flex items-center gap-2 text-lg">
					<TrendingUp class="h-4 w-4" />
					Monthly Overview
				</CardTitle>
			</CardHeader>
			<CardContent class="space-y-3">
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
					<span class="text-sm text-muted-foreground">Growth</span>
					<span
						class="font-semibold {transactionAnalytics.revenueGrowth >= 0
							? 'text-green-600'
							: 'text-red-600'}"
					>
						{transactionAnalytics.revenueGrowth >= 0
							? '+'
							: ''}{transactionAnalytics.revenueGrowth.toFixed(1)}%
					</span>
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

	<!-- Advanced Charts Section -->
	<div class="grid gap-4 lg:grid-cols-2">
		<!-- Revenue Trend Chart -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<TrendingUp class="h-5 w-5" />
					Revenue Trends (30 Days)
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-2">
					{#each transactionAnalytics.dailyTrends.slice(-7) as trend, index}
						{@const maxRevenue = Math.max(
							...transactionAnalytics.dailyTrends.map((t) => t.revenue)
						)}
						{@const heightPercentage = maxRevenue > 0 ? (trend.revenue / maxRevenue) * 100 : 0}
						<div class="flex items-center gap-3">
							<div class="w-16 text-xs text-muted-foreground">{trend.dateLabel}</div>
							<div class="flex-1">
								<div class="mb-1 flex items-center justify-between">
									<div
										class="h-6 rounded bg-gradient-to-r from-primary/20 to-primary/60"
										style="width: {heightPercentage}%"
									></div>
									<span class="ml-2 text-sm font-medium">{formatAmount(trend.revenue)}</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>

		<!-- Transaction Volume Chart -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<BarChart3 class="h-5 w-5" />
					Transaction Volume (Last 7 Days)
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-2">
					{#each transactionAnalytics.dailyTrends.slice(-7) as trend}
						{@const maxTransactions = Math.max(
							...transactionAnalytics.dailyTrends.map((t) => t.transactions)
						)}
						{@const approvedPercentage =
							maxTransactions > 0 ? (trend.approved / maxTransactions) * 100 : 0}
						{@const declinedPercentage =
							maxTransactions > 0 ? (trend.declined / maxTransactions) * 100 : 0}
						<div class="flex items-center gap-3">
							<div class="w-16 text-xs text-muted-foreground">{trend.dateLabel}</div>
							<div class="flex-1 space-y-1">
								<div class="flex items-center gap-1">
									<div class="h-3 rounded bg-green-500" style="width: {approvedPercentage}%"></div>
									<span class="text-xs text-green-600">{trend.approved}</span>
								</div>
								<div class="flex items-center gap-1">
									<div class="h-3 rounded bg-red-500" style="width: {declinedPercentage}%"></div>
									<span class="text-xs text-red-600">{trend.declined}</span>
								</div>
							</div>
							<div class="w-12 text-right text-xs">{trend.success_rate.toFixed(0)}%</div>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Hourly Performance Heatmap -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<Activity class="h-5 w-5" />
				24-Hour Performance Heatmap
			</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="grid grid-cols-12 gap-1">
				{#each transactionAnalytics.hourlyData as hour}
					{@const intensity = Math.min(
						hour.count / Math.max(...transactionAnalytics.hourlyData.map((h) => h.count)),
						1
					)}
					<div
						class="flex aspect-square items-center justify-center rounded-sm border text-xs font-medium transition-colors"
						style="background-color: hsl(var(--primary) / {intensity * 0.8}); color: {intensity >
						0.5
							? 'white'
							: 'hsl(var(--foreground))'}"
						title="{hour.hour}:00 - {hour.count} transactions, {formatAmount(hour.revenue)} revenue"
					>
						{hour.hour}
					</div>
				{/each}
			</div>
			<div class="mt-4 flex items-center justify-between text-sm text-muted-foreground">
				<span>12 AM</span>
				<span
					>Peak: {transactionAnalytics.peakHour.hour}:00 ({transactionAnalytics.peakHour.count} transactions)</span
				>
				<span>11 PM</span>
			</div>
		</CardContent>
	</Card>

	<!-- Weekly Performance and Amount Distribution -->
	<div class="grid gap-4 lg:grid-cols-2">
		<!-- Weekly Performance -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<CalendarIcon class="h-5 w-5" />
					Weekly Performance
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-3">
					{#each transactionAnalytics.weeklyData as day}
						{@const maxCount = Math.max(...transactionAnalytics.weeklyData.map((d) => d.count))}
						{@const percentage = maxCount > 0 ? (day.count / maxCount) * 100 : 0}
						<div class="flex items-center justify-between">
							<div class="flex-1">
								<div class="mb-1 flex items-center justify-between">
									<span class="text-sm font-medium">{day.day}</span>
									<span class="text-sm text-muted-foreground">{day.count} transactions</span>
								</div>
								<Progress value={percentage} class="h-2" />
								<div class="mt-1 text-xs text-muted-foreground">
									{formatAmount(day.revenue)} revenue
								</div>
							</div>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>

		<!-- Amount Distribution -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<PieChart class="h-5 w-5" />
					Transaction Amount Distribution
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-3">
					{#each transactionAnalytics.amountRanges as range}
						{@const maxCount = Math.max(...transactionAnalytics.amountRanges.map((r) => r.count))}
						{@const percentage = maxCount > 0 ? (range.count / maxCount) * 100 : 0}
						{@const totalTransactions = transactionAnalytics.approved}
						{@const sharePercentage =
							totalTransactions > 0 ? (range.count / totalTransactions) * 100 : 0}
						<div class="flex items-center justify-between">
							<div class="flex-1">
								<div class="mb-1 flex items-center justify-between">
									<span class="text-sm font-medium">{range.range}</span>
									<span class="text-sm text-muted-foreground"
										>{range.count} ({sharePercentage.toFixed(1)}%)</span
									>
								</div>
								<Progress value={percentage} class="h-2" />
							</div>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>
	</div>

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
					<div class="text-2xl font-bold text-primary">{transactionAnalytics.peakHour.hour}:00</div>
					<p class="text-sm text-muted-foreground">Peak Transaction Hour</p>
					<p class="text-xs text-muted-foreground">
						{transactionAnalytics.peakHour.count || 0} transactions
					</p>
				</div>
				<div class="grid grid-cols-3 gap-2 text-center text-xs">
					<div>
						<p class="font-semibold">Morning</p>
						<p class="text-muted-foreground">6-12</p>
						<p class="font-medium">
							{transactionAnalytics.hourlyData
								.filter((data) => data.hour >= 6 && data.hour < 12)
								.reduce((sum, data) => sum + data.count, 0)}
						</p>
					</div>
					<div>
						<p class="font-semibold">Afternoon</p>
						<p class="text-muted-foreground">12-18</p>
						<p class="font-medium">
							{transactionAnalytics.hourlyData
								.filter((data) => data.hour >= 12 && data.hour < 18)
								.reduce((sum, data) => sum + data.count, 0)}
						</p>
					</div>
					<div>
						<p class="font-semibold">Evening</p>
						<p class="text-muted-foreground">18-24</p>
						<p class="font-medium">
							{transactionAnalytics.hourlyData
								.filter((data) => data.hour >= 18)
								.reduce((sum, data) => sum + data.count, 0)}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Advanced Filters -->
	<Card>
		<CardContent class="p-6">
			<div class="space-y-4">
				<div class="flex flex-wrap items-center gap-4">
					<div class="relative min-w-64 flex-1">
						<Search
							class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							placeholder="Search transactions by reference number, auth code, PAN, or amount..."
							bind:value={searchQuery}
							class="pl-10"
						/>
					</div>
					<Separator orientation="vertical" class="h-10" />
					<div class="flex items-center gap-2">
						<Label class="text-sm">Status:</Label>
						<select
							bind:value={selectedStatus}
							class="rounded border bg-transparent px-3 py-1 text-sm"
						>
							<option value="all">All</option>
							<option value="approved">Approved</option>
							<option value="declined">Declined</option>
							<option value="pending">Pending</option>
						</select>
					</div>
					<div class="flex items-center gap-2">
						<Label class="text-sm">Timeframe:</Label>
						<select
							bind:value={selectedTimeframe}
							class="rounded border bg-transparent px-3 py-1 text-sm"
						>
							<option value="all">All Time</option>
							<option value="24h">Last 24 Hours</option>
							<option value="7d">Last 7 Days</option>
							<option value="30d">Last 30 Days</option>
							<option value="90d">Last 90 Days</option>
							<option value="custom">Custom Range</option>
						</select>
					</div>
					<Button variant="outline" size="sm">
						<Filter class="mr-2 h-4 w-4" />
						Advanced
					</Button>
				</div>

				<!-- Active Filters Display -->
				{#if searchQuery || selectedStatus !== 'all' || selectedTimeframe !== 'all' || dateRangeStart || dateRangeEnd}
					<div class="flex flex-wrap items-center gap-2">
						<span class="text-sm text-muted-foreground">Active filters:</span>
						{#if searchQuery}
							<Badge variant="secondary" class="gap-1">
								Search: {searchQuery}
								<button
									onclick={() => (searchQuery = '')}
									class="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
								>
									<XCircle class="h-3 w-3" />
								</button>
							</Badge>
						{/if}
						{#if selectedStatus !== 'all'}
							<Badge variant="secondary" class="gap-1">
								Status: {selectedStatus}
								<button
									onclick={() => (selectedStatus = 'all')}
									class="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
								>
									<XCircle class="h-3 w-3" />
								</button>
							</Badge>
						{/if}
						{#if selectedTimeframe !== 'all'}
							<Badge variant="secondary" class="gap-1">
								Time: {selectedTimeframe === 'custom' ? formatDateRange() : selectedTimeframe}
								<button
									onclick={() => {
										selectedTimeframe = 'all';
										clearDateRange();
									}}
									class="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
								>
									<XCircle class="h-3 w-3" />
								</button>
							</Badge>
						{/if}
						<Button
							variant="ghost"
							size="sm"
							onclick={() => {
								searchQuery = '';
								selectedStatus = 'all';
								selectedTimeframe = 'all';
								clearDateRange();
							}}
							class="text-xs"
						>
							Clear all
						</Button>
					</div>
				{/if}
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
	<Dialog.Content class="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-2xl">
		<Dialog.Header class="flex-shrink-0">
			<Dialog.Title class="flex items-center gap-2">
				<Receipt class="h-5 w-5" />
				Transaction Details
			</Dialog.Title>
		</Dialog.Header>
		{#if selectedTransaction}
			<div class="flex-1 space-y-6 overflow-y-auto pr-2">
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
