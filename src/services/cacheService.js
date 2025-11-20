import logger from '../config/logger.js';

class CacheService {
	constructor() {
		// Simple in-memory cache store
		this.cache = new Map();
		// Store TTL timestamps
		this.ttlMap = new Map();

		// Clean up expired entries every 5 minutes
		this.cleanupInterval = setInterval(() => {
			this.cleanupExpired();
		}, 5 * 60 * 1000);

		logger.info('In-memory cache service initialized');
	}

	// Clean up expired cache entries
	cleanupExpired() {
		const now = Date.now();
		let cleaned = 0;

		for (const [key, expiry] of this.ttlMap.entries()) {
			if (expiry < now) {
				this.cache.delete(key);
				this.ttlMap.delete(key);
				cleaned++;
			}
		}

		if (cleaned > 0) {
			logger.debug(`Cleaned up ${cleaned} expired cache entries`);
		}
	}

	// Check if a key is expired
	isExpired(key) {
		const expiry = this.ttlMap.get(key);
		if (!expiry) return false;
		return Date.now() > expiry;
	}

	// Cache contract templates
	async cacheContractTemplate(key, template, ttl = 86400) {
		try {
			const cacheKey = `contract_template:${key}`;
			this.cache.set(cacheKey, template);
			this.ttlMap.set(cacheKey, Date.now() + ttl * 1000);
			logger.debug(`Cached contract template: ${key}`);
		} catch (error) {
			logger.error('Error caching contract template:', error);
		}
	}

	async getCachedContractTemplate(key) {
		try {
			const cacheKey = `contract_template:${key}`;
			if (this.isExpired(cacheKey)) {
				this.cache.delete(cacheKey);
				this.ttlMap.delete(cacheKey);
				return null;
			}
			return this.cache.get(cacheKey) || null;
		} catch (error) {
			logger.error('Error getting cached contract template:', error);
			return null;
		}
	}

	// Cache AI responses
	async cacheAIResponse(prompt, response, ttl = 3600) {
		try {
			const key = this.generateCacheKey(prompt);
			const cacheKey = `ai_response:${key}`;
			this.cache.set(cacheKey, response);
			this.ttlMap.set(cacheKey, Date.now() + ttl * 1000);
			logger.debug(`Cached AI response for prompt: ${key.substring(0, 50)}...`);
		} catch (error) {
			logger.error('Error caching AI response:', error);
		}
	}

	async getCachedAIResponse(prompt) {
		try {
			const key = this.generateCacheKey(prompt);
			const cacheKey = `ai_response:${key}`;
			if (this.isExpired(cacheKey)) {
				this.cache.delete(cacheKey);
				this.ttlMap.delete(cacheKey);
				return null;
			}
			return this.cache.get(cacheKey) || null;
		} catch (error) {
			logger.error('Error getting cached AI response:', error);
			return null;
		}
	}

	// Cache templates
	async cacheTemplates(key, templates, ttl = 1800) {
		// 30 minutes
		try {
			const cacheKey = `templates:${key}`;
			this.cache.set(cacheKey, templates);
			this.ttlMap.set(cacheKey, Date.now() + ttl * 1000);
			logger.debug(`Cached templates: ${key}`);
		} catch (error) {
			logger.error('Error caching templates:', error);
		}
	}

	async getCachedTemplates(key) {
		try {
			const cacheKey = `templates:${key}`;
			if (this.isExpired(cacheKey)) {
				this.cache.delete(cacheKey);
				this.ttlMap.delete(cacheKey);
				return null;
			}
			return this.cache.get(cacheKey) || null;
		} catch (error) {
			logger.error('Error getting cached templates:', error);
			return null;
		}
	}

	// Cache lawyer search results
	async cacheLawyerSearch(key, lawyers, ttl = 900) {
		// 15 minutes
		try {
			const cacheKey = `lawyer_search:${key}`;
			this.cache.set(cacheKey, lawyers);
			this.ttlMap.set(cacheKey, Date.now() + ttl * 1000);
			logger.debug(`Cached lawyer search: ${key}`);
		} catch (error) {
			logger.error('Error caching lawyer search:', error);
		}
	}

