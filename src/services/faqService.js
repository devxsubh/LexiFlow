import FAQ from '../models/FAQ';
import APIError from '../utils/apiError';
import logger from '../config/logger';
import httpStatus from 'http-status';

class FAQService {
	async createFAQ(faqData, createdBy) {
		try {
			const faq = await FAQ.create({
				...faqData,
				createdBy
			});

			await faq.populate('createdBy', 'firstName lastName');

			logger.info(`FAQ created: ${faq._id} by user: ${createdBy}`);
			return faq;
		} catch (error) {
			logger.error('Error creating FAQ:', error);
			throw new APIError('Failed to create FAQ', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async getFAQs(filters = {}, options = {}) {
		try {
			const query = { isActive: true };

			// Apply filters
			if (filters.category) {
				query.category = filters.category;
			}
			if (filters.tags && filters.tags.length > 0) {
				query.tags = { $in: filters.tags };
			}
			if (filters.search) {
				query.$or = [
					{ question: { $regex: filters.search, $options: 'i' } },
					{ answer: { $regex: filters.search, $options: 'i' } }
				];
			}

			// Apply sorting
			const sortOptions = { order: 1, createdAt: -1 };

			// Apply pagination
			const page = parseInt(options.page) || 1;
			const limit = parseInt(options.limit) || 20;
			const skip = (page - 1) * limit;

			const faqs = await FAQ.find(query).sort(sortOptions).skip(skip).limit(limit).populate('createdBy', 'firstName lastName');

			const total = await FAQ.countDocuments(query);

			return {
				faqs,
				pagination: {
					page,
					limit,
					total,
					pages: Math.ceil(total / limit)
				}
			};
		} catch (error) {
			logger.error('Error fetching FAQs:', error);
			throw new APIError('Failed to fetch FAQs', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async getFAQById(faqId) {
		try {
			const faq = await FAQ.findById(faqId)
				.populate('createdBy', 'firstName lastName')
				.populate('lastUpdatedBy', 'firstName lastName');

			if (!faq) {
				throw new APIError('FAQ not found', httpStatus.NOT_FOUND);
			}

			// Increment view count
			faq.viewCount += 1;
			await faq.save();

			return faq;
		} catch (error) {
			if (error instanceof APIError) throw error;
			logger.error('Error fetching FAQ:', error);
			throw new APIError('Failed to fetch FAQ', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async updateFAQ(faqId, updateData, updatedBy) {
		try {
			const faq = await FAQ.findById(faqId);
			if (!faq) {
				throw new APIError('FAQ not found', httpStatus.NOT_FOUND);
			}

			updateData.lastUpdatedBy = updatedBy;
			Object.assign(faq, updateData);
			await faq.save();

			await faq.populate('createdBy', 'firstName lastName');
			await faq.populate('lastUpdatedBy', 'firstName lastName');

			logger.info(`FAQ updated: ${faqId} by user: ${updatedBy}`);
			return faq;
		} catch (error) {
			if (error instanceof APIError) throw error;
			logger.error('Error updating FAQ:', error);
			throw new APIError('Failed to update FAQ', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async deleteFAQ(faqId) {
		try {
			const faq = await FAQ.findById(faqId);
			if (!faq) {
				throw new APIError('FAQ not found', httpStatus.NOT_FOUND);
			}

			await FAQ.findByIdAndDelete(faqId);

			logger.info(`FAQ deleted: ${faqId}`);
			return { message: 'FAQ deleted successfully' };
		} catch (error) {
			if (error instanceof APIError) throw error;
			logger.error('Error deleting FAQ:', error);
			throw new APIError('Failed to delete FAQ', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async markFAQHelpful(faqId, isHelpful) {
		try {
			const faq = await FAQ.findById(faqId);
			if (!faq) {
				throw new APIError('FAQ not found', httpStatus.NOT_FOUND);
			}

			if (isHelpful) {
				faq.helpfulCount += 1;
			} else {
				faq.notHelpfulCount += 1;
			}

			await faq.save();

			logger.info(`FAQ ${isHelpful ? 'helpful' : 'not helpful'} marked: ${faqId}`);
			return faq;
		} catch (error) {
			if (error instanceof APIError) throw error;
			logger.error('Error marking FAQ helpful:', error);
			throw new APIError('Failed to mark FAQ helpful', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async getFAQStats() {
		try {
			const stats = await FAQ.aggregate([
				{ $match: { isActive: true } },
				{
					$group: {
						_id: '$category',
						count: { $sum: 1 },
						totalViews: { $sum: '$viewCount' },
						totalHelpful: { $sum: '$helpfulCount' },
						totalNotHelpful: { $sum: '$notHelpfulCount' }
					}
				}
			]);

			const totalFAQs = await FAQ.countDocuments({ isActive: true });
			const totalViews = await FAQ.aggregate([
				{ $match: { isActive: true } },
				{ $group: { _id: null, total: { $sum: '$viewCount' } } }
			]);

			return {
				total: totalFAQs,
				totalViews: totalViews[0]?.total || 0,
				byCategory: stats
			};
		} catch (error) {
			logger.error('Error fetching FAQ stats:', error);
			throw new APIError('Failed to fetch FAQ statistics', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}

export default new FAQService();
