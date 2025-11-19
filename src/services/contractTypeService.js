import ContractType from '../models/ContractType.js';
import cacheService from './cacheService.js';
import APIError from '../utils/apiError.js';
import httpStatus from 'http-status';

class ContractTypeService {
	async createContractType(contractTypeData, userId) {
		try {
			// Check if contract type with same name already exists
			const existing = await ContractType.findOne({ name: contractTypeData.name });
			if (existing) {
				throw new APIError('Contract type with this name already exists', httpStatus.CONFLICT);
			}

			const contractType = new ContractType({
				...contractTypeData,
				createdBy: userId,
				updatedBy: userId
			});

			await contractType.save();

			// Invalidate cache
			await cacheService.invalidateCache('contract_types:*');

			return contractType;
		} catch (error) {
			if (error instanceof APIError) throw error;
			throw new APIError('Failed to create contract type', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async updateContractType(contractTypeId, updateData, userId) {
		try {
			const contractType = await ContractType.findById(contractTypeId);
			if (!contractType) {
				throw new APIError('Contract type not found', httpStatus.NOT_FOUND);
			}

			// Check if name is being updated and if it conflicts with existing
			if (updateData.name && updateData.name !== contractType.name) {
				const existing = await ContractType.findOne({ name: updateData.name });
				if (existing) {
					throw new APIError('Contract type with this name already exists', httpStatus.CONFLICT);
				}
			}

			Object.assign(contractType, updateData, { updatedBy: userId });
			await contractType.save();

			// Invalidate cache
			await cacheService.invalidateCache('contract_types:*');

			return contractType;
		} catch (error) {
			if (error instanceof APIError) throw error;
			throw new APIError('Failed to update contract type', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async getContractTypeById(contractTypeId) {
		try {
			const contractType = await ContractType.findById(contractTypeId)
				.populate('relatedTypes', 'name displayName category description')
				.populate('createdBy', 'firstName lastName')
				.populate('updatedBy', 'firstName lastName');

			if (!contractType) {
				throw new APIError('Contract type not found', httpStatus.NOT_FOUND);
			}

			return contractType;
		} catch (error) {
			if (error instanceof APIError) throw error;
			throw new APIError('Failed to get contract type', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async deleteContractType(contractTypeId) {
		try {
			const contractType = await ContractType.findById(contractTypeId);
			if (!contractType) {
				throw new APIError('Contract type not found', httpStatus.NOT_FOUND);
			}

			// Check if contract type is being used (you might want to add this check)
			// const usageCount = await Contract.countDocuments({ type: contractType.name });
			// if (usageCount > 0) {
			//     throw new APIError('Cannot delete contract type that is being used', httpStatus.CONFLICT);
			// }

			await ContractType.findByIdAndDelete(contractTypeId);

			// Invalidate cache
			await cacheService.invalidateCache('contract_types:*');

			return { message: 'Contract type deleted successfully' };
		} catch (error) {
			if (error instanceof APIError) throw error;
			throw new APIError('Failed to delete contract type', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async searchContractTypes(query, filters = {}, options = {}) {
		try {
			const cacheKey = `contract_types_search:${JSON.stringify({ query, filters, options })}`;

			// Try to get from cache first
			const cached = await cacheService.getCachedContractTypes(cacheKey);
			if (cached) {
				return cached;
			}

			const searchQuery = { isActive: true, ...filters };

			if (query) {
				searchQuery.$or = [
					{ name: { $regex: query, $options: 'i' } },
					{ displayName: { $regex: query, $options: 'i' } },
					{ description: { $regex: query, $options: 'i' } },
					{ keywords: { $in: [new RegExp(query, 'i')] } },
					{ 'metadata.searchTags': { $in: [new RegExp(query, 'i')] } }
				];
			}

			const result = await ContractType.paginate(options, null, searchQuery);

			// Cache the result
			await cacheService.cacheContractTypes(cacheKey, result);

			return result;
		} catch (error) {
			throw new APIError('Failed to search contract types', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async getContractTypesByCategory(category, options = {}) {
		try {
			const cacheKey = `contract_types_category:${category}:${JSON.stringify(options)}`;

			// Try to get from cache first
			const cached = await cacheService.getCachedContractTypes(cacheKey);
			if (cached) {
				return cached;
			}

			const result = await ContractType.paginate(options, null, { category, isActive: true });

			// Cache the result
			await cacheService.cacheContractTypes(cacheKey, result);

			return result;
		} catch (error) {
			throw new APIError('Failed to get contract types by category', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async getSimilarContractTypes(contractTypeId, limit = 5) {
		try {
			const contractType = await ContractType.findById(contractTypeId);
			if (!contractType) {
				throw new APIError('Contract type not found', httpStatus.NOT_FOUND);
			}

			const cacheKey = `similar_contract_types:${contractTypeId}:${limit}`;

			// Try to get from cache first
			const cached = await cacheService.getCachedContractTypes(cacheKey);
			if (cached) {
				return cached;
			}

			// Get similar contract types based on category and keywords
			const similarTypes = await ContractType.find({
				_id: { $ne: contractTypeId },
				category: contractType.category,
				isActive: true
			})
				.limit(limit)
				.sort({ popularity: -1, usageCount: -1 });

			// Cache the result
			await cacheService.cacheContractTypes(cacheKey, similarTypes);

			return similarTypes;
		} catch (error) {
			if (error instanceof APIError) throw error;
			throw new APIError('Failed to get similar contract types', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async getPopularContractTypes(limit = 10, category = null) {
		try {
			const cacheKey = `popular_contract_types:${limit}:${category}`;

			// Try to get from cache first
			const cached = await cacheService.getCachedContractTypes(cacheKey);
			if (cached) {
				return cached;
			}

			const query = { isActive: true };
			if (category) {
				query.category = category;
			}

			const popularTypes = await ContractType.find(query).sort({ popularity: -1, usageCount: -1 }).limit(limit);

			// Cache the result
			await cacheService.cacheContractTypes(cacheKey, popularTypes);

			return popularTypes;
		} catch (error) {
			throw new APIError('Failed to get popular contract types', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async recommendContractTypes(context, filters = {}, limit = 5) {
		try {
			const cacheKey = `contract_type_recommendations:${JSON.stringify({ context, filters, limit })}`;

			// Try to get from cache first
			const cached = await cacheService.getCachedContractTypes(cacheKey);
			if (cached) {
				return cached;
			}

			// Build recommendation query based on context and filters
			const query = { isActive: true };
			const searchTerms = [];

			// Extract keywords from context
			const contextKeywords = this.extractKeywords(context);
			searchTerms.push(...contextKeywords);

			// Add filter-based search terms
			if (filters.industry) {
				searchTerms.push(filters.industry);
			}
			if (filters.jurisdiction) {
				searchTerms.push(filters.jurisdiction);
			}
			if (filters.parties) {
				searchTerms.push(...filters.parties);
			}
			if (filters.requirements) {
				searchTerms.push(...filters.requirements);
			}

			// Create search query
			if (searchTerms.length > 0) {
				query.$or = [
					{ name: { $in: searchTerms.map((term) => new RegExp(term, 'i')) } },
					{ displayName: { $in: searchTerms.map((term) => new RegExp(term, 'i')) } },
					{ description: { $in: searchTerms.map((term) => new RegExp(term, 'i')) } },
					{ keywords: { $in: searchTerms.map((term) => new RegExp(term, 'i')) } },
					{ 'metadata.searchTags': { $in: searchTerms.map((term) => new RegExp(term, 'i')) } }
				];
			}

			// Add category filter if specified
			if (filters.category) {
				query.category = filters.category;
			}

			const recommendations = await ContractType.find(query).sort({ popularity: -1, usageCount: -1 }).limit(limit);

			// Cache the result
			await cacheService.cacheContractTypes(cacheKey, recommendations);

			return recommendations;
		} catch (error) {
			throw new APIError('Failed to get contract type recommendations', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async getAllCategories() {
		try {
			const cacheKey = 'contract_type_categories';

			// Try to get from cache first
			const cached = await cacheService.getCachedContractTypes(cacheKey);
			if (cached) {
				return cached;
			}

			const categories = await ContractType.distinct('category', { isActive: true });

			// Cache the result
			await cacheService.cacheContractTypes(cacheKey, categories);

			return categories;
		} catch (error) {
			throw new APIError('Failed to get contract type categories', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async incrementUsageCount(contractTypeId) {
		try {
			await ContractType.findByIdAndUpdate(contractTypeId, {
				$inc: { usageCount: 1, popularity: 1 }
			});

			// Invalidate cache
			await cacheService.invalidateCache('contract_types:*');
		} catch (error) {
			console.error('Failed to increment usage count:', error);
		}
	}

	extractKeywords(text) {
		// Simple keyword extraction - you might want to use a more sophisticated approach
		const commonKeywords = [
			'agreement',
			'contract',
			'partnership',
			'employment',
			'lease',
			'sale',
			'license',
			'franchise',
			'distributor',
			'supplier',
			'manufacturing',
			'nda',
			'non-compete',
			'termination',
			'severance',
			'commission',
			'independent contractor',
			'internship',
			'residential',
			'commercial',
			'sublease',
			'rental',
			'property',
			'investment',
			'promissory',
			'convertible',
			'software',
			'website',
			'saas',
			'intellectual property',
			'data processing',
			'power of attorney',
			'affidavit',
			'settlement',
			'marriage',
			'pre-nuptial',
			'event management'
		];

		const words = text.toLowerCase().split(/\s+/);
		return words.filter((word) => commonKeywords.some((keyword) => keyword.includes(word) || word.includes(keyword)));
	}
}

export default new ContractTypeService();
