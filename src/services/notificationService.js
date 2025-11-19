import Notification from '../models/Notification.js';
import cacheService from './cacheService.js';
import logger from '../config/logger.js';
import APIError from '../utils/apiError.js';
import httpStatus from 'http-status';

class NotificationService {
	constructor() {
		// Store active SSE connections
		this.activeConnections = new Map();
		// Store user notification preferences
		this.userPreferences = new Map();
	}

	// ============================================================================
	// SSE CONNECTION MANAGEMENT
	// ============================================================================

	/**
	 * Add SSE connection for a user
	 * @param {string} userId - User ID
	 * @param {Object} res - Express response object
	 */
	addSSEConnection(userId, res) {
		// CORS for Vite dev and production
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Credentials', 'true');
		res.setHeader('Access-Control-Allow-Headers', 'Cache-Control, Authorization, Content-Type');

		// REQUIRED SSE headers
		res.setHeader('Content-Type', 'text/event-stream');
		res.setHeader('Cache-Control', 'no-cache, no-transform');
		res.setHeader('Connection', 'keep-alive');

		// If behind nginx/ingress, disable buffering
		res.setHeader('X-Accel-Buffering', 'no');

		// Important: flush headers immediately
		if (res.flushHeaders) {
			res.flushHeaders();
		}

		// Send initial connection message
		this.sendSSEMessage(res, 'connected', { message: 'Connected to notifications' });

		// Store connection
		this.activeConnections.set(userId, res);

		// Handle connection close
		res.on('close', () => {
			this.removeSSEConnection(userId);
		});

		// Send heartbeat every 25 seconds (keep the connection alive)
		const heartbeat = setInterval(() => {
			if (this.activeConnections.has(userId)) {
				this.sendSSEMessage(res, 'heartbeat', { timestamp: Date.now() });
			} else {
				clearInterval(heartbeat);
			}
		}, 25000);

		logger.info(`SSE connection established for user: ${userId}`);
	}

	/**
	 * Remove SSE connection for a user
	 * @param {string} userId - User ID
	 */
	removeSSEConnection(userId) {
		if (this.activeConnections.has(userId)) {
			this.activeConnections.delete(userId);
			logger.info(`SSE connection closed for user: ${userId}`);
		}
	}

	/**
	 * Send SSE message to a specific user
	 * @param {Object} res - Express response object
	 * @param {string} event - Event type
	 * @param {Object} data - Data to send
	 */
	sendSSEMessage(res, event, data) {
		try {
			const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
			res.write(message);
		} catch (error) {
			logger.error('Error sending SSE message:', error);
		}
	}

	/**
	 * Broadcast notification to user via SSE
	 * @param {string} userId - User ID
	 * @param {Object} notification - Notification object
	 */
	broadcastNotification(userId, notification) {
		const connection = this.activeConnections.get(userId);
		if (connection) {
			this.sendSSEMessage(connection, 'notification', notification);
		}
	}

	// ============================================================================
	// NOTIFICATION CRUD OPERATIONS
	// ============================================================================

