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
		CreditCard
	} from 'lucide-svelte';

	let { data } = $props();

	// Function to get the appropriate icon component
	function getIconComponent(title: string) {
		switch (title) {
			case 'Total Users':
				return Users;
			case 'Total Transactions':
				return CreditCard;
			case 'Redemptions':
				return Gift;
			default:
				return Activity;
		}
	}

	// Mock data for charts and tables
	const monthlyStats = [
		{ month: 'Jan', users: 1200, revenue: 45000, transactions: 890 },
		{ month: 'Feb', users: 1450, revenue: 52000, transactions: 1020 },
		{ month: 'Mar', users: 1650, revenue: 58000, transactions: 1180 },
		{ month: 'Apr', users: 1800, revenue: 62000, transactions: 1350 },
		{ month: 'May', users: 2100, revenue: 71000, transactions: 1520 },
		{ month: 'Jun', users: 2350, revenue: 78000, transactions: 1680 }
	];

	const recentTransactions = [
		{
			id: 'TXN-001',
			customer: 'John Doe',
			amount: 129.99,
			status: 'completed',
			date: '2025-06-02'
		},
		{
			id: 'TXN-002',
			customer: 'Jane Smith',
			amount: 89.5,
			status: 'pending',
			date: '2025-06-02'
		},
		{
			id: 'TXN-003',
			customer: 'Mike Johnson',
			amount: 259.0,
			status: 'completed',
			date: '2025-06-01'
		},
		{
			id: 'TXN-004',
			customer: 'Sarah Wilson',
			amount: 45.75,
			status: 'failed',
			date: '2025-06-01'
		},
		{
			id: 'TXN-005',
			customer: 'Chris Brown',
			amount: 199.99,
			status: 'completed',
			date: '2025-05-31'
		}
	];

	const topProducts = [
		{ name: 'Premium Subscription', sales: 1234, revenue: 123400 },
		{ name: 'Basic Plan', sales: 2345, revenue: 93800 },
		{ name: 'Pro Features', sales: 876, revenue: 87600 },
		{ name: 'Mobile App', sales: 654, revenue: 32700 },
		{ name: 'Enterprise', sales: 123, revenue: 61500 }
	];

	let selectedDate = $state(undefined);

	const chartConfig = {
		users: {
			label: 'Users',
			color: 'hsl(var(--chart-1))'
		},
		revenue: {
			label: 'Revenue',
			color: 'hsl(var(--chart-2))'
		},
		transactions: {
			label: 'Transactions',
			color: 'hsl(var(--chart-3))'
		}
	};

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
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
</script>

