import mongoose from 'mongoose';
import toJSON from './plugins/toJSONPlugin.js';

const dashboardStatsSchema = new mongoose.Schema(
	{
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		date: { type: Date, required: true, default: Date.now },
		period: {
			type: String,
			enum: ['week', 'month', 'year'],
			default: 'week'
		},
		metrics: {
			totalContracts: {
				count: { type: Number, default: 0 },
				change: { type: Number, default: 0 }, // percentage change
				trend: [{ type: Number }] // array of values for graph
			},
			totalClients: {
				count: { type: Number, default: 0 },
				change: { type: Number, default: 0 },
				trend: [{ type: Number }]
			},
			consultations: {
				count: { type: Number, default: 0 },
				change: { type: Number, default: 0 },
				trend: [{ type: Number }]
			},
			aiConversations: {
				count: { type: Number, default: 0 },
				change: { type: Number, default: 0 },
				trend: [{ type: Number }]
			}
		},
		metadata: {
			lastUpdated: { type: Date, default: Date.now },
			dataSource: { type: String, default: 'system' }
		}
	},
	{ timestamps: true }
);

dashboardStatsSchema.plugin(toJSON);

// Indexes for better query performance
dashboardStatsSchema.index({ userId: 1, date: -1 });
dashboardStatsSchema.index({ userId: 1, period: 1 });
dashboardStatsSchema.index({ date: -1 });

// Static methods
dashboardStatsSchema.statics.getLatestStats = function (userId, period = 'week') {
	return this.findOne({ userId, period }).sort({ date: -1 });
};

dashboardStatsSchema.statics.getStatsByPeriod = function (userId, period, limit = 7) {
	return this.find({ userId, period }).sort({ date: -1 }).limit(limit);
};

dashboardStatsSchema.statics.getStatsHistory = function (userId, startDate, endDate) {
	return this.find({
		userId,
		date: { $gte: startDate, $lte: endDate }
	}).sort({ date: 1 });
};

// Instance methods
dashboardStatsSchema.methods.calculateChange = function (previousStats) {
	if (!previousStats) return this;

	const metrics = ['totalContracts', 'totalClients', 'consultations', 'aiConversations'];

	// eslint-disable-next-line prettier/prettier
	metrics.forEach(metric => {
		const current = this.metrics[metric].count;
		const previous = previousStats?.metrics[metric]?.count || 0;

		if (previous > 0) {
			this.metrics[metric].change = ((current - previous) / previous) * 100;
		} else {
			this.metrics[metric].change = current > 0 ? 100 : 0;
		}
	});

	return this;
};

export default mongoose.model('DashboardStats', dashboardStatsSchema);
