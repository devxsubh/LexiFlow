import mongoose from 'mongoose';
import toJSON from './plugins/toJSONPlugin.js';
import paginate from './plugins/paginatePlugin.js';

const notificationSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.SchemaTypes.ObjectId,
			ref: 'User',
			required: true,
			index: true
		},
		type: {
			type: String,
			enum: [
				'contract_shared',
				'contract_accessed',
				'contract_updated',
				'contract_comment',
				'payment_received',
				'payment_failed',
				'subscription_expired',
				'subscription_renewed',
				'help_ticket_created',
				'help_ticket_responded',
				'help_ticket_assigned',
				'system_announcement',
				'security_alert',
				'email_verified'
			],
			required: true
		},
		title: {
			type: String,
			required: true,
			trim: true
		},
		message: {
			type: String,
			required: true,
			trim: true
		},
		data: {
			type: mongoose.Schema.Types.Mixed,
			default: {}
		},
		priority: {
			type: String,
			enum: ['low', 'medium', 'high', 'urgent'],
			default: 'medium'
		},
		read: {
			type: Boolean,
			default: false
		},
		readAt: {
			type: Date
		},
		actionUrl: {
			type: String,
			trim: true
		},
		actionText: {
			type: String,
			trim: true
		},
		expiresAt: {
			type: Date,
			index: { expireAfterSeconds: 0 } // TTL index
		},
		metadata: {
			source: {
				type: String,
				enum: ['system', 'user', 'admin', 'automated'],
				default: 'system'
			},
			category: {
				type: String,
				enum: ['contract', 'payment', 'support', 'security', 'system', 'account'],
				default: 'system'
			},
			tags: [String],
			relatedEntity: {
				type: mongoose.SchemaTypes.ObjectId,
				refPath: 'metadata.relatedEntityType'
			},
			relatedEntityType: {
				type: String,
				enum: ['Contract', 'HelpCenter', 'Subscription', 'User']
			}
		}
	},
	{
		timestamps: true
	}
);

// Add plugins
notificationSchema.plugin(toJSON);
notificationSchema.plugin(paginate);

// Indexes for performance
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
notificationSchema.index({ 'metadata.category': 1, createdAt: -1 });
notificationSchema.index({ priority: 1, createdAt: -1 });

// Static methods
notificationSchema.statics.getUnreadCount = function (userId) {
	return this.countDocuments({ userId, read: false });
};

notificationSchema.statics.getRecentNotifications = function (userId, limit = 20) {
	return this.find({ userId }).sort({ createdAt: -1 }).limit(limit).populate('metadata.relatedEntity');
};

notificationSchema.statics.markAllAsRead = function (userId) {
	return this.updateMany({ userId, read: false }, { read: true, readAt: new Date() });
};

notificationSchema.statics.getNotificationsByType = function (userId, type, limit = 10) {
	return this.find({ userId, type }).sort({ createdAt: -1 }).limit(limit);
};

// Instance methods
notificationSchema.methods.markAsRead = function () {
	this.read = true;
	this.readAt = new Date();
	return this.save();
};

notificationSchema.methods.toNotificationResponse = function () {
	return {
		id: this._id,
		type: this.type,
		title: this.title,
		message: this.message,
		data: this.data,
		priority: this.priority,
		read: this.read,
		readAt: this.readAt,
		actionUrl: this.actionUrl,
		actionText: this.actionText,
		metadata: this.metadata,
		createdAt: this.createdAt,
		updatedAt: this.updatedAt
	};
};

export default mongoose.model('Notification', notificationSchema);