<main class="flex-1 space-y-6 p-6">
	<!-- Page Header -->
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
			<Button>
				<Eye class="mr-2 h-4 w-4" />
				View Analytics
			</Button>
		</div>
	</div>

	<!-- Quick Stats Cards -->
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
		<!-- Monthly Overview Chart -->
		<Card class="col-span-4">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<BarChart3 class="h-5 w-5" />
					Monthly Overview
				</CardTitle>
			</CardHeader>
			<CardContent class="pl-2">
				<div class="h-[300px] w-full">
					<!-- Simple bar chart representation -->
					<div class="flex h-full items-end justify-between space-x-2">
						{#each monthlyStats as month}
							<div class="flex flex-col items-center space-y-1">
								<div class="flex h-full flex-col justify-end space-y-1">
									<div
										class="w-12 bg-blue-500"
										style="height: {(month.users / 2500) * 100}%"
										title="Users: {month.users}"
									></div>
									<div
										class="w-12 bg-green-500"
										style="height: {(month.revenue / 80000) * 100}%"
										title="Revenue: ${month.revenue}"
									></div>
									<div
										class="w-12 bg-purple-500"
										style="height: {(month.transactions / 1700) * 100}%"
										title="Transactions: {month.transactions}"
									></div>
								</div>
								<span class="text-xs text-muted-foreground">{month.month}</span>
							</div>
						{/each}
					</div>
					<div class="mt-4 flex justify-center space-x-4 text-xs">
						<div class="flex items-center">
							<div class="mr-2 h-3 w-3 bg-blue-500"></div>
							Users
						</div>
						<div class="flex items-center">
							<div class="mr-2 h-3 w-3 bg-green-500"></div>
							Revenue
						</div>
						<div class="flex items-center">
							<div class="mr-2 h-3 w-3 bg-purple-500"></div>
							Transactions
						</div>
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Recent Activity & Calendar -->
		<Card class="col-span-3">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<CalendarIcon class="h-5 w-5" />
					Calendar & Activity
				</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				<Calendar type="single" bind:value={selectedDate} />
				<Separator />
				<div class="space-y-2">
					<h4 class="text-sm font-medium">Recent Activity</h4>
					<div class="space-y-2">
						{#if data.recentActivity && data.recentActivity.length > 0}
							{#each data.recentActivity.slice(0, 3) as activity}
								<div class="flex items-center space-x-2 text-sm">
									<div
										class="h-2 w-2 rounded-full {activity.status === 'success'
											? 'bg-green-500'
											: activity.status === 'info'
												? 'bg-blue-500'
												: 'bg-purple-500'}"
									></div>
									<span>{activity.message}</span>
									<span class="text-muted-foreground">
										{new Date(activity.timestamp).toLocaleTimeString([], {
											hour: '2-digit',
											minute: '2-digit'
										})}
									</span>
								</div>
							{/each}
						{:else}
							<div class="flex items-center space-x-2 text-sm">
								<div class="h-2 w-2 rounded-full bg-green-500"></div>
								<span>New user registered</span>
								<span class="text-muted-foreground">2min ago</span>
							</div>
							<div class="flex items-center space-x-2 text-sm">
								<div class="h-2 w-2 rounded-full bg-blue-500"></div>
								<span>Transaction completed</span>
								<span class="text-muted-foreground">5min ago</span>
							</div>
							<div class="flex items-center space-x-2 text-sm">
								<div class="h-2 w-2 rounded-full bg-purple-500"></div>
								<span>Reward redeemed</span>
								<span class="text-muted-foreground">10min ago</span>
							</div>
						{/if}
					</div>
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
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Transaction ID</TableHead>
							<TableHead>Customer</TableHead>
							<TableHead>Amount</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Date</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each recentTransactions as transaction}
							<TableRow>
								<TableCell class="font-medium">{transaction.id}</TableCell>
								<TableCell>{transaction.customer}</TableCell>
								<TableCell>{formatCurrency(transaction.amount)}</TableCell>
								<TableCell>
									<Badge variant={getStatusBadgeVariant(transaction.status)}>
										{transaction.status}
									</Badge>
								</TableCell>
								<TableCell>{transaction.date}</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</CardContent>
		</Card>

		<!-- Top Products & Performance Metrics -->
		<Card class="col-span-3">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<ShoppingBag class="h-5 w-5" />
					Top Products
				</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				{#each topProducts as product}
					<div class="flex items-center justify-between">
						<div class="space-y-1">
							<p class="text-sm font-medium leading-none">{product.name}</p>
							<p class="text-xs text-muted-foreground">{product.sales} sales</p>
						</div>
						<div class="text-right">
							<p class="text-sm font-medium">{formatCurrency(product.revenue)}</p>
						</div>
					</div>
					<Progress value={(product.sales / 2500) * 100} class="h-2" />
				{/each}
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
									<h3 class="text-2xl font-bold">78%</h3>
									<p class="text-sm text-muted-foreground">Customer Satisfaction</p>
									<div class="mt-2 flex items-center justify-center">
										<TrendingUp class="h-4 w-4 text-green-600" />
										<span class="ml-1 text-sm text-green-600">+5.2%</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</CarouselItem>
					<CarouselItem class="md:basis-1/2 lg:basis-1/3">
						<Card>
							<CardContent class="flex aspect-square items-center justify-center p-6">
								<div class="text-center">
									<h3 class="text-2xl font-bold">92%</h3>
									<p class="text-sm text-muted-foreground">System Uptime</p>
									<div class="mt-2 flex items-center justify-center">
										<TrendingUp class="h-4 w-4 text-green-600" />
										<span class="ml-1 text-sm text-green-600">+1.1%</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</CarouselItem>
					<CarouselItem class="md:basis-1/2 lg:basis-1/3">
						<Card>
							<CardContent class="flex aspect-square items-center justify-center p-6">
								<div class="text-center">
									<h3 class="text-2xl font-bold">3.2s</h3>
									<p class="text-sm text-muted-foreground">Avg Response Time</p>
									<div class="mt-2 flex items-center justify-center">
										<TrendingDown class="h-4 w-4 text-green-600" />
										<span class="ml-1 text-sm text-green-600">-0.4s</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</CarouselItem>
					<CarouselItem class="md:basis-1/2 lg:basis-1/3">
						<Card>
							<CardContent class="flex aspect-square items-center justify-center p-6">
								<div class="text-center">
									<h3 class="text-2xl font-bold">$2.4M</h3>
									<p class="text-sm text-muted-foreground">Monthly Revenue</p>
									<div class="mt-2 flex items-center justify-center">
										<TrendingUp class="h-4 w-4 text-green-600" />
										<span class="ml-1 text-sm text-green-600">+12.3%</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</CarouselItem>
					<CarouselItem class="md:basis-1/2 lg:basis-1/3">
						<Card>
							<CardContent class="flex aspect-square items-center justify-center p-6">
								<div class="text-center">
									<h3 class="text-2xl font-bold">15.6k</h3>
									<p class="text-sm text-muted-foreground">Active Users</p>
									<div class="mt-2 flex items-center justify-center">
										<TrendingUp class="h-4 w-4 text-green-600" />
										<span class="ml-1 text-sm text-green-600">+8.7%</span>
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

	<!-- System Health & Alerts -->
	<div class="grid gap-4 md:grid-cols-2">
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Activity class="h-5 w-5" />
					System Health
				</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-sm">API Response Time</span>
						<span class="text-sm font-medium">{data.systemHealth?.apiResponseTime || 142}ms</span>
					</div>
					<Progress
						value={Math.max(0, 100 - (data.systemHealth?.apiResponseTime || 142) / 5)}
						class="h-2"
					/>
				</div>
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-sm">Database Performance</span>
						<span class="text-sm font-medium">{data.systemHealth?.databasePerformance || 98}%</span>
					</div>
					<Progress value={data.systemHealth?.databasePerformance || 98} class="h-2" />
				</div>
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-sm">Memory Usage</span>
						<span class="text-sm font-medium">{data.systemHealth?.memoryUsage || 64}%</span>
					</div>
					<Progress value={data.systemHealth?.memoryUsage || 64} class="h-2" />
				</div>
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-sm">CPU Usage</span>
						<span class="text-sm font-medium">{data.systemHealth?.cpuUsage || 32}%</span>
					</div>
					<Progress value={data.systemHealth?.cpuUsage || 32} class="h-2" />
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Clock class="h-5 w-5" />
					Recent Alerts
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-4">
					<div class="flex items-start space-x-3">
						<div class="mt-2 h-2 w-2 rounded-full bg-green-500"></div>
						<div class="space-y-1">
							<p class="text-sm font-medium">System backup completed successfully</p>
							<p class="text-xs text-muted-foreground">5 minutes ago</p>
						</div>
					</div>
					<div class="flex items-start space-x-3">
						<div class="mt-2 h-2 w-2 rounded-full bg-yellow-500"></div>
						<div class="space-y-1">
							<p class="text-sm font-medium">High memory usage detected</p>
							<p class="text-xs text-muted-foreground">15 minutes ago</p>
						</div>
					</div>
					<div class="flex items-start space-x-3">
						<div class="mt-2 h-2 w-2 rounded-full bg-blue-500"></div>
						<div class="space-y-1">
							<p class="text-sm font-medium">New feature deployment started</p>
							<p class="text-xs text-muted-foreground">1 hour ago</p>
						</div>
					</div>
					<div class="flex items-start space-x-3">
						<div class="mt-2 h-2 w-2 rounded-full bg-red-500"></div>
						<div class="space-y-1">
							<p class="text-sm font-medium">Failed login attempt detected</p>
							<p class="text-xs text-muted-foreground">2 hours ago</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	</div>
</main>
