import type { PageData } from '../../routes/(app)/dashboard/$types';

export interface ReportData {
	quickStats: Array<{
		title: string;
		value: string;
		change: string;
	}>;
	userStats: {
		total: number;
		active: number;
		newThisMonth: number;
		growthRate: number;
	};
	transactionStats: {
		total: number;
		thisMonth: number;
		totalRevenue: number;
		averageValue: number;
		successRate?: number;
	};
	rewardStats: {
		totalRewards?: number;
		available?: number;
		estimatedRedemptions?: number;
		thisMonth?: number;
		popularRewards?: Array<{
			name: string;
			category: string;
			pointsRequired: number;
		}>;
	};
	systemHealth: {
		apiResponseTime: number;
		databasePerformance: number;
		memoryUsage: number;
		cpuUsage: number;
		uptime: number;
	};
	recentActivity: Array<{
		id: string;
		type: string;
		message: string;
		timestamp: string;
		status: string;
	}>;
	monthlyGrowth: {
		users: number;
		revenue: number;
		transactions: number;
		engagement: number;
	};
	recentTransactions: Array<{
		id: string;
		referenceNumber: string;
		amount: number;
		status: string;
		timestamp: string;
		userId: number;
	}>;
	topArticles: Array<{
		name: string;
		price?: number;
		category: string;
		sales: number;
		revenue: number;
	}>;
	dailyStats: Array<{
		date: string;
		transactions: number;
		revenue: number;
		users: number;
		label: string;
	}>;
}

export function generateCSV(data: ReportData): string {
	const now = new Date();
	const reportDate = now.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});

	let csv = `Dashboard Report - ${reportDate}\n\n`;

	// Quick Stats Section
	csv += 'QUICK STATISTICS\n';
	csv += 'Metric,Value,Change\n';
	if (data.quickStats && data.quickStats.length > 0) {
		data.quickStats.forEach((stat) => {
			csv += `"${stat.title}","${stat.value}","${stat.change}"\n`;
		});
	}
	csv += '\n';

	// User Statistics
	csv += 'USER STATISTICS\n';
	csv += 'Metric,Value\n';
	csv += `Total Users,${data.userStats?.total || 0}\n`;
	csv += `Active Users,${data.userStats?.active || 0}\n`;
	csv += `New This Month,${data.userStats?.newThisMonth || 0}\n`;
	csv += `Growth Rate,${(data.userStats?.growthRate || 0).toFixed(2)}%\n`;
	csv += '\n';

	// Transaction Statistics
	csv += 'TRANSACTION STATISTICS\n';
	csv += 'Metric,Value\n';
	csv += `Total Transactions,${data.transactionStats?.total || 0}\n`;
	csv += `This Month,${data.transactionStats?.thisMonth || 0}\n`;
	csv += `Total Revenue,${(data.transactionStats?.totalRevenue || 0).toLocaleString()} DZD\n`;
	csv += `Average Value,${(data.transactionStats?.averageValue || 0).toFixed(2)} DZD\n`;
	if (data.transactionStats?.successRate !== undefined) {
		csv += `Success Rate,${data.transactionStats.successRate}%\n`;
	}
	csv += '\n';

	// System Health
	csv += 'SYSTEM HEALTH\n';
	csv += 'Metric,Value\n';
	csv += `API Response Time,${data.systemHealth?.apiResponseTime || 0}ms\n`;
	csv += `Database Performance,${data.systemHealth?.databasePerformance || 0}%\n`;
	csv += `Memory Usage,${data.systemHealth?.memoryUsage || 0}%\n`;
	csv += `CPU Usage,${data.systemHealth?.cpuUsage || 0}%\n`;
	csv += `Uptime,${data.systemHealth?.uptime || 0}%\n`;
	csv += '\n';

	// Monthly Growth
	csv += 'MONTHLY GROWTH\n';
	csv += 'Metric,Growth Rate\n';
	csv += `Users,${(data.monthlyGrowth?.users || 0).toFixed(2)}%\n`;
	csv += `Revenue,${(data.monthlyGrowth?.revenue || 0).toFixed(2)}%\n`;
	csv += `Transactions,${(data.monthlyGrowth?.transactions || 0).toFixed(2)}%\n`;
	csv += `Engagement,${(data.monthlyGrowth?.engagement || 0).toFixed(2)}%\n`;
	csv += '\n';

	// Daily Statistics
	if (data.dailyStats && data.dailyStats.length > 0) {
		csv += 'DAILY STATISTICS (Last 7 Days)\n';
		csv += 'Date,Day,Users,Transactions,Revenue (DZD)\n';
		data.dailyStats.forEach((day) => {
			csv += `${day.date},${day.label},${day.users},${day.transactions},${day.revenue.toFixed(2)}\n`;
		});
		csv += '\n';
	}

	// Recent Transactions
	if (data.recentTransactions && data.recentTransactions.length > 0) {
		csv += 'RECENT TRANSACTIONS\n';
		csv += 'Reference Number,Amount (DZD),Status,Date,User ID\n';
		data.recentTransactions.slice(0, 20).forEach((transaction) => {
			const date = new Date(transaction.timestamp).toLocaleDateString();
			csv += `${transaction.referenceNumber},${transaction.amount.toFixed(2)},${transaction.status},${date},${transaction.userId}\n`;
		});
		csv += '\n';
	}

	// Top Articles
	if (data.topArticles && data.topArticles.length > 0) {
		csv += 'TOP PERFORMING ARTICLES\n';
		csv += 'Name,Category,Price (DZD),Sales,Revenue (DZD)\n';
		data.topArticles.forEach((article) => {
			csv += `"${article.name}","${article.category}",${article.price?.toFixed(2) || 0},${article.sales},${article.revenue.toFixed(2)}\n`;
		});
		csv += '\n';
	}

	// Popular Rewards
	if (data.rewardStats?.popularRewards && data.rewardStats.popularRewards.length > 0) {
		csv += 'POPULAR REWARDS\n';
		csv += 'Name,Category,Points Required\n';
		data.rewardStats.popularRewards.forEach((reward) => {
			csv += `"${reward.name}","${reward.category}",${reward.pointsRequired}\n`;
		});
		csv += '\n';
	}

	// Recent Activity
	if (data.recentActivity && data.recentActivity.length > 0) {
		csv += 'RECENT ACTIVITY\n';
		csv += 'Type,Message,Status,Timestamp\n';
		data.recentActivity.slice(0, 20).forEach((activity) => {
			const timestamp = new Date(activity.timestamp).toLocaleString();
			csv += `"${activity.type}","${activity.message}","${activity.status}","${timestamp}"\n`;
		});
	}

	return csv;
}