	/**
	 * Create a new notification
	 * @param {Object} notificationData - Notification data
	 * @returns {Promise<Object>} Created notification
	 */
	async createNotification(notificationData) {
		try {
			const notification = await Notification.create(notificationData);

			// Broadcast to user if connected via SSE
			this.broadcastNotification(notification.userId.toString(), notification.toNotificationResponse());

			// Cache notification count
			await this.updateUnreadCountCache(notification.userId);

			logger.info(`Notification created: ${notification._id} for user: ${notification.userId}`);
			return notification;
		} catch (error) {
			logger.error('Error creating notification:', error);
			throw new APIError('Failed to create notification', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Get notifications for a user
	 * @param {string} userId - User ID
	 * @param {Object} options - Query options
	 * @returns {Promise<Object>} Paginated notifications
	 */
	async getNotifications(userId, options = {}) {
		try {
			const { page = 1, limit = 20, type, read, priority, category } = options;

			// Build query
			const query = { userId };
			if (type) query.type = type;
			if (read !== undefined) query.read = read;
			if (priority) query.priority = priority;
			if (category) query['metadata.category'] = category;

			// Get paginated results
			const result = await Notification.paginate(
				{
					page,
					limit,
					sortBy: 'createdAt',
					sortDirection: 'desc'
				},
				null,
				query
			);

			const totalPages = Math.ceil(result.totalResults / limit);

			return {
				notifications: result.results.map((notification) => notification.toNotificationResponse()),
				pagination: {
					page,
					limit,
					totalPages,
					totalDocs: result.totalResults,
					hasNextPage: page < totalPages,
					hasPrevPage: page > 1
				}
			};
		} catch (error) {
			logger.error('Error getting notifications:', error);
			throw new APIError('Failed to get notifications', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Mark notification as read
	 * @param {string} notificationId - Notification ID
	 * @param {string} userId - User ID
	 * @returns {Promise<Object>} Updated notification
	 */
	async markAsRead(notificationId, userId) {
		try {
			const notification = await Notification.findOneAndUpdate(
				{ _id: notificationId, userId },
				{ read: true, readAt: new Date() },
				{ new: true }
			);

			if (!notification) {
				throw new APIError('Notification not found', httpStatus.NOT_FOUND);
			}

			// Update cache
			await this.updateUnreadCountCache(userId);

			return notification.toNotificationResponse();
		} catch (error) {
			logger.error('Error marking notification as read:', error);
			throw error;
		}
	}

	/**
	 * Mark all notifications as read for a user
	 * @param {string} userId - User ID
	 * @returns {Promise<Object>} Update result
	 */
	async markAllAsRead(userId) {
		try {
			const result = await Notification.markAllAsRead(userId);

			// Update cache
			await this.updateUnreadCountCache(userId);

			return result;
		} catch (error) {
			logger.error('Error marking all notifications as read:', error);
			throw new APIError('Failed to mark all notifications as read', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Delete notification
	 * @param {string} notificationId - Notification ID
	 * @param {string} userId - User ID
	 * @returns {Promise<Object>} Deletion result
	 */
	async deleteNotification(notificationId, userId) {
		try {
			const notification = await Notification.findOneAndDelete({ _id: notificationId, userId });

			if (!notification) {
				throw new APIError('Notification not found', httpStatus.NOT_FOUND);
			}

			// Update cache
			await this.updateUnreadCountCache(userId);

			return { success: true, message: 'Notification deleted successfully' };
		} catch (error) {
			logger.error('Error deleting notification:', error);
			throw error;
		}
	}

	/**
	 * Get unread notification count
	 * @param {string} userId - User ID
	 * @returns {Promise<number>} Unread count
	 */
	async getUnreadCount(userId) {
		try {
			// Try cache first
			const cachedCount = await cacheService.getCachedUnreadCount(userId);
			if (cachedCount !== null) {
				return cachedCount;
			}

			// Get from database
			const count = await Notification.getUnreadCount(userId);

			// Cache the result
			await cacheService.cacheUnreadCount(userId, count);

			return count;
		} catch (error) {
			logger.error('Error getting unread count:', error);
			throw new APIError('Failed to get unread count', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	// ============================================================================
	// NOTIFICATION TEMPLATES
	// ============================================================================

	/**
	 * Create contract shared notification
	 * @param {string} userId - User ID
	 * @param {Object} contractData - Contract data
	 * @returns {Promise<Object>} Created notification
	 */
	async createContractSharedNotification(userId, contractData) {
		return this.createNotification({
			userId,
			type: 'contract_shared',
			title: 'Contract Shared',
			message: `Your contract "${contractData.title}" has been shared with ${contractData.sharedWithCount} recipient(s)`,
			data: {
				contractId: contractData.contractId,
				contractTitle: contractData.title,
				sharedWithCount: contractData.sharedWithCount
			},
			priority: 'medium',
			actionUrl: `/contracts/${contractData.contractId}`,
			actionText: 'View Contract',
			metadata: {
				source: 'system',
				category: 'contract',
				relatedEntity: contractData.contractId,
				relatedEntityType: 'Contract'
			}
		});
	}

	// Consultation reminder notification removed - consultations feature removed

	/**
	 * Create payment received notification
	 * @param {string} userId - User ID
	 * @param {Object} paymentData - Payment data
	 * @returns {Promise<Object>} Created notification
	 */
	async createPaymentReceivedNotification(userId, paymentData) {
		return this.createNotification({
			userId,
			type: 'payment_received',
			title: 'Payment Received',
			message: `Payment of ₹${paymentData.amount} has been received successfully`,
			data: {
				amount: paymentData.amount,
				transactionId: paymentData.transactionId,
				currency: paymentData.currency || 'INR'
			},
			priority: 'medium',
			actionUrl: '/payments',
			actionText: 'View Payment',
			metadata: {
				source: 'system',
				category: 'payment'
			}
		});
	}

	/**
	 * Create help ticket response notification
	 * @param {string} userId - User ID
	 * @param {Object} ticketData - Ticket data
	 * @returns {Promise<Object>} Created notification
	 */
	async createHelpTicketResponseNotification(userId, ticketData) {
		return this.createNotification({
			userId,
			type: 'help_ticket_responded',
			title: 'Support Response',
			message: `You have received a response to your support ticket: "${ticketData.subject}"`,
			data: {
				ticketId: ticketData.ticketId,
				subject: ticketData.subject,
				responsePreview: ticketData.responsePreview
			},
			priority: 'medium',
			actionUrl: `/support/tickets/${ticketData.ticketId}`,
			actionText: 'View Response',
			metadata: {
				source: 'admin',
				category: 'support',
				relatedEntity: ticketData.ticketId,
				relatedEntityType: 'HelpCenter'
			}
		});
	}

	// ============================================================================
	// CACHE MANAGEMENT
	// ============================================================================

	/**
	 * Update unread count cache
	 * @param {string} userId - User ID
	 */
	async updateUnreadCountCache(userId) {
		try {
			const count = await Notification.getUnreadCount(userId);
			await cacheService.cacheUnreadCount(userId, count);
		} catch (error) {
			logger.error('Error updating unread count cache:', error);
		}
	}

	/**
	 * Clear notification cache for user
	 * @param {string} userId - User ID
	 */
	async clearNotificationCache(userId) {
		try {
			await cacheService.invalidateCache(`unread_count:${userId}`);
			await cacheService.invalidateCache(`notifications:${userId}:*`);
		} catch (error) {
			logger.error('Error clearing notification cache:', error);
		}
	}

	// ============================================================================
	// BULK OPERATIONS
	// ============================================================================

	/**
	 * Create multiple notifications
	 * @param {Array} notificationsData - Array of notification data
	 * @returns {Promise<Array>} Created notifications
	 */
	async createBulkNotifications(notificationsData) {
		try {
			const notifications = await Notification.insertMany(notificationsData);

			// Broadcast to connected users
			notifications.forEach((notification) => {
				this.broadcastNotification(notification.userId.toString(), notification.toNotificationResponse());
			});

			// Update cache for all affected users
			const userIds = [...new Set(notifications.map((n) => n.userId.toString()))];
			await Promise.all(userIds.map((userId) => this.updateUnreadCountCache(userId)));

			return notifications;
		} catch (error) {
			logger.error('Error creating bulk notifications:', error);
			throw new APIError('Failed to create bulk notifications', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Clean up old notifications
	 * @param {number} daysOld - Number of days old to clean up
	 * @returns {Promise<Object>} Cleanup result
	 */
	async cleanupOldNotifications(daysOld = 30) {
		try {
			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - daysOld);

			const result = await Notification.deleteMany({
				createdAt: { $lt: cutoffDate },
				read: true
			});

			logger.info(`Cleaned up ${result.deletedCount} old notifications`);
			return result;
		} catch (error) {
			logger.error('Error cleaning up old notifications:', error);
			throw new APIError('Failed to cleanup old notifications', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}

export default new NotificationService();
