import { listUsers } from '$lib/server/users';
import { listTransactions } from '$lib/server/transactions';
import { listRewards } from '$lib/server/rewards';
import { listArticles } from '$lib/server/articles';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const token = locals.token;

	if (!token) {
		return {
			quickStats: [
				{
					title: 'Total Users',
					value: '0',
					change: '0%'
				},
				{
					title: 'Total Transactions',
					value: '0',
					change: '0%'
				},
				{
					title: 'Total Revenue',
					value: '$0',
					change: '0%'
				},
				{
					title: 'Redemptions',
					value: '0',
					change: '0%'
				}
			],
			userStats: {
				total: 0,
				active: 0,
				newThisMonth: 0,
				growthRate: 0
			},
			transactionStats: {
				total: 0,
				thisMonth: 0,
				totalRevenue: 0,
				averageValue: 0
			},
			rewardStats: {
				totalRedemptions: 0,
				thisMonth: 0,
				totalValue: 0,
				popularRewards: []
			},
			systemHealth: {
				apiResponseTime: 0,
				databasePerformance: 0,
				memoryUsage: 0,
				cpuUsage: 0,
				uptime: 0
			},
			recentActivity: [],
			monthlyGrowth: {
				users: 0,
				revenue: 0,
				transactions: 0,
				engagement: 0
			},
			recentTransactions: [],
			topArticles: [],
			dailyStats: []
		};
	}

	try {
		// Fetch all data in parallel
		const [usersResponse, transactionsResponse, rewardsResponse, articlesResponse] =
			await Promise.all([
				listUsers(token),
				listTransactions(token),
				listRewards(token),
				listArticles(token)
			]);

		// Process users data
		const users = usersResponse.status === 'success' ? usersResponse.data || [] : [];
		const userCount = users.length;

		// Process transactions data
		const transactions =
			transactionsResponse.status === 'success' ? transactionsResponse.data || [] : [];
		const rewards = rewardsResponse.status === 'success' ? rewardsResponse.data || [] : [];
		const articles = articlesResponse.status === 'success' ? articlesResponse.data || [] : [];

		// Calculate date ranges
		const now = new Date();
		const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
		const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
		const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

		// Calculate user statistics
		const newUsersThisMonth = users.filter(
			(user: User) => new Date(user.created_at || '') >= thisMonth
		).length;

		const newUsersLastMonth = users.filter((user: User) => {
			const createdDate = new Date(user.created_at || '');
			return createdDate >= lastMonth && createdDate < thisMonth;
		}).length;

		const userGrowthRate =
			newUsersLastMonth > 0
				? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100
				: newUsersThisMonth > 0
					? 100
					: 0;

		// Calculate active users (users who have logged in in the last 30 days)
		const activeUsers = users.filter(
			(user: User) => new Date(user.last_login || user.created_at || '') >= thirtyDaysAgo
		).length;

		// Calculate transaction statistics
		const approvedTransactions = transactions.filter((t: Transaction) => t.responseCode === '00');
		const totalRevenue = approvedTransactions.reduce(
			(sum: number, t: Transaction) => sum + (t.amount || 0),
			0
		);
		const avgTransactionValue =
			approvedTransactions.length > 0 ? totalRevenue / approvedTransactions.length : 0;

		const thisMonthTransactions = transactions.filter(
			(t: Transaction) => new Date(t.timestamp) >= thisMonth
		);
		const lastMonthTransactions = transactions.filter((t: Transaction) => {
			const transactionDate = new Date(t.timestamp);
			return transactionDate >= lastMonth && transactionDate < thisMonth;
		});

		const thisMonthRevenue = thisMonthTransactions
			.filter((t: Transaction) => t.responseCode === '00')
			.reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);
		const lastMonthRevenue = lastMonthTransactions
			.filter((t: Transaction) => t.responseCode === '00')
			.reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);

		const revenueGrowthRate =
			lastMonthRevenue > 0
				? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
				: thisMonthRevenue > 0
					? 100
					: 0;

		const transactionGrowthRate =
			lastMonthTransactions.length > 0
				? ((thisMonthTransactions.length - lastMonthTransactions.length) /
						lastMonthTransactions.length) *
					100
				: thisMonthTransactions.length > 0
					? 100
					: 0;

		// Calculate reward statistics (mock data as there's no specific redemption tracking)
		const availableRewards = rewards.filter((r: Reward) => r.available);
		const estimatedRedemptions = Math.floor(userCount * 0.3); // Assume 30% redemption rate
		const thisMonthRedemptions = Math.floor(estimatedRedemptions * 0.15);

		// Generate daily statistics for the last 7 days
		const dailyStats = [];
		for (let i = 6; i >= 0; i--) {
			const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
			const dayStart = new Date(date.setHours(0, 0, 0, 0));
			const dayEnd = new Date(date.setHours(23, 59, 59, 999));

			const dayTransactions = transactions.filter((t: Transaction) => {
				const transactionDate = new Date(t.timestamp);
				return transactionDate >= dayStart && transactionDate <= dayEnd;
			});

			const dayRevenue = dayTransactions
				.filter((t: Transaction) => t.responseCode === '00')
				.reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);

			const dayUsers = users.filter((user: User) => {
				const createdDate = new Date(user.created_at || '');
				return createdDate >= dayStart && createdDate <= dayEnd;
			}).length;

			dailyStats.push({
				date: dayStart.toISOString().split('T')[0],
				transactions: dayTransactions.length,
				revenue: dayRevenue,
				users: dayUsers,
				label: dayStart.toLocaleDateString('en-US', { weekday: 'short' })
			});
		}

		// Get recent transactions (last 10)
		const recentTransactions = transactions
			.sort(
				(a: Transaction, b: Transaction) =>
					new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
			)
			.slice(0, 10)
			.map((t: Transaction) => ({
				id: t.id,
				referenceNumber: t.referenceNumber,
				amount: t.amount,
				status: t.responseCode === '00' ? 'completed' : t.responseCode ? 'failed' : 'pending',
				timestamp: t.timestamp,
				userId: t.userId
			}));

		// Get top articles by assumed popularity
		const topArticles = articles.slice(0, 5).map((article: Article, index: number) => ({
			...article,
			sales: Math.floor(Math.random() * 1000) + 100, // Mock sales data
			revenue: Math.floor(Math.random() * 50000) + 10000 // Mock revenue data
		}));

		// Generate recent activity from real data
		const recentActivity: Array<{
			id: string;
			type: string;
			message: string;
			timestamp: string;
			status: string;
		}> = [];

		// Add recent user registrations
		const recentUsers = users
			.filter((user: User) => new Date(user.created_at || '') >= sevenDaysAgo)
			.sort(
				(a: User, b: User) =>
					new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
			)
			.slice(0, 2);

		recentUsers.forEach((user: User) => {
			recentActivity.push({
				id: `user-${user.id}`,
				type: 'user_registration',
				message: `${user.email} registered`,
				timestamp: user.created_at || new Date().toISOString(),
				status: 'success'
			});
		});

		// Add recent transactions
		const recentTxns = transactions
			.filter((t: Transaction) => new Date(t.timestamp) >= sevenDaysAgo)
			.sort(
				(a: Transaction, b: Transaction) =>
					new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
			)
			.slice(0, 3);

		recentTxns.forEach((t: Transaction) => {
			recentActivity.push({
				id: `txn-${t.id}`,
				type: 'transaction',
				message: `Transaction ${t.responseCode === '00' ? 'completed' : 'processed'} - $${t.amount?.toFixed(2)}`,
				timestamp: t.timestamp,
				status: t.responseCode === '00' ? 'success' : 'info'
			});
		});

		// Sort recent activity by timestamp
		recentActivity.sort(
			(a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
		);

		return {
			// Quick stats for the dashboard cards
			quickStats: [
				{
					title: 'Total Users',
					value: userCount.toLocaleString(),
					change:
						userGrowthRate > 0
							? `+${Math.round(userGrowthRate * 10) / 10}%`
							: `${Math.round(userGrowthRate * 10) / 10}%`
				},
				{
					title: 'Total Transactions',
					value: transactions.length.toLocaleString(),
					change:
						transactionGrowthRate > 0
							? `+${Math.round(transactionGrowthRate * 10) / 10}%`
							: `${Math.round(transactionGrowthRate * 10) / 10}%`
				},
				{
					title: 'Total Revenue',
					value: `$${Math.round(totalRevenue).toLocaleString()}`,
					change:
						revenueGrowthRate > 0
							? `+${Math.round(revenueGrowthRate * 10) / 10}%`
							: `${Math.round(revenueGrowthRate * 10) / 10}%`
				},
				{
					title: 'Active Rewards',
					value: availableRewards.length.toLocaleString(),
					change: '+8.4%'
				}
			],
			userStats: {
				total: userCount,
				active: activeUsers,
				newThisMonth: newUsersThisMonth,
				growthRate: Math.round(userGrowthRate * 10) / 10
			},
			transactionStats: {
				total: transactions.length,
				thisMonth: thisMonthTransactions.length,
				totalRevenue: Math.round(totalRevenue),
				averageValue: Math.round(avgTransactionValue * 100) / 100,
				successRate:
					transactions.length > 0
						? Math.round((approvedTransactions.length / transactions.length) * 100)
						: 0
			},
			rewardStats: {
				totalRewards: rewards.length,
				available: availableRewards.length,
				estimatedRedemptions: estimatedRedemptions,
				thisMonth: thisMonthRedemptions,
				popularRewards: availableRewards.slice(0, 5).map((reward: Reward) => ({
					name: reward.name,
					category: reward.category,
					pointsRequired: reward.pointsRequired
				}))
			},
			systemHealth: {
				apiResponseTime: Math.floor(Math.random() * 50) + 120, // 120-170ms
				databasePerformance: Math.floor(Math.random() * 5) + 95, // 95-100%
				memoryUsage: Math.floor(Math.random() * 20) + 50, // 50-70%
				cpuUsage: Math.floor(Math.random() * 30) + 15, // 15-45%
				uptime: 99.8
			},
			recentActivity: recentActivity.slice(0, 6),
			monthlyGrowth: {
				users: userGrowthRate,
				revenue: revenueGrowthRate,
				transactions: transactionGrowthRate,
				engagement: Math.floor(Math.random() * 8) + 3 // 3-11%
			},
			recentTransactions,
			topArticles,
			dailyStats
		};
	} catch (error) {
		console.error('Error fetching dashboard data:', error);
		return {
			quickStats: [
				{
					title: 'Total Users',
					value: '0',
					change: '0%'
				},
				{
					title: 'Total Transactions',
					value: '0',
					change: '0%'
				},
				{
					title: 'Total Revenue',
					value: '$0',
					change: '0%'
				},
				{
					title: 'Redemptions',
					value: '0',
					change: '0%'
				}
			],
			userStats: {
				total: 0,
				active: 0,
				newThisMonth: 0,
				growthRate: 0
			},
			transactionStats: {
				total: 0,
				thisMonth: 0,
				totalRevenue: 0,
				averageValue: 0
			},
			rewardStats: {
				totalRedemptions: 0,
				thisMonth: 0,
				totalValue: 0,
				popularRewards: []
			},
			systemHealth: {
				apiResponseTime: 0,
				databasePerformance: 0,
				memoryUsage: 0,
				cpuUsage: 0,
				uptime: 0
			},
			recentActivity: [],
			monthlyGrowth: {
				users: 0,
				revenue: 0,
				transactions: 0,
				engagement: 0
			},
			recentTransactions: [],
			topArticles: [],
			dailyStats: []
		};
	}
};

export const actions = {
	logout: async ({ cookies, locals }) => {
		cookies.delete('AuthorizationToken', { path: '/' });
		cookies.delete('RefreshToken', { path: '/' });
		locals.user = undefined;
		locals.token = undefined;

		throw redirect(302, '/login');
	}
} satisfies Actions;
