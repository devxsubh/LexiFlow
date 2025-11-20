import Contract from '../models/contract.js';
import User from '../models/userModel.js';
// Consultation model removed - simplified app
import Conversation from '../models/conversation.model.js';
import APIError from '../utils/apiError.js';
import httpStatus from 'http-status';

class DashboardService {
	async getDashboardStats(userId, period = 'week') {
		try {
			const cacheKey = `dashboard_stats:${userId}:${period}`;

			// Calculate fresh stats (no longer using DashboardStats model)
			const stats = await this.calculateDashboardStats(userId, period);

			return stats;
		} catch (error) {
			throw new APIError('Failed to get dashboard stats', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async calculateDashboardStats(userId, period = 'week') {
		try {
			const now = new Date();
			let startDate;

			// Calculate start date based on period
			switch (period) {
				case 'week':
					startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
					break;
				case 'month':
					startDate = new Date(now.getFullYear(), now.getMonth(), 1);
					break;
				case 'year':
					startDate = new Date(now.getFullYear(), 0, 1);
					break;
				default:
					startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			}

			// Get previous period for comparison
			const previousStartDate = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));

			// Calculate current period metrics
			const currentStats = await this.calculateMetrics(userId, startDate, now);

			// Calculate previous period metrics
			const previousStats = await this.calculateMetrics(userId, previousStartDate, startDate);

			// Calculate percentage changes
			const metrics = {
				totalContracts: {
					count: currentStats.totalContracts,
					change: this.calculatePercentageChange(currentStats.totalContracts, previousStats.totalContracts),
					trend: await this.generateTrendData(userId, 'contracts', period)
				},
				totalClients: {
					count: currentStats.totalClients,
					change: this.calculatePercentageChange(currentStats.totalClients, previousStats.totalClients),
					trend: await this.generateTrendData(userId, 'clients', period)
				},
				aiConversations: {
					count: currentStats.aiConversations,
					change: this.calculatePercentageChange(currentStats.aiConversations, previousStats.aiConversations),
					trend: await this.generateTrendData(userId, 'aiConversations', period)
				}
			};

			// Return stats object (no longer saving to database)
			return {
				userId,
				period,
				metrics,
				metadata: {
					lastUpdated: now,
					dataSource: 'calculated'
				}
			};
		} catch (error) {
			throw new APIError('Failed to calculate dashboard stats', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async calculateMetrics(userId, startDate, endDate) {
		try {
			// Count contracts
			const totalContracts = await Contract.countDocuments({
				createdBy: userId,
				createdAt: { $gte: startDate, $lte: endDate }
			});

			// Count unique clients (from contracts)
			const contracts = await Contract.find({
				createdBy: userId,
				createdAt: { $gte: startDate, $lte: endDate }
			}).distinct('clientId');

			const totalClients = contracts.length;

			// Count AI conversations
			const aiConversations = await Conversation.countDocuments({
				userId,
				createdAt: { $gte: startDate, $lte: endDate },
				type: 'ai'
			});

			return {
				totalContracts,
				totalClients,
				aiConversations
			};
		} catch (error) {
			throw new APIError('Failed to calculate metrics', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	calculatePercentageChange(current, previous) {
		if (previous === 0) {
			return current > 0 ? 100 : 0;
		}
		return Math.round(((current - previous) / previous) * 100);
	}

	async generateTrendData(userId, metricType, period) {
		try {
			const now = new Date();
			let days = 7;
			let interval = 24 * 60 * 60 * 1000; // 1 day

			switch (period) {
				case 'month':
					days = 30;
					break;
				case 'year':
					days = 365;
					interval = 7 * 24 * 60 * 60 * 1000; // 1 week
					break;
			}

			const trend = [];
			const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

			for (let i = 0; i < days; i++) {
				const dateStart = new Date(startDate.getTime() + i * interval);
				const dateEnd = new Date(dateStart.getTime() + interval);

				let count = 0;

				switch (metricType) {
					case 'contracts':
						count = await Contract.countDocuments({
							createdBy: userId,
							createdAt: { $gte: dateStart, $lt: dateEnd }
						});
						break;
					case 'clients':
						const clientContracts = await Contract.find({
							createdBy: userId,
							createdAt: { $gte: dateStart, $lt: dateEnd }
						}).distinct('clientId');
						count = clientContracts.length;
						break;
					case 'aiConversations':
						count = await Conversation.countDocuments({
							userId,
							createdAt: { $gte: dateStart, $lt: dateEnd },
							type: 'ai'
						});
						break;
				}

				trend.push(count);
			}

			return trend;
		} catch (error) {
			return Array(7).fill(0); // Return default trend if error
		}
	}

	async getStatsHistory(userId, startDate, endDate, period = 'week') {
		try {
			// Calculate stats for the date range (no longer using DashboardStats model)
			const history = await this.calculateMetrics(userId, new Date(startDate), new Date(endDate));

			return history;
		} catch (error) {
			throw new APIError('Failed to get stats history', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async getMetricDetails(userId, metric, period = 'week', limit = 10) {
		try {
			let details = {};

			switch (metric) {
				case 'totalContracts':
					details = await this.getContractDetails(userId, period, limit);
					break;
				case 'totalClients':
					details = await this.getClientDetails(userId, period, limit);
					break;
				case 'aiConversations':
					details = await this.getAIConversationDetails(userId, period, limit);
					break;
			}

			return details;
		} catch (error) {
			throw new APIError('Failed to get metric details', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async getContractDetails(userId, period, limit) {
		const contracts = await Contract.find({ createdBy: userId })
			.sort({ createdAt: -1 })
			.limit(limit)
			.populate('clientId', 'firstName lastName email')
			.select('title status createdAt clientId');

		return {
			metric: 'totalContracts',
			data: contracts,
			summary: {
				total: contracts.length,
				active: contracts.filter((c) => c.status === 'active').length,
				pending: contracts.filter((c) => c.status === 'pending').length,
				completed: contracts.filter((c) => c.status === 'completed').length
			}
		};
	}

	async getClientDetails(userId, period, limit) {
		const contracts = await Contract.find({ createdBy: userId })
			.populate('clientId', 'firstName lastName email phone')
			.select('clientId createdAt');

		const uniqueClients = contracts
			.reduce((acc, contract) => {
				if (contract.clientId && !acc.find((c) => c._id.toString() === contract.clientId._id.toString())) {
					acc.push(contract.clientId);
				}
				return acc;
			}, [])
			.slice(0, limit);

		return {
			metric: 'totalClients',
			data: uniqueClients,
			summary: {
				total: uniqueClients.length,
				active: uniqueClients.length // All clients are considered active
			}
		};
	}

	// Consultation details removed - simplified app

	async getAIConversationDetails(userId, period, limit) {
		const conversations = await Conversation.find({
			userId,
			type: 'ai'
		})
			.sort({ createdAt: -1 })
			.limit(limit)
			.select('title createdAt messageCount lastMessageAt');

		return {
			metric: 'aiConversations',
			data: conversations,
			summary: {
				total: conversations.length,
				active: conversations.filter((c) => c.lastMessageAt > new Date(Date.now() - 24 * 60 * 60 * 1000)).length,
				totalMessages: conversations.reduce((sum, c) => sum + (c.messageCount || 0), 0)
			}
		};
	}

	async refreshDashboardStats(userId) {
		try {
			// Recalculate stats for all periods (no longer using cache or DashboardStats model)
			const periods = ['week', 'month', 'year'];
			for (const period of periods) {
				await this.calculateDashboardStats(userId, period);
			}

			return { message: 'Dashboard stats refreshed successfully' };
		} catch (error) {
			throw new APIError('Failed to refresh dashboard stats', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}

export default new DashboardService();
