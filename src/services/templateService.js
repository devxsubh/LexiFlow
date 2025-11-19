import httpStatus from 'http-status';
import Template from '~/models/Template';
import { Contract } from '~/models';
import APIError from '~/utils/apiError';
import cacheService from './cacheService';

class TemplateService {
	async searchTemplates(query, filters = {}, options = {}) {
		// Generate cache key based on query and filters
		const cacheKey = `search:${JSON.stringify({ query, filters, options })}`;

		// Try to get from cache first
		const cached = await cacheService.getCachedTemplates(cacheKey);
		if (cached) {
			return cached;
		}

		const searchQuery = {};

		if (query) {
			searchQuery.$or = [
				{ title: { $regex: query, $options: 'i' } },
				{ description: { $regex: query, $options: 'i' } },
				{ tags: { $in: [new RegExp(query, 'i')] } }
			];
		}

		// Add filters
		if (filters.category) searchQuery.category = filters.category;
		if (filters.industry) searchQuery.industry = filters.industry;
		if (filters.jurisdiction) searchQuery.jurisdiction = filters.jurisdiction;

		// Use pagination if options are provided
		if (options.page || options.limit) {
			const result = await Template.paginate(options, 'createdBy', searchQuery);
			// Cache the result
			await cacheService.cacheTemplates(cacheKey, result);
			return result;
		}

		// Fallback to simple find
		const result = await Template.find(searchQuery).populate('createdBy', 'name email').sort({ usageCount: -1, rating: -1 });
		// Cache the result
		await cacheService.cacheTemplates(cacheKey, result);
		return result;
	}

	async getTemplatesByCategory(category, filters = {}, options = {}) {
		// Generate cache key based on category and filters
		const cacheKey = `category:${category}:${JSON.stringify({ filters, options })}`;

		// Try to get from cache first
		const cached = await cacheService.getCachedTemplates(cacheKey);
		if (cached) {
			return cached;
		}

		const searchQuery = { category, ...filters };

		// Use pagination if options are provided
		if (options.page || options.limit) {
			const result = await Template.paginate(options, 'createdBy', searchQuery);
			// Cache the result
			await cacheService.cacheTemplates(cacheKey, result);
			return result;
		}

		// Fallback to simple find
		const result = await Template.find(searchQuery).populate('createdBy', 'name email').sort({ usageCount: -1, rating: -1 });
		// Cache the result
		await cacheService.cacheTemplates(cacheKey, result);
		return result;
	}

	async getTemplatesByIndustry(industry, filters = {}, options = {}) {
		// Generate cache key based on industry and filters
		const cacheKey = `industry:${industry}:${JSON.stringify({ filters, options })}`;

		// Try to get from cache first
		const cached = await cacheService.getCachedTemplates(cacheKey);
		if (cached) {
			return cached;
		}

		const searchQuery = { industry, ...filters };

		// Use pagination if options are provided
		if (options.page || options.limit) {
			const result = await Template.paginate(options, 'createdBy', searchQuery);
			// Cache the result
			await cacheService.cacheTemplates(cacheKey, result);
			return result;
		}

		// Fallback to simple find
		const result = await Template.find(searchQuery).populate('createdBy', 'name email').sort({ usageCount: -1, rating: -1 });
		// Cache the result
		await cacheService.cacheTemplates(cacheKey, result);
		return result;
	}

