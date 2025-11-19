import Joi from 'joi';

const getDashboardStats = {
	query: Joi.object().keys({
		period: Joi.string().valid('week', 'month', 'year').default('week'),
		startDate: Joi.date().iso(),
		endDate: Joi.date().iso().min(Joi.ref('startDate')),
		metric: Joi.string().valid('totalContracts', 'totalClients', 'consultations', 'aiConversations')
	})
};

const updateDashboardStats = {
	body: Joi.object().keys({
		period: Joi.string().valid('week', 'month', 'year').default('week'),
		metrics: Joi.object({
			totalContracts: Joi.object({
				count: Joi.number().min(0).required(),
				change: Joi.number().optional(),
				trend: Joi.array().items(Joi.number()).optional()
			}).optional(),
			totalClients: Joi.object({
				count: Joi.number().min(0).required(),
				change: Joi.number().optional(),
				trend: Joi.array().items(Joi.number()).optional()
			}).optional(),
			consultations: Joi.object({
				count: Joi.number().min(0).required(),
				change: Joi.number().optional(),
				trend: Joi.array().items(Joi.number()).optional()
			}).optional(),
			aiConversations: Joi.object({
				count: Joi.number().min(0).required(),
				change: Joi.number().optional(),
				trend: Joi.array().items(Joi.number()).optional()
			}).optional()
		}).min(1)
	})
};

const getStatsHistory = {
	query: Joi.object().keys({
		startDate: Joi.date().iso().required(),
		endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
		period: Joi.string().valid('week', 'month', 'year').default('week'),
		limit: Joi.number().integer().min(1).max(100).default(30)
	})
};

const getMetricDetails = {
	params: Joi.object().keys({
		metric: Joi.string().valid('totalContracts', 'totalClients', 'consultations', 'aiConversations').required()
	}),
	query: Joi.object().keys({
		period: Joi.string().valid('week', 'month', 'year').default('week'),
		limit: Joi.number().integer().min(1).max(100).default(10)
	})
};

export default {
	getDashboardStats,
	updateDashboardStats,
	getStatsHistory,
	getMetricDetails
};
