<script lang="ts">
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Progress } from '$lib/components/ui/progress';
	import { Separator } from '$lib/components/ui/separator';
	import { Calendar } from '$lib/components/ui/calendar';
	import {
		Table,
		TableHeader,
		TableHead,
		TableBody,
		TableRow,
		TableCell
	} from '$lib/components/ui/table';
	import {
		Carousel,
		CarouselContent,
		CarouselItem,
		CarouselNext,
		CarouselPrevious
	} from '$lib/components/ui/carousel';
	import {
		TrendingUp,
		TrendingDown,
		Users,
		DollarSign,
		Gift,
		Activity,
		Calendar as CalendarIcon,
		BarChart3,
		PieChart,
		ArrowUpRight,
		ArrowDownRight,
		Eye,
		Clock,
		ShoppingBag,
		CreditCard,
		Star,
		Package,
		Monitor,
		Smartphone,
		ArrowBigDown,
		Target,
		TrendingUpDownIcon
	} from 'lucide-svelte';

	import * as Chart from '$lib/components/ui/chart/index.js';
	import { scaleBand, scaleLinear } from 'd3-scale';
	import { BarChart, AreaChart, ScatterChart } from 'layerchart';

	type DailyStat = {
		date: string;
		transactions: number;
		revenue: number;
		users: number;
		label: string;
	};

	let { data } = $props();

	// Chart data and configurations
	const dailyStatsChartConfig = {
		users: {
			label: 'New Users',
			color: '#3b82f6'
		},
		revenue: {
			label: 'Revenue',
			color: '#10b981'
		},
		transactions: {
			label: 'Transactions',
			color: '#8b5cf6'
		}
	} satisfies Chart.ChartConfig;

	const revenueAreaChartConfig = {
		web: {
			label: 'Web Platform',
			color: '#2563eb'
		},
		mobile: {
			label: 'Mobile Platform',
			color: '#60a5fa'
		}
	} satisfies Chart.ChartConfig;

	const performanceChartConfig = {
		memory: {
			label: 'Memory Usage',
			color: '#ef4444'
		},
		cpu: {
			label: 'CPU Usage',
			color: '#f59e0b'
		},
		database: {
			label: 'Database Performance',
			color: '#10b981'
		}
	} satisfies Chart.ChartConfig;

	// Generate revenue breakdown data
	let revenueBreakdownData = $derived(
		data.dailyStats
			? data.dailyStats.map((day) => ({
					month: day.label,
					web: Math.floor(day.revenue * 0.6),
					mobile: Math.floor(day.revenue * 0.4)
				}))
			: []
	);

	// Generate performance metrics data
	let performanceData = $derived([
		{ metric: 'Memory', usage: data.systemHealth?.memoryUsage || 0 },
		{ metric: 'CPU', usage: data.systemHealth?.cpuUsage || 0 },
		{ metric: 'Database', usage: data.systemHealth?.databasePerformance || 0 },
		{ metric: 'API', usage: Math.min(100, (data.systemHealth?.apiResponseTime || 0) / 2) }
	]);

	// Function to get the appropriate icon component
	function getIconComponent(title: string) {
		switch (title) {
			case 'Total Users':
				return Users;
			case 'Total Transactions':
				return CreditCard;
			case 'Total Revenue':
				return DollarSign;
			case 'Active Rewards':
				return Gift;
			default:
				return Activity;
		}
	}

	let selectedDate = $state(undefined);

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('ar-DZ', {
			style: 'currency',
			currency: 'DZD'
		}).format(amount);
	}

	function getStatusBadgeVariant(status: string) {
		switch (status) {
			case 'completed':
				return 'default';
			case 'pending':
				return 'secondary';
			case 'failed':
				return 'destructive';
			default:
				return 'outline';
		}
	}

	function getActivityIcon(type: string) {
		switch (type) {
			case 'user_registration':
				return Users;
			case 'transaction':
				return CreditCard;
			case 'reward':
				return Gift;
			case 'system':
				return Activity;
			default:
				return Activity;
		}
	}

	function formatRelativeTime(timestamp: string) {
		const now = new Date();
		const time = new Date(timestamp);
		const diffMs = now.getTime() - time.getTime();
		const diffMinutes = Math.floor(diffMs / (1000 * 60));
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffMinutes < 60) {
			return `${diffMinutes}m ago`;
		} else if (diffHours < 24) {
			return `${diffHours}h ago`;
		} else {
			return `${diffDays}d ago`;
		}
	}