	async getCachedLawyerSearch(key) {
		try {
			const cacheKey = `lawyer_search:${key}`;
			if (this.isExpired(cacheKey)) {
				this.cache.delete(cacheKey);
				this.ttlMap.delete(cacheKey);
				return null;
			}
			return this.cache.get(cacheKey) || null;
		} catch (error) {
			logger.error('Error getting cached lawyer search:', error);
			return null;
		}
	}

	// Cache user profile data
	async cacheUserProfile(userId, profile, ttl = 3600) {
		// 1 hour
		try {
			const cacheKey = `user_profile:${userId}`;
			this.cache.set(cacheKey, profile);
			this.ttlMap.set(cacheKey, Date.now() + ttl * 1000);
			logger.debug(`Cached user profile: ${userId}`);
		} catch (error) {
			logger.error('Error caching user profile:', error);
		}
	}

	async getCachedUserProfile(userId) {
		try {
			const cacheKey = `user_profile:${userId}`;
			if (this.isExpired(cacheKey)) {
				this.cache.delete(cacheKey);
				this.ttlMap.delete(cacheKey);
				return null;
			}
			return this.cache.get(cacheKey) || null;
		} catch (error) {
			logger.error('Error getting cached user profile:', error);
			return null;
		}
	}

	// Cache subscription plans
	async cachePlans(plans, ttl = 86400) {
		// 24 hours
		try {
			const cacheKey = 'subscription_plans';
			this.cache.set(cacheKey, plans);
			this.ttlMap.set(cacheKey, Date.now() + ttl * 1000);
			logger.debug('Cached subscription plans');
		} catch (error) {
			logger.error('Error caching subscription plans:', error);
		}
	}

	async getCachedPlans() {
		try {
			const cacheKey = 'subscription_plans';
			if (this.isExpired(cacheKey)) {
				this.cache.delete(cacheKey);
				this.ttlMap.delete(cacheKey);
				return null;
			}
			return this.cache.get(cacheKey) || null;
		} catch (error) {
			logger.error('Error getting cached subscription plans:', error);
			return null;
		}
	}

	// Cache popular templates
	async cachePopularTemplates(templates, ttl = 3600) {
		// 1 hour
		try {
			const cacheKey = 'popular_templates';
			this.cache.set(cacheKey, templates);
			this.ttlMap.set(cacheKey, Date.now() + ttl * 1000);
			logger.debug('Cached popular templates');
		} catch (error) {
			logger.error('Error caching popular templates:', error);
		}
	}

	async getCachedPopularTemplates() {
		try {
			const cacheKey = 'popular_templates';
			if (this.isExpired(cacheKey)) {
				this.cache.delete(cacheKey);
				this.ttlMap.delete(cacheKey);
				return null;
			}
			return this.cache.get(cacheKey) || null;
		} catch (error) {
			logger.error('Error getting cached popular templates:', error);
			return null;
		}
	}


	// Cache lawyer availability
	async cacheLawyerAvailability(lawyerId, date, availability, ttl = 300) {
		// 5 minutes
		try {
			const cacheKey = `lawyer_availability:${lawyerId}:${date}`;
			this.cache.set(cacheKey, availability);
			this.ttlMap.set(cacheKey, Date.now() + ttl * 1000);
			logger.debug(`Cached lawyer availability: ${lawyerId}:${date}`);
		} catch (error) {
			logger.error('Error caching lawyer availability:', error);
		}
	}

	async getCachedLawyerAvailability(lawyerId, date) {
		try {
			const cacheKey = `lawyer_availability:${lawyerId}:${date}`;
			if (this.isExpired(cacheKey)) {
				this.cache.delete(cacheKey);
				this.ttlMap.delete(cacheKey);
				return null;
			}
			return this.cache.get(cacheKey) || null;
		} catch (error) {
			logger.error('Error getting cached lawyer availability:', error);
			return null;
		}
	}

