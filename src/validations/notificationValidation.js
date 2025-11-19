import Joi from 'joi';
import { mongoId } from './customValidation.js';

// ============================================================================
// NOTIFICATION CRUD VALIDATIONS
// ============================================================================

/**
 * Get notifications validation
 */
const getNotifications = {
	query: Joi.object().keys({
		page: Joi.number().integer().min(1).default(1),
		limit: Joi.number().integer().min(1).max(100).default(20),
		type: Joi.string().valid(
			'contract_shared',
			'contract_accessed',
			'contract_updated',
			'contract_comment',
			'consultation_scheduled',
			'consultation_reminder',
			'consultation_started',
			'consultation_ended',
			'payment_received',
			'payment_failed',
			'subscription_expired',
			'subscription_renewed',
			'help_ticket_created',
			'help_ticket_responded',
			'help_ticket_assigned',
			'portal_invitation',
			'portal_upload',
			'portal_comment',
			'system_announcement',
			'security_alert'
		),
		read: Joi.boolean(),
		priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
		category: Joi.string().valid('contract', 'consultation', 'payment', 'support', 'security', 'system')
	})
};

/**
 * Mark notification as read validation
 */
const markAsRead = {
	params: Joi.object().keys({
		notificationId: Joi.string().custom(mongoId).required().messages({
			'string.base': 'Notification ID must be a string',
			'any.required': 'Notification ID is required',
			'any.custom': 'Notification ID must be a valid MongoDB ObjectId'
		})
	})
};

/**
 * Delete notification validation
 */
const deleteNotification = {
	params: Joi.object().keys({
		notificationId: Joi.string().custom(mongoId).required().messages({
			'string.base': 'Notification ID must be a string',
			'any.required': 'Notification ID is required',
			'any.custom': 'Notification ID must be a valid MongoDB ObjectId'
		})
	})
};

// ============================================================================
// NOTIFICATION PREFERENCES VALIDATIONS
// ============================================================================

/**
 * Update notification preferences validation
 */
const updatePreferences = {
	body: Joi.object()
		.keys({
			email: Joi.object().keys({
				contract_shared: Joi.boolean(),
				contract_accessed: Joi.boolean(),
				contract_updated: Joi.boolean(),
				consultation_scheduled: Joi.boolean(),
				consultation_reminder: Joi.boolean(),
				payment_received: Joi.boolean(),
				payment_failed: Joi.boolean(),
				subscription_expired: Joi.boolean(),
				subscription_renewed: Joi.boolean(),
				help_ticket_created: Joi.boolean(),
				help_ticket_responded: Joi.boolean(),
				help_ticket_assigned: Joi.boolean(),
				portal_invitation: Joi.boolean(),
				portal_upload: Joi.boolean(),
				portal_comment: Joi.boolean(),
				system_announcement: Joi.boolean(),
				security_alert: Joi.boolean()
			}),
			push: Joi.object().keys({
				contract_shared: Joi.boolean(),
				contract_accessed: Joi.boolean(),
				contract_updated: Joi.boolean(),
				consultation_scheduled: Joi.boolean(),
				consultation_reminder: Joi.boolean(),
				payment_received: Joi.boolean(),
				payment_failed: Joi.boolean(),
				subscription_expired: Joi.boolean(),
				subscription_renewed: Joi.boolean(),
				help_ticket_created: Joi.boolean(),
				help_ticket_responded: Joi.boolean(),
				help_ticket_assigned: Joi.boolean(),
				portal_invitation: Joi.boolean(),
				portal_upload: Joi.boolean(),
				portal_comment: Joi.boolean(),
				system_announcement: Joi.boolean(),
				security_alert: Joi.boolean()
			}),
			inApp: Joi.object().keys({
				contract_shared: Joi.boolean(),
				contract_accessed: Joi.boolean(),
				contract_updated: Joi.boolean(),
				consultation_scheduled: Joi.boolean(),
				consultation_reminder: Joi.boolean(),
				payment_received: Joi.boolean(),
				payment_failed: Joi.boolean(),
				subscription_expired: Joi.boolean(),
				subscription_renewed: Joi.boolean(),
				help_ticket_created: Joi.boolean(),
				help_ticket_responded: Joi.boolean(),
				help_ticket_assigned: Joi.boolean(),
				portal_invitation: Joi.boolean(),
				portal_upload: Joi.boolean(),
				portal_comment: Joi.boolean(),
				system_announcement: Joi.boolean(),
				security_alert: Joi.boolean()
			})
		})
		.min(1)
		.messages({
			'object.min': 'At least one notification channel preference must be provided'
		})
};

// ============================================================================
// ADMIN VALIDATIONS
// ============================================================================

/**
 * Create system announcement validation
 */
const createSystemAnnouncement = {
	body: Joi.object().keys({
		title: Joi.string().required().trim().min(1).max(200).messages({
			'string.base': 'Title must be a string',
			'string.empty': 'Title cannot be empty',
			'string.min': 'Title must be at least 1 character long',
			'string.max': 'Title cannot exceed 200 characters',
			'any.required': 'Title is required'
		}),
		message: Joi.string().required().trim().min(1).max(1000).messages({
			'string.base': 'Message must be a string',
			'string.empty': 'Message cannot be empty',
			'string.min': 'Message must be at least 1 character long',
			'string.max': 'Message cannot exceed 1000 characters',
			'any.required': 'Message is required'
		}),
		priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium').messages({
			'any.only': 'Priority must be one of: low, medium, high, urgent'
		}),
		targetUsers: Joi.string().valid('all', 'premium', 'free', 'specific').default('all').messages({
			'any.only': 'Target users must be one of: all, premium, free, specific'
		}),
		actionUrl: Joi.string().uri().allow('').messages({
			'string.uri': 'Action URL must be a valid URI'
		}),
		actionText: Joi.string().trim().max(50).allow('').messages({
			'string.max': 'Action text cannot exceed 50 characters'
		})
	})
};

/**
 * Cleanup old notifications validation
 */
const cleanupOldNotifications = {
	query: Joi.object().keys({
		daysOld: Joi.number().integer().min(1).max(365).default(30).messages({
			'number.base': 'Days old must be a number',
			'number.integer': 'Days old must be an integer',
			'number.min': 'Days old must be at least 1',
			'number.max': 'Days old cannot exceed 365'
		})
	})
};

export default {
	getNotifications,
	markAsRead,
	deleteNotification,
	updatePreferences,
	createSystemAnnouncement,
	cleanupOldNotifications
};
