import notificationService from '../services/notificationService.js';
import catchAsync from '../utils/catchAsync.js';
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';

// ============================================================================
// SSE ENDPOINTS
// ============================================================================

/**
 * Establish SSE connection for real-time notifications
 */
export const connectSSE = catchAsync(async (req, res) => {
	let userId;

	// Check if token is provided in query parameter (for SSE)
	if (req.query.token) {
		try {
			// Verify JWT token from query parameter using public key and RS256 algorithm
			const decoded = jwt.verify(req.query.token, config.JWT_ACCESS_TOKEN_SECRET_PUBLIC, {
				algorithms: ['RS256']
			});
			userId = decoded.sub;
		} catch (error) {
			return res.status(401).json({ error: 'Invalid token' });
		}
	} else if (req.user && req.user.id) {
		// Fallback to authenticated user from middleware
		userId = req.user.id;
	} else {
		return res.status(401).json({ error: 'Authentication required' });
	}

	// Add SSE connection
	notificationService.addSSEConnection(userId, res);

	// Send initial unread count
	const unreadCount = await notificationService.getUnreadCount(userId);
	notificationService.sendSSEMessage(res, 'unread_count', { count: unreadCount });
});

// ============================================================================
// NOTIFICATION CRUD OPERATIONS
// ============================================================================

/**
 * Get notifications for authenticated user
 */
export const getNotifications = catchAsync(async (req, res) => {
	const userId = req.user.id;
	const options = {
		page: parseInt(req.query.page) || 1,
		limit: parseInt(req.query.limit) || 20,
		type: req.query.type,
		read: req.query.read === 'true' ? true : req.query.read === 'false' ? false : undefined,
		priority: req.query.priority,
		category: req.query.category
	};

	const result = await notificationService.getNotifications(userId, options);

	res.status(httpStatus.OK).json({
		success: true,
		data: result
	});
});

/**
 * Get unread notification count
 */
export const getUnreadCount = catchAsync(async (req, res) => {
	const userId = req.user.id;
	const count = await notificationService.getUnreadCount(userId);

	res.status(httpStatus.OK).json({
		success: true,
		data: { count }
	});
});

/**
 * Mark notification as read
 */
export const markAsRead = catchAsync(async (req, res) => {
	const { notificationId } = req.params;
	const userId = req.user.id;

	const notification = await notificationService.markAsRead(notificationId, userId);

	res.status(httpStatus.OK).json({
		success: true,
		data: notification
	});
});

/**
 * Mark all notifications as read
 */
export const markAllAsRead = catchAsync(async (req, res) => {
	const userId = req.user.id;
	const result = await notificationService.markAllAsRead(userId);

	res.status(httpStatus.OK).json({
		success: true,
		data: {
			modifiedCount: result.modifiedCount,
			message: 'All notifications marked as read'
		}
	});
});

/**
 * Delete notification
 */
export const deleteNotification = catchAsync(async (req, res) => {
	const { notificationId } = req.params;
	const userId = req.user.id;

	const result = await notificationService.deleteNotification(notificationId, userId);

	res.status(httpStatus.OK).json({
		success: true,
		data: result
	});
});

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

/**
 * Get notification preferences
 */
export const getPreferences = catchAsync(async (req, res) => {
	// const userId = req.user.id;

	// For now, return default preferences
	// In the future, this could be stored in user profile or separate collection
	const preferences = {
		email: {
			contract_shared: true,
			contract_accessed: true,
			consultation_reminder: true,
			payment_received: true,
			help_ticket_responded: true,
			system_announcement: true
		},
		push: {
			contract_shared: true,
			consultation_reminder: true,
			payment_received: true,
			help_ticket_responded: true,
			security_alert: true
		},
		inApp: {
			contract_shared: true,
			contract_accessed: true,
			contract_updated: true,
			consultation_scheduled: true,
			consultation_reminder: true,
			payment_received: true,
			help_ticket_responded: true,
			portal_invitation: true,
			system_announcement: true
		}
	};

	res.status(httpStatus.OK).json({
		success: true,
		data: preferences
	});
});

/**
 * Update notification preferences
 */
export const updatePreferences = catchAsync(async (req, res) => {
	// const userId = req.user.id;
	const preferences = req.body;

	// Validate preferences structure
	const validChannels = ['email', 'push', 'inApp'];
	const validTypes = [
		'contract_shared',
		'contract_accessed',
		'contract_updated',
		'consultation_scheduled',
		'consultation_reminder',
		'payment_received',
		'help_ticket_responded',
		'portal_invitation',
		'system_announcement',
		'security_alert'
	];

	// Validate structure
	for (const channel of validChannels) {
		if (preferences[channel]) {
			for (const type of validTypes) {
				if (preferences[channel][type] !== undefined) {
					if (typeof preferences[channel][type] !== 'boolean') {
						return res.status(httpStatus.BAD_REQUEST).json({
							success: false,
							message: `Invalid preference value for ${channel}.${type}`
						});
					}
				}
			}
		}
	}

	// TODO: Save preferences to database
	// For now, just return success
	res.status(httpStatus.OK).json({
		success: true,
		data: {
			message: 'Preferences updated successfully',
			preferences
		}
	});
});

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

/**
 * Create system announcement (Admin only)
 */
export const createSystemAnnouncement = catchAsync(async (req, res) => {
	const { title, message, priority = 'medium', targetUsers = 'all' } = req.body;

	// TODO: Implement logic to determine target users
	// For now, create a notification for the current user as an example
	const notification = await notificationService.createNotification({
		userId: req.user.id, // This should be determined based on targetUsers
		type: 'system_announcement',
		title,
		message,
		priority,
		metadata: {
			source: 'admin',
			category: 'system'
		}
	});

	res.status(httpStatus.CREATED).json({
		success: true,
		data: notification
	});
});

/**
 * Get notification statistics (Admin only)
 */
export const getNotificationStats = catchAsync(async (req, res) => {
	// TODO: Implement notification statistics
	const stats = {
		totalNotifications: 0,
		unreadNotifications: 0,
		notificationsByType: {},
		notificationsByPriority: {},
		recentActivity: []
	};

	res.status(httpStatus.OK).json({
		success: true,
		data: stats
	});
});

/**
 * Cleanup old notifications (Admin only)
 */
export const cleanupOldNotifications = catchAsync(async (req, res) => {
	const { daysOld = 30 } = req.query;
	const result = await notificationService.cleanupOldNotifications(parseInt(daysOld));

	res.status(httpStatus.OK).json({
		success: true,
		data: {
			message: `Cleaned up ${result.deletedCount} old notifications`,
			deletedCount: result.deletedCount
		}
	});
});

export default {
	connectSSE,
	getNotifications,
	getUnreadCount,
	markAsRead,
	markAllAsRead,
	deleteNotification,
	getPreferences,
	updatePreferences,
	createSystemAnnouncement,
	getNotificationStats,
	cleanupOldNotifications
};
