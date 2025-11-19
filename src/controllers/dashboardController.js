import dashboardService from '../services/dashboardService.js';
import catchAsync from '../utils/catchAsync.js';
// import httpStatus from 'http-status';

// Get dashboard statistics
export const getDashboardStats = catchAsync(async (req, res) => {
	const { period = 'week' } = req.query;
	const userId = req.user.id;

	const stats = await dashboardService.getDashboardStats(userId, period);

	res.json({
		success: true,
		data: {
			period,
			metrics: stats.metrics,
			lastUpdated: stats.metadata.lastUpdated,
			summary: {
				totalContracts: stats.metrics.totalContracts.count,
				totalClients: stats.metrics.totalClients.count,
				consultations: stats.metrics.consultations.count,
				aiConversations: stats.metrics.aiConversations.count
			}
		}
	});
});

// Get dashboard statistics history
export const getStatsHistory = catchAsync(async (req, res) => {
	const { startDate, endDate, period = 'week' } = req.query;
	const userId = req.user.id;

	const history = await dashboardService.getStatsHistory(userId, startDate, endDate, period);

	res.json({
		success: true,
		data: {
			period,
			startDate,
			endDate,
			history: history.map((stat) => ({
				date: stat.date,
				metrics: stat.metrics,
				period: stat.period
			}))
		}
	});
});

// Get detailed information for a specific metric
export const getMetricDetails = catchAsync(async (req, res) => {
	const { metric } = req.params;
	const { period = 'week', limit = 10 } = req.query;
	const userId = req.user.id;

	const details = await dashboardService.getMetricDetails(userId, metric, period, parseInt(limit));

	res.json({
		success: true,
		data: details
	});
});

// Refresh dashboard statistics
export const refreshDashboardStats = catchAsync(async (req, res) => {
	const userId = req.user.id;

	const result = await dashboardService.refreshDashboardStats(userId);

	res.json({
		success: true,
		message: result.message
	});
});

// Get activity overview (simplified version for dashboard cards)
export const getActivityOverview = catchAsync(async (req, res) => {
	const { period = 'week' } = req.query;
	const userId = req.user.id;

	const stats = await dashboardService.getDashboardStats(userId, period);

	// Format response to match dashboard UI requirements
	const activityData = {
		totalContracts: {
			title: 'Total Contracts',
			value: stats.metrics.totalContracts.count,
			change: stats.metrics.totalContracts.change,
			trend: stats.metrics.totalContracts.trend,
			icon: 'document',
			color: 'purple'
		},
		totalClients: {
			title: 'Total Clients',
			value: stats.metrics.totalClients.count,
			change: stats.metrics.totalClients.change,
			trend: stats.metrics.totalClients.trend,
			icon: 'users',
			color: 'blue'
		},
		consultations: {
			title: 'Consultations',
			value: stats.metrics.consultations.count,
			change: stats.metrics.consultations.change,
			trend: stats.metrics.consultations.trend,
			icon: 'chat',
			color: 'green'
		},
		aiConversations: {
			title: 'AI Conversations',
			value: stats.metrics.aiConversations.count,
			change: stats.metrics.aiConversations.change,
			trend: stats.metrics.aiConversations.trend,
			icon: 'robot',
			color: 'orange'
		}
	};

	res.json({
		success: true,
		data: {
			period,
			activity: activityData,
			lastUpdated: stats.metadata.lastUpdated
		}
	});
});

// Get trend data for charts
export const getTrendData = catchAsync(async (req, res) => {
	const { metric, period = 'week' } = req.query;
	const userId = req.user.id;

	const stats = await dashboardService.getDashboardStats(userId, period);

	let trendData = [];
	let labels = [];

	// Generate labels based on period
	// const now = new Date();
	switch (period) {
		case 'week':
			labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
			break;
		case 'month':
			labels = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);
			break;
		case 'year':
			labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
			break;
	}

	// Get trend data for specific metric
	switch (metric) {
		case 'totalContracts':
			trendData = stats.metrics.totalContracts.trend;
			break;
		case 'totalClients':
			trendData = stats.metrics.totalClients.trend;
			break;
		case 'consultations':
			trendData = stats.metrics.consultations.trend;
			break;
		case 'aiConversations':
			trendData = stats.metrics.aiConversations.trend;
			break;
		default:
			trendData = [];
	}

	res.json({
		success: true,
		data: {
			metric,
			period,
			labels,
			trend: trendData,
			currentValue: stats.metrics[metric]?.count || 0,
			change: stats.metrics[metric]?.change || 0
		}
	});
});

// Get dashboard summary
export const getDashboardSummary = catchAsync(async (req, res) => {
	const userId = req.user.id;

	// Get stats for all periods
	const weekStats = await dashboardService.getDashboardStats(userId, 'week');
	const monthStats = await dashboardService.getDashboardStats(userId, 'month');
	const yearStats = await dashboardService.getDashboardStats(userId, 'year');

	const summary = {
		overview: {
			totalContracts: weekStats.metrics.totalContracts.count,
			totalClients: weekStats.metrics.totalClients.count,
			consultations: weekStats.metrics.consultations.count,
			aiConversations: weekStats.metrics.aiConversations.count
		},
		periods: {
			week: {
				contracts: weekStats.metrics.totalContracts.count,
				clients: weekStats.metrics.totalClients.count,
				consultations: weekStats.metrics.consultations.count,
				aiConversations: weekStats.metrics.aiConversations.count
			},
			month: {
				contracts: monthStats.metrics.totalContracts.count,
				clients: monthStats.metrics.totalClients.count,
				consultations: monthStats.metrics.consultations.count,
				aiConversations: monthStats.metrics.aiConversations.count
			},
			year: {
				contracts: yearStats.metrics.totalContracts.count,
				clients: yearStats.metrics.totalClients.count,
				consultations: yearStats.metrics.consultations.count,
				aiConversations: yearStats.metrics.aiConversations.count
			}
		},
		changes: {
			contracts: weekStats.metrics.totalContracts.change,
			clients: weekStats.metrics.totalClients.change,
			consultations: weekStats.metrics.consultations.change,
			aiConversations: weekStats.metrics.aiConversations.change
		},
		lastUpdated: weekStats.metadata.lastUpdated
	};

	res.json({
		success: true,
		data: summary
	});
});

export default {
	getDashboardStats,
	getStatsHistory,
	getMetricDetails,
	refreshDashboardStats,
	getActivityOverview,
	getTrendData,
	getDashboardSummary
};