	async getSimilarTemplates(templateId, options = {}) {
		try {
			// Get the source template
			const sourceTemplate = await Template.findById(templateId);
			if (!sourceTemplate) {
				throw new APIError('Template not found', httpStatus.NOT_FOUND);
			}

			// Generate cache key for similar templates
			const cacheKey = `similar:${templateId}:${JSON.stringify(options)}`;

			// Try to get from cache first
			const cached = await cacheService.getCachedTemplates(cacheKey);
			if (cached) {
				return cached;
			}

			const { limit = 10, excludeCurrent = true } = options;

			// Build similarity criteria - templates must match at least one similarity criterion
			const similarityCriteria = {
				$or: [
					// Same category
					{ category: sourceTemplate.category },
					// Same industry
					{ industry: sourceTemplate.industry },
					// Same jurisdiction
					{ jurisdiction: sourceTemplate.jurisdiction },
					// Similar tags (at least one matching tag)
					{ tags: { $in: sourceTemplate.tags || [] } }
				]
			};

			// Base query with similarity requirements
			const baseQuery = {
				isPublic: true,
				...similarityCriteria
			};

			// Add exclusion if needed
			if (excludeCurrent) {
				baseQuery._id = { $ne: templateId };
			}

			// Execute the query with enhanced scoring
			const similarTemplates = await Template.aggregate([
				{ $match: baseQuery },
				{
					$addFields: {
						similarityScore: {
							$add: [
								// Category match (weight: 5)
								{ $cond: [{ $eq: ['$category', sourceTemplate.category] }, 5, 0] },
								// Industry match (weight: 5)
								{ $cond: [{ $eq: ['$industry', sourceTemplate.industry] }, 5, 0] },
								// Jurisdiction match (weight: 3)
								{ $cond: [{ $eq: ['$jurisdiction', sourceTemplate.jurisdiction] }, 3, 0] },
								// Tag matches (weight: 2 per tag)
								{
									$multiply: [
										{
											$size: {
												$setIntersection: ['$tags', sourceTemplate.tags || []]
											}
										},
										2
									]
								},
								// Rating bonus (weight: 1)
								{ $multiply: ['$rating', 1] },
								// Usage count bonus (weight: 0.1 per usage, capped at 5)
								{ $min: [{ $multiply: ['$usageCount', 0.1] }, 5] }
							]
						},
						// Add similarity reasons for transparency
						similarityReasons: {
							$concat: [
								{ $cond: [{ $eq: ['$category', sourceTemplate.category] }, 'Same category, ', ''] },
								{ $cond: [{ $eq: ['$industry', sourceTemplate.industry] }, 'Same industry, ', ''] },
								{ $cond: [{ $eq: ['$jurisdiction', sourceTemplate.jurisdiction] }, 'Same jurisdiction, ', ''] },
								{
									$cond: [{ $gt: [{ $size: { $setIntersection: ['$tags', sourceTemplate.tags || []] } }, 0] }, 'Same tags, ', '']
								}
							]
						}
					}
				},
				// Filter out templates with very low similarity scores
				{ $match: { similarityScore: { $gte: 3 } } },
				{ $sort: { similarityScore: -1 } },
				{ $limit: limit },
				{
					$lookup: {
						from: 'users',
						localField: 'createdBy',
						foreignField: '_id',
						as: 'createdBy'
					}
				},
				{
					$unwind: {
						path: '$createdBy',
						preserveNullAndEmptyArrays: true
					}
				},
				{
					$project: {
						_id: 1,
						title: 1,
						description: 1,
						category: 1,
						industry: 1,
						jurisdiction: 1,
						tags: 1,
						rating: 1,
						usageCount: 1,
						similarityScore: 1,
						similarityReasons: 1,
						createdBy: {
							_id: 1,
							name: 1,
							email: 1
						},
						createdAt: 1
					}
				}
			]);

			// Cache the result
			await cacheService.cacheTemplates(cacheKey, similarTemplates);

			return similarTemplates;
		} catch (error) {
			throw new APIError(
				error.message || 'Failed to get similar templates',
				error.statusCode || httpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}

	async getTemplateSuggestions(templateId, options = {}) {
		try {
			const { limit = 10, excludeCurrent = true, includeSimilar = true, includePopular = true } = options;

			// Get the source template
			const sourceTemplate = await Template.findById(templateId);
			if (!sourceTemplate) {
				throw new APIError('Template not found', httpStatus.NOT_FOUND);
			}

			// Generate cache key for suggestions
			const cacheKey = `suggestions:${templateId}:${JSON.stringify(options)}`;

			// Try to get from cache first
			const cached = await cacheService.getCachedTemplates(cacheKey);
			if (cached) {
				return cached;
			}

			let suggestions = [];

			// Get similar templates if requested
			if (includeSimilar) {
				const similarTemplates = await this.getSimilarTemplates(templateId, {
					limit: Math.ceil(limit * 0.7), // 70% of suggestions from similar templates
					excludeCurrent
				});
				suggestions.push(...similarTemplates);
			}

			// Get popular templates in the same category/industry if requested
			if (includePopular && suggestions.length < limit) {
				const remainingLimit = limit - suggestions.length;
				const excludeIds = excludeCurrent
					? [templateId, ...suggestions.map((t) => t._id.toString())]
					: suggestions.map((t) => t._id.toString());

				// Popular templates query - must be in same category/industry/jurisdiction
				const popularQuery = {
					isPublic: true,
					_id: { $nin: excludeIds },
					rating: { $gte: 4.0 },
					$or: [
						{ category: sourceTemplate.category },
						{ industry: sourceTemplate.industry },
						{ jurisdiction: sourceTemplate.jurisdiction }
					]
				};

				const popularTemplates = await Template.aggregate([
					{ $match: popularQuery },
					{
						$addFields: {
							suggestionScore: {
								$add: [
									// Rating weight (0-5)
									{ $multiply: ['$rating', 2] },
									// Usage count weight (normalized)
									{ $multiply: [{ $min: ['$usageCount', 100] }, 0.01] },
									// Category/Industry match bonus
									{ $cond: [{ $eq: ['$category', sourceTemplate.category] }, 1, 0] },
									{ $cond: [{ $eq: ['$industry', sourceTemplate.industry] }, 1, 0] },
									{ $cond: [{ $eq: ['$jurisdiction', sourceTemplate.jurisdiction] }, 0.5, 0] }
								]
							}
						}
					},
					{ $sort: { suggestionScore: -1 } },
					{ $limit: remainingLimit },
					{
						$lookup: {
							from: 'users',
							localField: 'createdBy',
							foreignField: '_id',
							as: 'createdBy'
						}
					},
					{
						$unwind: {
							path: '$createdBy',
							preserveNullAndEmptyArrays: true
						}
					},
					{
						$project: {
							_id: 1,
							title: 1,
							description: 1,
							category: 1,
							industry: 1,
							jurisdiction: 1,
							tags: 1,
							rating: 1,
							usageCount: 1,
							suggestionScore: 1,
							suggestionType: { $literal: 'popular' },
							createdBy: {
								_id: 1,
								name: 1,
								email: 1
							},
							createdAt: 1
						}
					}
				]);

				suggestions.push(...popularTemplates);
			}

			// Add suggestion type to similar templates
			suggestions = suggestions.map((template) => ({
				...template,
				suggestionType: template.suggestionType || 'similar'
			}));

			// Sort by suggestion score and limit
			suggestions.sort((a, b) => b.suggestionScore - a.suggestionScore);
			suggestions = suggestions.slice(0, limit);

			// Cache the result
			await cacheService.cacheTemplates(cacheKey, suggestions);

			return suggestions;
		} catch (error) {
			throw new APIError(
				error.message || 'Failed to get template suggestions',
				error.statusCode || httpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}

	async getTemplateById(id) {
		const template = await Template.findById(id).populate('createdBy', 'name email').populate('reviews.user', 'name email');
		if (!template) {
			throw new APIError(httpStatus.NOT_FOUND, 'Template not found');
		}
		return template;
	}

	async createTemplate(templateData) {
		const template = new Template({
			...templateData,
			version: '1.0',
			usageCount: 0,
			rating: 0,
			reviews: []
		});
		const result = await template.save();

		// Invalidate relevant caches
		await cacheService.invalidateCache('templates:*');
		await cacheService.invalidateCache('popular_templates');

		return result;
	}

	async updateTemplate(id, updateData) {
		const template = await Template.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true }).populate(
			'createdBy',
			'name email'
		);
		if (!template) {
			throw new APIError(httpStatus.NOT_FOUND, 'Template not found');
		}

		// Invalidate relevant caches
		await cacheService.invalidateCache('templates:*');
		await cacheService.invalidateCache('popular_templates');

		return template;
	}

	async deleteTemplate(id) {
		const template = await Template.findByIdAndDelete(id);
		if (!template) {
			throw new APIError(httpStatus.NOT_FOUND, 'Template not found');
		}

		// Invalidate relevant caches
		await cacheService.invalidateCache('templates:*');
		await cacheService.invalidateCache('popular_templates');

		return template;
	}

	async addReview(id, reviewData) {
		const template = await Template.findById(id);
		if (!template) {
			throw new APIError(httpStatus.NOT_FOUND, 'Template not found');
		}
		// Add the review
		template.reviews.push(reviewData);
		// Update average rating
		const totalRating = template.reviews.reduce((sum, review) => sum + review.rating, 0);
		template.rating = totalRating / template.reviews.length;
		await template.save();

		// Invalidate relevant caches
		await cacheService.invalidateCache('templates:*');
		await cacheService.invalidateCache('popular_templates');

		return await this.getTemplateById(id);
	}

	async getPopularTemplates(limit = 10, filters = {}) {
		// Generate cache key based on limit and filters
		const cacheKey = `popular:${limit}:${JSON.stringify(filters)}`;

		// Try to get from cache first
		const cached = await cacheService.getCachedTemplates(cacheKey);
		if (cached) {
			return cached;
		}

		const searchQuery = { isPublic: true, ...filters };

		// Calculate popularity score based on usage count and rating
		// Popularity = (usageCount * 0.7) + (rating * 0.3)
		const result = await Template.aggregate([
			{ $match: searchQuery },
			{
				$addFields: {
					popularityScore: { $add: [{ $multiply: ['$usageCount', 0.7] }, { $multiply: ['$rating', 0.3] }] },
					totalRatings: { $size: '$reviews' }
				}
			},
			{ $sort: { popularityScore: -1 } },
			{ $limit: parseInt(limit) },
			{
				$lookup: {
					from: 'users',
					localField: 'createdBy',
					foreignField: '_id',
					as: 'createdBy'
				}
			},
			{
				$unwind: {
					path: '$createdBy',
					preserveNullAndEmptyArrays: true
				}
			}
		]);

		// Cache the result
		await cacheService.cacheTemplates(cacheKey, result);
		return result;
	}

	async getTemplatesByEnforceability(options = {}) {
		// Use pagination if options are provided
		if (options.page || options.limit) {
			const result = await Template.paginate(options, 'createdBy');
			return result;
		}

		// Fallback to simple find
		return await Template.find().populate('createdBy', 'name email').sort({ usageCount: -1, rating: -1 });
	}

	async incrementUsageCount(id) {
		const template = await Template.findByIdAndUpdate(id, { $inc: { usageCount: 1 } }, { new: true });
		if (!template) {
			throw new APIError(httpStatus.NOT_FOUND, 'Template not found');
		}

		// Invalidate relevant caches
		await cacheService.invalidateCache('templates:*');
		await cacheService.invalidateCache('popular_templates');

		return template;
	}

	async convertToContract(templateId, userId, contractData = {}) {
		const template = await Template.findById(templateId);
		if (!template) {
			throw new APIError(httpStatus.NOT_FOUND, 'Template not found');
		}
		// Require parties, startDate, endDate from user
		if (!contractData.parties || !contractData.startDate || !contractData.endDate) {
			throw new APIError(httpStatus.BAD_REQUEST, 'parties, startDate, and endDate are required to convert template to contract');
		}
		// Create new contract based on template
		const contract = new Contract({
			title: contractData.title || template.title,
			type: contractData.type || template.type,
			description: contractData.description || template.description,
			parties: contractData.parties,
			jurisdiction: contractData.jurisdiction || template.jurisdiction,
			content: template.content,
			startDate: contractData.startDate,
			endDate: contractData.endDate,
			status: 'draft',
			userId: userId,
			templateSource: templateId
		});
		// Increment template usage count
		template.usageCount += 1;
		await template.save();

		// Invalidate relevant caches
		await cacheService.invalidateCache('templates:*');
		await cacheService.invalidateCache('popular_templates');

		return await contract.save();
	}

	// Rating-related methods
	async addRating(templateId, userId, ratingData) {
		const template = await Template.findById(templateId);
		if (!template) {
			throw new APIError(httpStatus.NOT_FOUND, 'Template not found');
		}

		// Check if user has already rated this template
		const existingReview = template.reviews.find((review) => review.user.toString() === userId);
		if (existingReview) {
			throw new APIError(httpStatus.CONFLICT, 'You have already rated this template');
		}

		// Add the review
		template.reviews.push({
			user: userId,
			rating: ratingData.rating
		});

		// Update average rating
		const totalRating = template.reviews.reduce((sum, review) => sum + review.rating, 0);
		template.rating = totalRating / template.reviews.length;

		await template.save();

		// Invalidate relevant caches
		await cacheService.invalidateCache('templates:*');
		await cacheService.invalidateCache('popular_templates');

		return await this.getTemplateById(templateId);
	}

	async updateRating(templateId, userId, ratingData) {
		const template = await Template.findById(templateId);
		if (!template) {
			throw new APIError(httpStatus.NOT_FOUND, 'Template not found');
		}

		// Find existing review
		const existingReview = template.reviews.find((review) => review.user.toString() === userId);
		if (!existingReview) {
			throw new APIError(httpStatus.NOT_FOUND, 'You have not rated this template yet');
		}

		// Update the review
		existingReview.rating = ratingData.rating;
		existingReview.createdAt = new Date();

		// Update average rating
		const totalRating = template.reviews.reduce((sum, review) => sum + review.rating, 0);
		template.rating = totalRating / template.reviews.length;

		await template.save();

		// Invalidate relevant caches
		await cacheService.invalidateCache('templates:*');
		await cacheService.invalidateCache('popular_templates');

		return await this.getTemplateById(templateId);
	}

	async deleteRating(templateId, userId) {
		const template = await Template.findById(templateId);
		if (!template) {
			throw new APIError(httpStatus.NOT_FOUND, 'Template not found');
		}

		// Find and remove the review
		const reviewIndex = template.reviews.findIndex((review) => review.user.toString() === userId);
		if (reviewIndex === -1) {
			throw new APIError(httpStatus.NOT_FOUND, 'You have not rated this template yet');
		}

		template.reviews.splice(reviewIndex, 1);

		// Update average rating
		if (template.reviews.length > 0) {
			const totalRating = template.reviews.reduce((sum, review) => sum + review.rating, 0);
			template.rating = totalRating / template.reviews.length;
		} else {
			template.rating = 0;
		}

		await template.save();

		// Invalidate relevant caches
		await cacheService.invalidateCache('templates:*');
		await cacheService.invalidateCache('popular_templates');

		return await this.getTemplateById(templateId);
	}

	async getTemplateRatings(templateId, options = {}) {
		const template = await Template.findById(templateId).populate('reviews.user', 'name email avatarUrl');
		if (!template) {
			throw new APIError(httpStatus.NOT_FOUND, 'Template not found');
		}

		const { page = 1, limit = 10, sortBy = 'createdAt', sortDirection = 'desc' } = options;

		// Sort reviews
		const sortedReviews = template.reviews.sort((a, b) => {
			if (sortDirection === 'desc') {
				return new Date(b[sortBy]) - new Date(a[sortBy]);
			}
			return new Date(a[sortBy]) - new Date(b[sortBy]);
		});

		// Paginate reviews
		const startIndex = (page - 1) * limit;
		const endIndex = startIndex + limit;
		const paginatedReviews = sortedReviews.slice(startIndex, endIndex);

		return {
			template: {
				id: template._id,
				title: template.title,
				rating: template.rating,
				totalReviews: template.reviews.length
			},
			reviews: paginatedReviews,
			pagination: {
				currentPage: page,
				totalPages: Math.ceil(template.reviews.length / limit),
				totalReviews: template.reviews.length,
				hasNextPage: endIndex < template.reviews.length,
				hasPrevPage: page > 1
			}
		};
	}

	async getUserRating(templateId, userId) {
		const template = await Template.findById(templateId);
		if (!template) {
			throw new APIError(httpStatus.NOT_FOUND, 'Template not found');
		}

		const userReview = template.reviews.find((review) => review.user.toString() === userId);
		return userReview || null;
	}

	async getMyRatings(userId, options = {}) {
		const { page = 1, limit = 10, sortBy = 'createdAt', sortDirection = 'desc' } = options;

		const templates = await Template.find({
			'reviews.user': userId
		})
			.populate('reviews.user', 'name email avatarUrl')
			.sort({ [sortBy]: sortDirection === 'desc' ? -1 : 1 })
			.skip((page - 1) * limit)
			.limit(limit);

		const totalTemplates = await Template.countDocuments({
			'reviews.user': userId
		});

		// Extract user's reviews from each template
		const userRatings = templates.map((template) => {
			const userReview = template.reviews.find((review) => review.user._id.toString() === userId);
			return {
				template: {
					id: template._id,
					title: template.title,
					category: template.category,
					industry: template.industry
				},
				rating: userReview.rating,
				createdAt: userReview.createdAt
			};
		});

		return {
			ratings: userRatings,
			pagination: {
				currentPage: page,
				totalPages: Math.ceil(totalTemplates / limit),
				totalRatings: totalTemplates,
				hasNextPage: page * limit < totalTemplates,
				hasPrevPage: page > 1
			}
		};
	}
}

export default new TemplateService();
