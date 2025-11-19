import express from 'express';
import validate from '../../middlewares/validate.js';
import notificationValidation from '../../validations/notificationValidation.js';
import notificationController from '../../controllers/notificationController.js';
import authenticate from '../../middlewares/authenticate.js';
import { notificationRateLimiter, sseRateLimiter } from '../../middlewares/rateLimiter.js';

const router = express.Router();

// ============================================================================
// SSE ENDPOINTS (No validation needed for SSE)
// ============================================================================

/**
 * @route   OPTIONS /api/v1/notifications/connect
 * @desc    Handle CORS preflight for SSE connection
 * @access  Public
 */
router.options('/connect', (req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Cache-Control, Authorization, Content-Type');
	res.setHeader('Access-Control-Max-Age', '86400');
	res.status(200).end();
});

/**
 * @route   GET /api/v1/notifications/connect
 * @desc    Establish SSE connection for real-time notifications
 * @access  Private (token via query parameter)
 */
router.get('/connect', sseRateLimiter, notificationController.connectSSE);

// ============================================================================
// NOTIFICATION CRUD OPERATIONS
// ============================================================================

/**
 * @route   GET /api/v1/notifications
 * @desc    Get notifications for authenticated user
 * @access  Private
 */
router.get(
	'/',
	notificationRateLimiter,
	authenticate(),
	validate(notificationValidation.getNotifications),
	notificationController.getNotifications
);

/**
 * @route   GET /api/v1/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/unread-count', notificationRateLimiter, authenticate(), notificationController.getUnreadCount);

/**
 * @route   PUT /api/v1/notifications/:notificationId/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put(
	'/:notificationId/read',
	notificationRateLimiter,
	authenticate(),
	validate(notificationValidation.markAsRead),
	notificationController.markAsRead
);

/**
 * @route   PUT /api/v1/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', notificationRateLimiter, authenticate(), notificationController.markAllAsRead);

/**
 * @route   DELETE /api/v1/notifications/:notificationId
 * @desc    Delete notification
 * @access  Private
 */
router.delete(
	'/:notificationId',
	notificationRateLimiter,
	authenticate(),
	validate(notificationValidation.deleteNotification),
	notificationController.deleteNotification
);

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

/**
 * @route   GET /api/v1/notifications/preferences
 * @desc    Get notification preferences
 * @access  Private
 */
router.get('/preferences', notificationRateLimiter, authenticate(), notificationController.getPreferences);

/**
 * @route   PUT /api/v1/notifications/preferences
 * @desc    Update notification preferences
 * @access  Private
 */
router.put(
	'/preferences',
	notificationRateLimiter,
	authenticate(),
	validate(notificationValidation.updatePreferences),
	notificationController.updatePreferences
);

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

/**
 * @route   POST /api/v1/notifications/admin/announcement
 * @desc    Create system announcement (Admin only)
 * @access  Private (Admin)
 */
router.post(
	'/admin/announcement',
	notificationRateLimiter,
	authenticate(),
	validate(notificationValidation.createSystemAnnouncement),
	notificationController.createSystemAnnouncement
);

/**
 * @route   GET /api/v1/notifications/admin/stats
 * @desc    Get notification statistics (Admin only)
 * @access  Private (Admin)
 */
router.get('/admin/stats', notificationRateLimiter, authenticate(), notificationController.getNotificationStats);

/**
 * @route   DELETE /api/v1/notifications/admin/cleanup
 * @desc    Cleanup old notifications (Admin only)
 * @access  Private (Admin)
 */
router.delete(
	'/admin/cleanup',
	notificationRateLimiter,
	authenticate(),
	validate(notificationValidation.cleanupOldNotifications),
	notificationController.cleanupOldNotifications
);

export default router;
