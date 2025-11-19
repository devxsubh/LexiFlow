import Joi from 'joi';
import { mongoId } from './customValidation';

// Common pagination validation
const paginationQuery = Joi.object({
	page: Joi.number().integer().min(1),
	limit: Joi.number().integer().min(1).max(100),
	sortBy: Joi.string(),
	sortDirection: Joi.string().valid('asc', 'desc')
});

const createContractType = {
	body: Joi.object().keys({
		name: Joi.string().required().min(2).max(100).trim(),
		displayName: Joi.string().required().min(2).max(200).trim(),
		category: Joi.string()
			.required()
			.valid(
				'Business & Commercial',
				'Employment & HR',
				'Property & Real Estate',
				'Finance & Lending',
				'Technology & IP',
				'Personal & Miscellaneous'
			),
		description: Joi.string().required().min(10).max(2000).trim(),
		shortDescription: Joi.string().max(500).trim(),
		keywords: Joi.array().items(Joi.string().trim()),
		relatedTypes: Joi.array().items(Joi.string().custom(mongoId)),
		commonClauses: Joi.array().items(Joi.string().trim()),
		requiredParties: Joi.array().items(Joi.string().trim()),
		typicalDuration: Joi.string().valid('short-term', 'medium-term', 'long-term', 'ongoing', 'one-time'),
		complexity: Joi.string().valid('simple', 'moderate', 'complex'),
		jurisdictionSpecific: Joi.boolean(),
		supportedJurisdictions: Joi.array().items(Joi.string().trim()),
		industrySpecific: Joi.boolean(),
		supportedIndustries: Joi.array().items(Joi.string().trim()),
		isPublic: Joi.boolean(),
		metadata: Joi.object({
			seoKeywords: Joi.array().items(Joi.string().trim()),
			searchTags: Joi.array().items(Joi.string().trim()),
			similarTypes: Joi.array().items(Joi.string().trim()),
			legalRequirements: Joi.array().items(Joi.string().trim()),
			commonIssues: Joi.array().items(Joi.string().trim()),
			bestPractices: Joi.array().items(Joi.string().trim())
		})
	})
};

const updateContractType = {
	params: Joi.object().keys({
		contractTypeId: Joi.string().custom(mongoId).required()
	}),
	body: Joi.object()
		.keys({
			name: Joi.string().min(2).max(100).trim(),
			displayName: Joi.string().min(2).max(200).trim(),
			category: Joi.string().valid(
				'Business & Commercial',
				'Employment & HR',
				'Property & Real Estate',
				'Finance & Lending',
				'Technology & IP',
				'Personal & Miscellaneous'
			),
			description: Joi.string().min(10).max(2000).trim(),
			shortDescription: Joi.string().max(500).trim(),
			keywords: Joi.array().items(Joi.string().trim()),
			relatedTypes: Joi.array().items(Joi.string().custom(mongoId)),
			commonClauses: Joi.array().items(Joi.string().trim()),
			requiredParties: Joi.array().items(Joi.string().trim()),
			typicalDuration: Joi.string().valid('short-term', 'medium-term', 'long-term', 'ongoing', 'one-time'),
			complexity: Joi.string().valid('simple', 'moderate', 'complex'),
			jurisdictionSpecific: Joi.boolean(),
			supportedJurisdictions: Joi.array().items(Joi.string().trim()),
			industrySpecific: Joi.boolean(),
			supportedIndustries: Joi.array().items(Joi.string().trim()),
			isActive: Joi.boolean(),
			isPublic: Joi.boolean(),
			metadata: Joi.object({
				seoKeywords: Joi.array().items(Joi.string().trim()),
				searchTags: Joi.array().items(Joi.string().trim()),
				similarTypes: Joi.array().items(Joi.string().trim()),
				legalRequirements: Joi.array().items(Joi.string().trim()),
				commonIssues: Joi.array().items(Joi.string().trim()),
				bestPractices: Joi.array().items(Joi.string().trim())
			})
		})
		.min(1)
};

const getContractType = {
	params: Joi.object().keys({
		contractTypeId: Joi.string().custom(mongoId).required()
	})
};

const deleteContractType = {
	params: Joi.object().keys({
		contractTypeId: Joi.string().custom(mongoId).required()
	})
};

const searchContractTypes = {
	query: Joi.object()
		.keys({
			q: Joi.string().min(1),
			category: Joi.string().valid(
				'Business & Commercial',
				'Employment & HR',
				'Property & Real Estate',
				'Finance & Lending',
				'Technology & IP',
				'Personal & Miscellaneous'
			),
			complexity: Joi.string().valid('simple', 'moderate', 'complex'),
			typicalDuration: Joi.string().valid('short-term', 'medium-term', 'long-term', 'ongoing', 'one-time'),
			jurisdiction: Joi.string(),
			industry: Joi.string(),
			isPublic: Joi.boolean()
		})
		.concat(paginationQuery)
};

const getContractTypesByCategory = {
	params: Joi.object().keys({
		category: Joi.string()
			.required()
			.valid(
				'Business & Commercial',
				'Employment & HR',
				'Property & Real Estate',
				'Finance & Lending',
				'Technology & IP',
				'Personal & Miscellaneous'
			)
	}),
	query: paginationQuery
};

const getSimilarContractTypes = {
	params: Joi.object().keys({
		contractTypeId: Joi.string().custom(mongoId).required()
	}),
	query: Joi.object().keys({
		limit: Joi.number().integer().min(1).max(20).default(5)
	})
};

const getPopularContractTypes = {
	query: Joi.object().keys({
		limit: Joi.number().integer().min(1).max(50).default(10),
		category: Joi.string().valid(
			'Business & Commercial',
			'Employment & HR',
			'Property & Real Estate',
			'Finance & Lending',
			'Technology & IP',
			'Personal & Miscellaneous'
		)
	})
};

const recommendContractTypes = {
	body: Joi.object().keys({
		context: Joi.string().required().min(10),
		industry: Joi.string(),
		jurisdiction: Joi.string(),
		parties: Joi.array().items(Joi.string()),
		requirements: Joi.array().items(Joi.string()),
		limit: Joi.number().integer().min(1).max(10).default(5)
	})
};

export default {
	createContractType,
	updateContractType,
	getContractType,
	deleteContractType,
	searchContractTypes,
	getContractTypesByCategory,
	getSimilarContractTypes,
	getPopularContractTypes,
	recommendContractTypes
};
