import mongoose from 'mongoose';
import toJSON from './plugins/toJSONPlugin';
import paginate from './plugins/paginatePlugin';

const helpCenterSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true
		},
		subject: {
			type: String,
			required: true,
			trim: true,
			maxlength: 200
		},
		message: {
			type: String,
			required: true,
			trim: true,
			maxlength: 2000
		},
		category: {
			type: String,
			required: true,
			enum: ['general', 'technical', 'billing', 'consultation', 'contract', 'account', 'feature_request', 'bug_report', 'other'],
			default: 'general'
		},
		priority: {
			type: String,
			enum: ['low', 'medium', 'high', 'urgent'],
			default: 'medium'
		},
		status: {
			type: String,
			enum: ['open', 'in_progress', 'resolved', 'closed'],
			default: 'open'
		},
		assignedTo: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			default: null
		},
		response: {
			message: {
				type: String,
				trim: true,
				maxlength: 2000
			},
			respondedBy: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User'
			},
			respondedAt: {
				type: Date
			}
		},
		escalated: {
			type: Boolean,
			default: false
		},
		escalatedAt: {
			type: Date
		},
		resolvedAt: {
			type: Date
		},
		closedAt: {
			type: Date
		}
	},
	{
		timestamps: true
	}
);

// Indexes for better query performance
helpCenterSchema.index({ userId: 1 });
helpCenterSchema.index({ status: 1 });
helpCenterSchema.index({ category: 1 });
helpCenterSchema.index({ priority: 1 });
helpCenterSchema.index({ createdAt: -1 });
helpCenterSchema.index({ assignedTo: 1 });

// Add plugins
helpCenterSchema.plugin(toJSON);
helpCenterSchema.plugin(paginate);

// Virtual field to get user details
helpCenterSchema.virtual('user', {
	ref: 'User',
	localField: 'userId',
	foreignField: '_id',
	justOne: true
});

// Virtual field to get assigned staff details
helpCenterSchema.virtual('assignedStaff', {
	ref: 'User',
	localField: 'assignedTo',
	foreignField: '_id',
	justOne: true
});

// Pre-save middleware to update timestamps
helpCenterSchema.pre('save', function (next) {
	if (this.isModified('status')) {
		if (this.status === 'resolved' && !this.resolvedAt) {
			this.resolvedAt = new Date();
		}
		if (this.status === 'closed' && !this.closedAt) {
			this.closedAt = new Date();
		}
	}
	next();
});

const HelpCenter = mongoose.model('HelpCenter', helpCenterSchema);

export default HelpCenter;