	// Invalidate cache by pattern
	async invalidateCache(pattern) {
		try {
			let invalidated = 0;
			const regex = new RegExp(pattern.replace(/\*/g, '.*'));

			for (const key of this.cache.keys()) {
				if (regex.test(key)) {
					this.cache.delete(key);
					this.ttlMap.delete(key);
					invalidated++;
				}
			}

			if (invalidated > 0) {
				logger.debug(`Invalidated ${invalidated} cache entries with pattern: ${pattern}`);
			}
		} catch (error) {
			logger.error('Error invalidating cache:', error);
		}
	}

	// Generate cache key from prompt
	generateCacheKey(prompt) {
		const crypto = require('crypto');
		return crypto.createHash('md5').update(prompt).digest('hex');
	}

	// Clear cache
	async clearCache(pattern = '*') {
		try {
			if (pattern === '*') {
				const count = this.cache.size;
				this.cache.clear();
				this.ttlMap.clear();
				logger.info(`Cleared ${count} cache entries`);
			} else {
				await this.invalidateCache(pattern);
			}
		} catch (error) {
			logger.error('Error clearing cache:', error);
		}
	}

	// Health check
	async healthCheck() {
		// In-memory cache is always available
		return true;
	}

	// Get cache size for monitoring
	async getCacheSize() {
		try {
			return this.cache.size;
		} catch (error) {
			logger.error('Error getting cache size:', error);
			return 0;
		}
	}

	// Set AI provider for a conversation
	async setAIProviderForConversation(conversationId, provider, ttl = 86400) {
		try {
			const cacheKey = `ai_provider:${conversationId}`;
			this.cache.set(cacheKey, provider);
			this.ttlMap.set(cacheKey, Date.now() + ttl * 1000);
			logger.debug(`Set AI provider for conversation ${conversationId}: ${provider}`);
		} catch (error) {
			logger.error('Error setting AI provider for conversation:', error);
		}
	}

	// Get AI provider for a conversation
	async getAIProviderForConversation(conversationId) {
		try {
			const cacheKey = `ai_provider:${conversationId}`;
			if (this.isExpired(cacheKey)) {
				this.cache.delete(cacheKey);
				this.ttlMap.delete(cacheKey);
				return null;
			}
			return this.cache.get(cacheKey) || null;
		} catch (error) {
			logger.error('Error getting AI provider for conversation:', error);
			return null;
		}
	}

	// Notification caching
	async cacheUnreadCount(userId, count, ttl = 300) {
		try {
			const cacheKey = `unread_count:${userId}`;
			this.cache.set(cacheKey, count);
			this.ttlMap.set(cacheKey, Date.now() + ttl * 1000);
		} catch (error) {
			logger.error('Error caching unread count:', error);
		}
	}

	async getCachedUnreadCount(userId) {
		try {
			const cacheKey = `unread_count:${userId}`;
			if (this.isExpired(cacheKey)) {
				this.cache.delete(cacheKey);
				this.ttlMap.delete(cacheKey);
				return null;
			}
			return this.cache.get(cacheKey) || null;
		} catch (error) {
			logger.error('Error getting cached unread count:', error);
			return null;
		}
	}

	async cacheNotifications(userId, key, data, ttl = 300) {
		try {
			const cacheKey = `notifications:${userId}:${key}`;
			this.cache.set(cacheKey, data);
			this.ttlMap.set(cacheKey, Date.now() + ttl * 1000);
		} catch (error) {
			logger.error('Error caching notifications:', error);
		}
	}

	async getCachedNotifications(userId, key) {
		try {
			const cacheKey = `notifications:${userId}:${key}`;
			if (this.isExpired(cacheKey)) {
				this.cache.delete(cacheKey);
				this.ttlMap.delete(cacheKey);
				return null;
			}
			return this.cache.get(cacheKey) || null;
		} catch (error) {
			logger.error('Error getting cached notifications:', error);
			return null;
		}
	}
}

export default new CacheService();
