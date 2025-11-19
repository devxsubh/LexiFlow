import Jurisdiction from '../models/Jurisdiction.js';
import cacheService from './cacheService.js';
import APIError from '../utils/apiError.js';
import httpStatus from 'http-status';

class JurisdictionService {
	async createJurisdiction(jurisdictionData, userId) {
		try {
			// Check if jurisdiction with same name or code already exists
			const existing = await Jurisdiction.findOne({
				$or: [{ name: jurisdictionData.name }, { code: jurisdictionData.code }]
			});
			if (existing) {
				throw new APIError('Jurisdiction with this name or code already exists', httpStatus.CONFLICT);
			}

			const jurisdiction = new Jurisdiction({
				...jurisdictionData,
				createdBy: userId,
				updatedBy: userId
			});

			await jurisdiction.save();

			// Invalidate cache
			await cacheService.invalidateCache('jurisdictions:*');

			return jurisdiction;
		} catch (error) {
			if (error instanceof APIError) throw error;
			throw new APIError('Failed to create jurisdiction', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async updateJurisdiction(jurisdictionId, updateData, userId) {
		try {
			const jurisdiction = await Jurisdiction.findById(jurisdictionId);
			if (!jurisdiction) {
				throw new APIError('Jurisdiction not found', httpStatus.NOT_FOUND);
			}

			// Check if name or code is being updated and if it conflicts with existing
			if (
				(updateData.name && updateData.name !== jurisdiction.name) ||
				(updateData.code && updateData.code !== jurisdiction.code)
			) {
				const existing = await Jurisdiction.findOne({
					_id: { $ne: jurisdictionId },
					$or: [{ name: updateData.name }, { code: updateData.code }]
				});
				if (existing) {
					throw new APIError('Jurisdiction with this name or code already exists', httpStatus.CONFLICT);
				}
			}

			Object.assign(jurisdiction, updateData, { updatedBy: userId });
			await jurisdiction.save();

			// Invalidate cache
			await cacheService.invalidateCache('jurisdictions:*');

			return jurisdiction;
		} catch (error) {
			if (error instanceof APIError) throw error;
			throw new APIError('Failed to update jurisdiction', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async getJurisdictionById(jurisdictionId) {
		try {
			const jurisdiction = await Jurisdiction.findById(jurisdictionId)
				.populate('createdBy', 'firstName lastName')
				.populate('updatedBy', 'firstName lastName');

			if (!jurisdiction) {
				throw new APIError('Jurisdiction not found', httpStatus.NOT_FOUND);
			}

			return jurisdiction;
		} catch (error) {
			if (error instanceof APIError) throw error;
			throw new APIError('Failed to get jurisdiction', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async deleteJurisdiction(jurisdictionId) {
		try {
			const jurisdiction = await Jurisdiction.findById(jurisdictionId);
			if (!jurisdiction) {
				throw new APIError('Jurisdiction not found', httpStatus.NOT_FOUND);
			}

			await Jurisdiction.findByIdAndDelete(jurisdictionId);

			// Invalidate cache
			await cacheService.invalidateCache('jurisdictions:*');

			return { message: 'Jurisdiction deleted successfully' };
		} catch (error) {
			if (error instanceof APIError) throw error;
			throw new APIError('Failed to delete jurisdiction', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async searchJurisdictions(query, filters = {}, options = {}) {
		try {
			const cacheKey = `jurisdictions_search:${JSON.stringify({ query, filters, options })}`;

			// Try to get from cache first
			const cached = await cacheService.getCachedJurisdictions(cacheKey);
			if (cached) {
				return cached;
			}

			const searchQuery = { isActive: true, ...filters };

			if (query) {
				searchQuery.$or = [
					{ name: { $regex: query, $options: 'i' } },
					{ displayName: { $regex: query, $options: 'i' } },
					{ code: { $regex: query, $options: 'i' } },
					{ capital: { $regex: query, $options: 'i' } },
					{ highCourt: { $regex: query, $options: 'i' } },
					{ 'metadata.searchTags': { $in: [new RegExp(query, 'i')] } }
				];
			}

			const result = await Jurisdiction.paginate(options, null, searchQuery);

			// Cache the result
			await cacheService.cacheJurisdictions(cacheKey, result);

			return result;
		} catch (error) {
			throw new APIError('Failed to search jurisdictions', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async getJurisdictionsByType(type, options = {}) {
		try {
			const cacheKey = `jurisdictions_type:${type}:${JSON.stringify(options)}`;

			// Try to get from cache first
			const cached = await cacheService.getCachedJurisdictions(cacheKey);
			if (cached) {
				return cached;
			}

			const result = await Jurisdiction.paginate(options, null, { type, isActive: true });

			// Cache the result
			await cacheService.cacheJurisdictions(cacheKey, result);

			return result;
		} catch (error) {
			throw new APIError('Failed to get jurisdictions by type', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async getJurisdictionsByRegion(region, options = {}) {
		try {
			const cacheKey = `jurisdictions_region:${region}:${JSON.stringify(options)}`;

			// Try to get from cache first
			const cached = await cacheService.getCachedJurisdictions(cacheKey);
			if (cached) {
				return cached;
			}

			const result = await Jurisdiction.paginate(options, null, { region, isActive: true });

			// Cache the result
			await cacheService.cacheJurisdictions(cacheKey, result);

			return result;
		} catch (error) {
			throw new APIError('Failed to get jurisdictions by region', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async getJurisdictionsByHighCourt(highCourt, options = {}) {
		try {
			const cacheKey = `jurisdictions_highcourt:${highCourt}:${JSON.stringify(options)}`;

			// Try to get from cache first
			const cached = await cacheService.getCachedJurisdictions(cacheKey);
			if (cached) {
				return cached;
			}

			const result = await Jurisdiction.paginate(options, null, { highCourt, isActive: true });

			// Cache the result
			await cacheService.cacheJurisdictions(cacheKey, result);

			return result;
		} catch (error) {
			throw new APIError('Failed to get jurisdictions by high court', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async getAllTypes() {
		try {
			const cacheKey = 'jurisdiction_types';
			const cached = await cacheService.getCachedJurisdictions(cacheKey);
			if (cached) {
				return cached;
			}

			const types = await Jurisdiction.distinct('type', { isActive: true });
			await cacheService.cacheJurisdictions(cacheKey, types);
			return types;
		} catch (error) {
			throw new APIError('Failed to get jurisdiction types', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async getAllRegions() {
		try {
			const cacheKey = 'jurisdiction_regions';
			const cached = await cacheService.getCachedJurisdictions(cacheKey);
			if (cached) {
				return cached;
			}

			const regions = await Jurisdiction.distinct('region', { isActive: true });
			await cacheService.cacheJurisdictions(cacheKey, regions);
			return regions;
		} catch (error) {
			throw new APIError('Failed to get jurisdiction regions', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async getAllHighCourts() {
		try {
			const cacheKey = 'jurisdiction_highcourts';
			const cached = await cacheService.getCachedJurisdictions(cacheKey);
			if (cached) {
				return cached;
			}

			const highCourts = await Jurisdiction.distinct('highCourt', {
				isActive: true,
				highCourt: { $exists: true, $ne: null, $ne: '' }
			});
			await cacheService.cacheJurisdictions(cacheKey, highCourts);
			return highCourts;
		} catch (error) {
			throw new APIError('Failed to get high courts', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async getJurisdictionStats(groupBy = 'type') {
		try {
			const cacheKey = `jurisdiction_stats:${groupBy}`;
			const cached = await cacheService.getCachedJurisdictions(cacheKey);
			if (cached) {
				return cached;
			}

			let stats;
			if (groupBy === 'type') {
				stats = await Jurisdiction.aggregate([
					{ $match: { isActive: true } },
					{
						$group: {
							_id: '$type',
							count: { $sum: 1 },
							totalPopulation: { $sum: '$population' },
							avgArea: { $avg: '$area' }
						}
					},
					{ $sort: { count: -1 } }
				]);
			} else if (groupBy === 'region') {
				stats = await Jurisdiction.aggregate([
					{ $match: { isActive: true } },
					{
						$group: {
							_id: '$region',
							count: { $sum: 1 },
							totalPopulation: { $sum: '$population' },
							avgArea: { $avg: '$area' }
						}
					},
					{ $sort: { count: -1 } }
				]);
			} else if (groupBy === 'legalSystem') {
				stats = await Jurisdiction.aggregate([
					{ $match: { isActive: true } },
					{
						$group: {
							_id: '$legalSystem',
							count: { $sum: 1 }
						}
					},
					{ $sort: { count: -1 } }
				]);
			}

			const totalJurisdictions = await Jurisdiction.countDocuments({ isActive: true });
			const totalPopulation = await Jurisdiction.aggregate([
				{ $match: { isActive: true, population: { $exists: true, $ne: null } } },
				{ $group: { _id: null, total: { $sum: '$population' } } }
			]);

			const result = {
				totalJurisdictions,
				totalPopulation: totalPopulation[0]?.total || 0,
				groupBy,
				stats
			};

			await cacheService.cacheJurisdictions(cacheKey, result);
			return result;
		} catch (error) {
			throw new APIError('Failed to get jurisdiction statistics', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async getJurisdictionsByKeyword(keyword, limit = 10) {
		try {
			const cacheKey = `jurisdictions_keyword:${keyword}:${limit}`;
			const cached = await cacheService.getCachedJurisdictions(cacheKey);
			if (cached) {
				return cached;
			}

			const jurisdictions = await Jurisdiction.find({
				isActive: true,
				$or: [
					{ name: { $regex: keyword, $options: 'i' } },
					{ displayName: { $regex: keyword, $options: 'i' } },
					{ code: { $regex: keyword, $options: 'i' } },
					{ capital: { $regex: keyword, $options: 'i' } },
					{ highCourt: { $regex: keyword, $options: 'i' } },
					{ 'metadata.searchTags': { $in: [new RegExp(keyword, 'i')] } }
				]
			})
				.limit(limit)
				.sort({ name: 1 });

			await cacheService.cacheJurisdictions(cacheKey, jurisdictions);
			return jurisdictions;
		} catch (error) {
			throw new APIError('Failed to search jurisdictions by keyword', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}

export default new JurisdictionService();