</script>

<main class="flex-1 space-y-6 p-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
			<p class="text-muted-foreground">
				Welcome back! Here's what's happening with your business today.
			</p>
		</div>
		<div class="flex items-center space-x-2">
			<Button variant="outline">
				<BarChart3 class="mr-2 h-4 w-4" />
				Export Report
			</Button>
		</div>
	</div>

	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
		{#each data.quickStats as stat}
			{@const IconComponent = getIconComponent(stat.title)}
			<Card>
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-sm font-medium">{stat.title}</CardTitle>
					<IconComponent class="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold">{stat.value}</div>
					<div class="flex items-center pt-1">
						{#if stat.change.startsWith('+')}
							<TrendingUp class="mr-1 h-3 w-3 text-green-600" />
							<span class="text-xs text-green-600">{stat.change}</span>
						{:else if stat.change.startsWith('-')}
							<TrendingDown class="mr-1 h-3 w-3 text-red-600" />
							<span class="text-xs text-red-600">{stat.change}</span>
						{:else}
							<span class="text-xs text-muted-foreground">{stat.change}</span>
						{/if}
						<span class="ml-1 text-xs text-muted-foreground">from last month</span>
					</div>
				</CardContent>
			</Card>
		{/each}
	</div>

	<!-- Charts and Analytics Section -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
		<!-- Daily Statistics Chart -->
		<Card class="col-span-4 overflow-hidden">
			<CardHeader class="pb-4">
				<CardTitle class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<BarChart3 class="h-5 w-5 text-primary" />
						Daily Statistics
					</div>
					{#if data.dailyStats && data.dailyStats.length > 0}
						<div class="flex items-center gap-4 text-sm text-muted-foreground">
							<div class="flex items-center gap-1">
								<div
									class="h-2 w-2 rounded-full"
									style="background-color: {dailyStatsChartConfig.users.color}"
								></div>
								<span>Users</span>
							</div>
							<div class="flex items-center gap-1">
								<div
									class="h-2 w-2 rounded-full"
									style="background-color: {dailyStatsChartConfig.transactions.color}"
								></div>
								<span>Transactions</span>
							</div>
						</div>
					{/if}
				</CardTitle>
			</CardHeader>
			<CardContent class="pt-0">
				<div class="h-[320px] w-full">
					{#if data.dailyStats && data.dailyStats.length > 0}
						<Chart.Container config={dailyStatsChartConfig} class="h-full w-full">
							<BarChart
								data={data.dailyStats as DailyStat[]}
								xScale={scaleBand().padding(0.3)}
								x="label"
								axis="x"
								seriesLayout="group"
								series={[
									{
										key: 'users',
										label: dailyStatsChartConfig.users.label,
										color: dailyStatsChartConfig.users.color
									},
									{
										key: 'transactions',
										label: dailyStatsChartConfig.transactions.label,
										color: dailyStatsChartConfig.transactions.color
									}
								]}
								props={{
									xAxis: {
										format: (d) => d,
										tickLabelProps: {
											'font-size': 11,
											'font-weight': 500,
											fill: 'hsl(var(--muted-foreground))'
										}
									},
									yAxis: {
										format: (d) =>
											new Intl.NumberFormat('en-US', {
												notation: d >= 1000 ? 'compact' : 'standard',
												maximumFractionDigits: 1
											}).format(d),
										tickLabelProps: {
											'font-size': 11,
											'font-weight': 500,
											fill: 'hsl(var(--muted-foreground))'
										}
									}
								}}
							>
								{#snippet tooltip(props)}
									<Chart.Tooltip class="rounded-lg border bg-background p-3 shadow-lg" />
								{/snippet}
							</BarChart>
						</Chart.Container>
					{:else}
						<div class="flex h-full flex-col items-center justify-center gap-3">
							<div class="rounded-full bg-muted p-3">
								<BarChart3 class="h-6 w-6 text-muted-foreground" />
							</div>
							<div class="text-center">
								<p class="font-medium text-muted-foreground">No data available</p>
								<p class="text-sm text-muted-foreground/80">
									Statistics will appear when data is collected
								</p>
							</div>
						</div>
					{/if}
				</div>
			</CardContent>
		</Card>

		<!-- Recent Activity -->
		<Card class="col-span-3">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Activity class="h-5 w-5" />
					Recent Activity
				</CardTitle>
			</CardHeader>
			<CardContent class="h-full">
				<div class="h-full max-h-80 space-y-3 overflow-y-auto pt-5">
					{#if data.recentActivity && data.recentActivity.length > 0}
						{#each data.recentActivity.slice(0, 4) as activity}
							{@const ActivityIcon = getActivityIcon(activity.type)}
							<div
								class="flex items-start space-x-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
							>
								<div class="mt-1">
									<ActivityIcon class="h-4 w-4 text-muted-foreground" />
								</div>
								<div class="flex-1 space-y-1">
									<div class="flex items-center justify-between">
										<p class="text-sm font-medium">{activity.message}</p>
										<Badge
											variant={activity.status === 'success'
												? 'default'
												: activity.status === 'info'
													? 'secondary'
													: 'outline'}
										>
											{activity.status}
										</Badge>
									</div>
									<p class="text-xs text-muted-foreground">
										{formatRelativeTime(activity.timestamp)}
									</p>
								</div>
								<div
									class="mt-2 h-2 w-2 rounded-full {activity.status === 'success'
										? 'bg-green-500'
										: activity.status === 'info'
											? 'bg-blue-500'
											: 'bg-gray-500'}"
								></div>
							</div>
						{/each}
					{:else}
						<div class="flex h-full items-center justify-center">
							<div class="text-center">
								<Activity class="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
								<p class="text-sm text-muted-foreground">No recent activity</p>
							</div>
						</div>
					{/if}
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Quick Performance Insights -->
	<div class="grid gap-4 md:grid-cols-2">
		<!-- Today's Performance -->
		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="flex items-center gap-2 text-lg">
					<CalendarIcon class="h-4 w-4" />
					Today's Performance
				</CardTitle>
			</CardHeader>
			<CardContent class="space-y-3">
				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">New Users</span>
					<span class="font-semibold"
						>{data.dailyStats && data.dailyStats.length > 0
							? data.dailyStats[data.dailyStats.length - 1]?.users || 0
							: 0}</span
					>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">Transactions</span>
					<span class="font-semibold text-green-600"
						>{data.dailyStats && data.dailyStats.length > 0
							? data.dailyStats[data.dailyStats.length - 1]?.transactions || 0
							: 0}</span
					>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">Revenue</span>
					<span class="font-semibold"
						>{formatCurrency(
							data.dailyStats && data.dailyStats.length > 0
								? data.dailyStats[data.dailyStats.length - 1]?.revenue || 0
								: 0
						)}</span
					>
				</div>
			</CardContent>
		</Card>

		<!-- Growth Metrics -->
		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="flex items-center gap-2 text-lg">
					<TrendingUp class="h-4 w-4" />
					Growth Metrics
				</CardTitle>
			</CardHeader>
			<CardContent class="space-y-3">
				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">User Growth</span>
					<div class="flex items-center gap-1">
						{#if (data.monthlyGrowth?.users || 0) >= 0}
							<TrendingUp class="h-3 w-3 text-green-600" />
							<span class="font-semibold text-green-600"
								>+{data.monthlyGrowth?.users?.toFixed(1) || 0}%</span
							>
						{:else}
							<TrendingDown class="h-3 w-3 text-red-600" />
							<span class="font-semibold text-red-600"
								>{data.monthlyGrowth?.users?.toFixed(1) || 0}%</span
							>
						{/if}
					</div>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">Revenue Growth</span>
					<div class="flex items-center gap-1">
						{#if (data.monthlyGrowth?.revenue || 0) >= 0}
							<TrendingUp class="h-3 w-3 text-green-600" />
							<span class="font-semibold text-green-600"
								>+{data.monthlyGrowth?.revenue?.toFixed(1) || 0}%</span
							>
						{:else}
							<TrendingDown class="h-3 w-3 text-red-600" />
							<span class="font-semibold text-red-600"
								>{data.monthlyGrowth?.revenue?.toFixed(1) || 0}%</span
							>
						{/if}
					</div>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">Engagement</span>
					<span class="font-semibold text-blue-600"
						>{data.monthlyGrowth?.engagement?.toFixed(1) || 0}%</span
					>
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Data Tables and Insights -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
		<!-- Recent Transactions Table -->
		<Card class="col-span-4">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<CreditCard class="h-5 w-5" />
					Recent Transactions
				</CardTitle>
			</CardHeader>
			<CardContent>
				{#if data.recentTransactions && data.recentTransactions.length > 0}
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Reference</TableHead>
								<TableHead>Amount</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Date</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each data.recentTransactions.slice(0, 5) as transaction}
								<TableRow>
									<TableCell class="font-mono text-sm">{transaction.referenceNumber}</TableCell>
									<TableCell class="font-medium">{formatCurrency(transaction.amount)}</TableCell>
									<TableCell>
										<Badge variant={getStatusBadgeVariant(transaction.status)}>
											{transaction.status}
										</Badge>
									</TableCell>
									<TableCell class="text-muted-foreground">
										{new Date(transaction.timestamp).toLocaleDateString()}
									</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				{:else}
					<div class="py-8 text-center">
						<CreditCard class="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
						<p class="text-muted-foreground">No transactions found</p>
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- Top Articles & Statistics -->
		<Card class="col-span-3">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Package class="h-5 w-5" />
					{data.topArticles && data.topArticles.length > 0 ? 'Top Articles' : 'Quick Stats'}
				</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				{#if data.topArticles && data.topArticles.length > 0}
					{#each data.topArticles as article}
						<div class="flex items-center justify-between rounded-lg border p-3">
							<div class="space-y-1">
								<p class="text-sm font-medium leading-none">{article.name}</p>
								<p class="text-xs text-muted-foreground">
									{article.sales} sales • ${article.price?.toFixed(2)}
								</p>
							</div>
							<div class="text-right">
								<p class="text-sm font-medium">{formatCurrency(article.revenue)}</p>
								<div class="flex items-center text-xs text-green-600">
									<TrendingUp class="mr-1 h-3 w-3" />
									Popular
								</div>
							</div>
						</div>
					{/each}
				{:else}
					<!-- Quick Statistics when no articles -->
					<div class="space-y-4">
						<div class="flex items-center justify-between rounded-lg bg-muted/30 p-3">
							<div class="flex items-center space-x-3">
								<Users class="h-5 w-5 text-blue-500" />
								<div>
									<p class="text-sm font-medium">Active Users</p>
									<p class="text-xs text-muted-foreground">Last 30 days</p>
								</div>
							</div>
							<p class="text-lg font-bold">{data.userStats?.active || 0}</p>
						</div>

						<div class="flex items-center justify-between rounded-lg bg-muted/30 p-3">
							<div class="flex items-center space-x-3">
								<CreditCard class="h-5 w-5 text-green-500" />
								<div>
									<p class="text-sm font-medium">Success Rate</p>
									<p class="text-xs text-muted-foreground">Transactions</p>
								</div>
							</div>
							<p class="text-lg font-bold">{data.transactionStats?.successRate || 0}%</p>
						</div>

						<div class="flex items-center justify-between rounded-lg bg-muted/30 p-3">
							<div class="flex items-center space-x-3">
								<Gift class="h-5 w-5 text-purple-500" />
								<div>
									<p class="text-sm font-medium">Available Rewards</p>
									<p class="text-xs text-muted-foreground">Ready to claim</p>
								</div>
							</div>
							<p class="text-lg font-bold">{data.rewardStats?.available || 0}</p>
						</div>
					</div>
				{/if}
			</CardContent>
		</Card>
	</div>

	<!-- Performance Metrics Carousel -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<PieChart class="h-5 w-5" />
				Performance Metrics
			</CardTitle>
		</CardHeader>
		<CardContent>
			<Carousel class="w-full">
				<CarouselContent>
					<CarouselItem class="md:basis-1/2 lg:basis-1/3">
						<Card>
							<CardContent class="flex aspect-square items-center justify-center p-6">
								<div class="text-center">
									<h3 class="text-2xl font-bold">{data.transactionStats?.successRate || 0}%</h3>
									<p class="text-sm text-muted-foreground">Success Rate</p>
									<div class="mt-2 flex items-center justify-center">
										<TrendingUp class="h-4 w-4 text-green-600" />
										<span class="ml-1 text-sm text-green-600">+2.1%</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</CarouselItem>
					<CarouselItem class="md:basis-1/2 lg:basis-1/3">
						<Card>
							<CardContent class="flex aspect-square items-center justify-center p-6">
								<div class="text-center">
									<h3 class="text-2xl font-bold">{data.systemHealth?.uptime || 99.8}%</h3>
									<p class="text-sm text-muted-foreground">System Uptime</p>
									<div class="mt-2 flex items-center justify-center">
										<TrendingUp class="h-4 w-4 text-green-600" />
										<span class="ml-1 text-sm text-green-600">+0.1%</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</CarouselItem>
					<CarouselItem class="md:basis-1/2 lg:basis-1/3">
						<Card>
							<CardContent class="flex aspect-square items-center justify-center p-6">
								<div class="text-center">
									<h3 class="text-2xl font-bold">{data.systemHealth?.apiResponseTime || 142}ms</h3>
									<p class="text-sm text-muted-foreground">Avg Response Time</p>
									<div class="mt-2 flex items-center justify-center">
										<TrendingDown class="h-4 w-4 text-green-600" />
										<span class="ml-1 text-sm text-green-600">-8ms</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</CarouselItem>
					<CarouselItem class="md:basis-1/2 lg:basis-1/3">
						<Card>
							<CardContent class="flex aspect-square items-center justify-center p-6">
								<div class="text-center">
									<h3 class="text-2xl font-bold">
										{formatCurrency(data.transactionStats?.totalRevenue || 0)}
									</h3>
									<p class="text-sm text-muted-foreground">Total Revenue</p>
									<div class="mt-2 flex items-center justify-center">
										<TrendingUp class="h-4 w-4 text-green-600" />
										<span class="ml-1 text-sm text-green-600"
											>+{data.monthlyGrowth?.revenue?.toFixed(1) || 0}%</span
										>
									</div>
								</div>
							</CardContent>
						</Card>
					</CarouselItem>
					<CarouselItem class="md:basis-1/2 lg:basis-1/3">
						<Card>
							<CardContent class="flex aspect-square items-center justify-center p-6">
								<div class="text-center">
									<h3 class="text-2xl font-bold">{data.userStats?.active || 0}</h3>
									<p class="text-sm text-muted-foreground">Active Users</p>
									<div class="mt-2 flex items-center justify-center">
										<TrendingUp class="h-4 w-4 text-green-600" />
										<span class="ml-1 text-sm text-green-600"
											>+{data.monthlyGrowth?.users?.toFixed(1) || 0}%</span
										>
									</div>
								</div>
							</CardContent>
						</Card>
					</CarouselItem>
					<CarouselItem class="md:basis-1/2 lg:basis-1/3">
						<Card>
							<CardContent class="flex aspect-square items-center justify-center p-6">
								<div class="text-center">
									<h3 class="text-2xl font-bold">
										{formatCurrency(data.transactionStats?.averageValue || 0)}
									</h3>
									<p class="text-sm text-muted-foreground">Avg Transaction</p>
									<div class="mt-2 flex items-center justify-center">
										<TrendingUp class="h-4 w-4 text-green-600" />
										<span class="ml-1 text-sm text-green-600">+5.2%</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</CarouselItem>
				</CarouselContent>
				<CarouselPrevious />
				<CarouselNext />
			</Carousel>
		</CardContent>
	</Card>
</main>