export function downloadCSV(data: ReportData): void {
	const csv = generateCSV(data);
	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
	const link = document.createElement('a');

	if (link.download !== undefined) {
		const url = URL.createObjectURL(blob);
		link.setAttribute('href', url);

		const now = new Date();
		const timestamp = now.toISOString().split('T')[0]; // YYYY-MM-DD format
		link.setAttribute('download', `dashboard-report-${timestamp}.csv`);

		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		// Clean up the URL object
		URL.revokeObjectURL(url);
	}
}

export function generatePDFContent(data: ReportData): string {
	const now = new Date();
	const reportDate = now.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});

	return `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Dashboard Report - ${reportDate}</title>
	<style>
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			margin: 0;
			padding: 20px;
			color: #333;
			line-height: 1.6;
		}
		.header {
			text-align: center;
			margin-bottom: 30px;
			border-bottom: 2px solid #e5e7eb;
			padding-bottom: 20px;
		}
		.header h1 {
			color: #1f2937;
			margin: 0;
			font-size: 28px;
		}
		.header p {
			color: #6b7280;
			margin: 5px 0 0 0;
		}
		.section {
			margin-bottom: 30px;
			page-break-inside: avoid;
		}
		.section h2 {
			color: #374151;
			border-bottom: 1px solid #d1d5db;
			padding-bottom: 5px;
			margin-bottom: 15px;
			font-size: 20px;
		}
		.stats-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			gap: 15px;
			margin-bottom: 20px;
		}
		.stat-card {
			background: #f9fafb;
			border: 1px solid #e5e7eb;
			border-radius: 6px;
			padding: 15px;
		}
		.stat-card h3 {
			margin: 0 0 5px 0;
			font-size: 14px;
			color: #6b7280;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}
		.stat-card .value {
			font-size: 24px;
			font-weight: bold;
			color: #111827;
		}
		.stat-card .change {
			font-size: 12px;
			margin-top: 5px;
		}
		.positive { color: #059669; }
		.negative { color: #dc2626; }
		.neutral { color: #6b7280; }
		table {
			width: 100%;
			border-collapse: collapse;
			margin-top: 15px;
			font-size: 14px;
		}
		th, td {
			padding: 8px 12px;
			text-align: left;
			border-bottom: 1px solid #e5e7eb;
		}
		th {
			background: #f3f4f6;
			font-weight: 600;
			color: #374151;
		}
		.metric-row {
			display: flex;
			justify-content: space-between;
			padding: 8px 0;
			border-bottom: 1px solid #f3f4f6;
		}
		.metric-label {
			color: #6b7280;
		}
		.metric-value {
			font-weight: 600;
			color: #111827;
		}
		.summary-box {
			background: #eff6ff;
			border: 1px solid #bfdbfe;
			border-radius: 6px;
			padding: 20px;
			margin-top: 20px;
		}
		.summary-box h3 {
			margin: 0 0 10px 0;
			color: #1e40af;
		}
		@media print {
			body { margin: 0; }
			.section { page-break-inside: avoid; }
		}
	</style>
</head>
<body>
	<div class="header">
		<h1>Dashboard Report</h1>
		<p>Generated on ${reportDate}</p>
	</div>

	<div class="section">
		<h2>Executive Summary</h2>
		<div class="stats-grid">
			${
				data.quickStats && data.quickStats.length > 0
					? data.quickStats
							.map(
								(stat) => `
				<div class="stat-card">
					<h3>${stat.title}</h3>
					<div class="value">${stat.value}</div>
					<div class="change ${stat.change.startsWith('+') ? 'positive' : stat.change.startsWith('-') ? 'negative' : 'neutral'}">${stat.change} from last month</div>
				</div>
			`
							)
							.join('')
					: '<p>No statistics available</p>'
			}
		</div>
	</div>

	<div class="section">
		<h2>User Analytics</h2>
		<div class="metric-row">
			<span class="metric-label">Total Users</span>
			<span class="metric-value">${(data.userStats?.total || 0).toLocaleString()}</span>
		</div>
		<div class="metric-row">
			<span class="metric-label">Active Users (30 days)</span>
			<span class="metric-value">${(data.userStats?.active || 0).toLocaleString()}</span>
		</div>
		<div class="metric-row">
			<span class="metric-label">New Users This Month</span>
			<span class="metric-value">${(data.userStats?.newThisMonth || 0).toLocaleString()}</span>
		</div>
		<div class="metric-row">
			<span class="metric-label">User Growth Rate</span>
			<span class="metric-value ${(data.userStats?.growthRate || 0) >= 0 ? 'positive' : 'negative'}">${(data.userStats?.growthRate || 0).toFixed(2)}%</span>
		</div>
	</div>

	<div class="section">
		<h2>Transaction Performance</h2>
		<div class="metric-row">
			<span class="metric-label">Total Transactions</span>
			<span class="metric-value">${(data.transactionStats?.total || 0).toLocaleString()}</span>
		</div>
		<div class="metric-row">
			<span class="metric-label">Transactions This Month</span>
			<span class="metric-value">${(data.transactionStats?.thisMonth || 0).toLocaleString()}</span>
		</div>
		<div class="metric-row">
			<span class="metric-label">Total Revenue</span>
			<span class="metric-value">${(data.transactionStats?.totalRevenue || 0).toLocaleString()} DZD</span>
		</div>
		<div class="metric-row">
			<span class="metric-label">Average Transaction Value</span>
			<span class="metric-value">${(data.transactionStats?.averageValue || 0).toFixed(2)} DZD</span>
		</div>
		${
			data.transactionStats?.successRate !== undefined
				? `
		<div class="metric-row">
			<span class="metric-label">Success Rate</span>
			<span class="metric-value">${data.transactionStats.successRate}%</span>
		</div>
		`
				: ''
		}
	</div>

	<div class="section">
		<h2>System Health</h2>
		<div class="metric-row">
			<span class="metric-label">API Response Time</span>
			<span class="metric-value">${data.systemHealth?.apiResponseTime || 0}ms</span>
		</div>
		<div class="metric-row">
			<span class="metric-label">Database Performance</span>
			<span class="metric-value">${data.systemHealth?.databasePerformance || 0}%</span>
		</div>
		<div class="metric-row">
			<span class="metric-label">Memory Usage</span>
			<span class="metric-value">${data.systemHealth?.memoryUsage || 0}%</span>
		</div>
		<div class="metric-row">
			<span class="metric-label">CPU Usage</span>
			<span class="metric-value">${data.systemHealth?.cpuUsage || 0}%</span>
		</div>
		<div class="metric-row">
			<span class="metric-label">System Uptime</span>
			<span class="metric-value">${data.systemHealth?.uptime || 0}%</span>
		</div>
	</div>

	${
		data.dailyStats && data.dailyStats.length > 0
			? `
	<div class="section">
		<h2>Daily Statistics (Last 7 Days)</h2>
		<table>
			<thead>
				<tr>
					<th>Date</th>
					<th>Day</th>
					<th>New Users</th>
					<th>Transactions</th>
					<th>Revenue (DZD)</th>
				</tr>
			</thead>
			<tbody>
				${data.dailyStats
					.map(
						(day) => `
					<tr>
						<td>${day.date}</td>
						<td>${day.label}</td>
						<td>${day.users}</td>
						<td>${day.transactions}</td>
						<td>${day.revenue.toFixed(2)}</td>
					</tr>
				`
					)
					.join('')}
			</tbody>
		</table>
	</div>
	`
			: ''
	}

	${
		data.recentTransactions && data.recentTransactions.length > 0
			? `
	<div class="section">
		<h2>Recent Transactions</h2>
		<table>
			<thead>
				<tr>
					<th>Reference</th>
					<th>Amount (DZD)</th>
					<th>Status</th>
					<th>Date</th>
					<th>User ID</th>
				</tr>
			</thead>
			<tbody>
				${data.recentTransactions
					.slice(0, 10)
					.map(
						(transaction) => `
					<tr>
						<td>${transaction.referenceNumber}</td>
						<td>${transaction.amount.toFixed(2)}</td>
						<td>${transaction.status}</td>
						<td>${new Date(transaction.timestamp).toLocaleDateString()}</td>
						<td>${transaction.userId}</td>
					</tr>
				`
					)
					.join('')}
			</tbody>
		</table>
	</div>
	`
			: ''
	}

	${
		data.topArticles && data.topArticles.length > 0
			? `
	<div class="section">
		<h2>Top Performing Articles</h2>
		<table>
			<thead>
				<tr>
					<th>Name</th>
					<th>Category</th>
					<th>Price (DZD)</th>
					<th>Sales</th>
					<th>Revenue (DZD)</th>
				</tr>
			</thead>
			<tbody>
				${data.topArticles
					.map(
						(article) => `
					<tr>
						<td>${article.name}</td>
						<td>${article.category}</td>
						<td>${article.price?.toFixed(2) || '0.00'}</td>
						<td>${article.sales}</td>
						<td>${article.revenue.toFixed(2)}</td>
					</tr>
				`
					)
					.join('')}
			</tbody>
		</table>
	</div>
	`
			: ''
	}

	<div class="summary-box">
		<h3>Report Summary</h3>
		<p>This report provides a comprehensive overview of system performance, user engagement, and business metrics. 
		Key highlights include ${(data.userStats?.growthRate || 0) >= 0 ? 'positive' : 'negative'} user growth (${(data.userStats?.growthRate || 0).toFixed(1)}%), 
		${data.transactionStats?.successRate || 0}% transaction success rate, and ${data.systemHealth?.uptime || 0}% system uptime.</p>
	</div>
</body>
</html>
	`.trim();
}

export function downloadPDF(data: ReportData): void {
	const htmlContent = generatePDFContent(data);
	const printWindow = window.open('', '_blank');

	if (printWindow) {
		printWindow.document.write(htmlContent);
		printWindow.document.close();

		// Wait for content to load, then trigger print dialog
		printWindow.onload = () => {
			setTimeout(() => {
				printWindow.print();
				printWindow.close();
			}, 500);
		};
	}
}

export function exportDashboardReport(data: ReportData, format: 'csv' | 'pdf' = 'csv'): void {
	if (format === 'csv') {
		downloadCSV(data);
	} else {
		downloadPDF(data);
	}
}
