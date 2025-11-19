import rateLimit from 'express-rate-limit';
import httpStatus from 'http-status';
import APIError from '~/utils/apiError';

// General rate limiter for most endpoints
const rateLimiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	max: 100,
	handler: (req, res, next) => {
		const error = new APIError('Too many requests, please try again later.', httpStatus.TOO_MANY_REQUESTS);
		console.log('Rate limit exceeded for:', req.path, 'IP:', req.ip);
		next(error);
	},
	// Skip rate limiting for notification routes, health checks, and auto-save endpoints
	skip: (req) => {
		return (
			req.path.startsWith('/api/v1/notifications') ||
			req.path.includes('/health/') ||
			req.path.includes('/preview') ||
			req.path.includes('/autosave')
		);
	}
});

// More lenient rate limiter for notification endpoints
const notificationRateLimiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	max: 500, // Much higher limit for notifications
	handler: (req, res, next) => {
		next(new APIError('Too many notification requests, please try again later.', httpStatus.TOO_MANY_REQUESTS));
	}
});

// Very lenient rate limiter for SSE connections
const sseRateLimiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	max: 30, // Allow more frequent reconnections
	handler: (req, res, next) => {
		next(new APIError('Too many SSE connection attempts, please try again later.', httpStatus.TOO_MANY_REQUESTS));
	}
});

// Very lenient rate limiter for health check endpoints
const healthCheckRateLimiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	max: 200, // Allow frequent health checks
	handler: (req, res, next) => {
		next(new APIError('Too many health check requests, please try again later.', httpStatus.TOO_MANY_REQUESTS));
	}
});

export default rateLimiter;
export { notificationRateLimiter, sseRateLimiter, healthCheckRateLimiter };
