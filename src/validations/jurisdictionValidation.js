import Joi from 'joi';

const createJurisdiction = {
	body: Joi.object().keys({
		name: Joi.string().required().trim(),
		displayName: Joi.string().required().trim(),
		type: Joi.string().valid('state', 'union_territory', 'central').default('state'),
		code: Joi.string().required().trim(),
		capital: Joi.string().trim(),
		highCourt: Joi.string().trim(),
		highCourtLocation: Joi.string().trim(),
		districts: Joi.array().items(Joi.string().trim()),
		officialLanguage: Joi.array().items(Joi.string().trim()),
		additionalLanguages: Joi.array().items(Joi.string().trim()),
		population: Joi.number().positive(),
		area: Joi.number().positive(),
		description: Joi.string().trim(),
		legalSystem: Joi.string().valid('common_law', 'civil_law', 'mixed').default('common_law'),
		specialProvisions: Joi.array().items(Joi.string().trim()),
		applicableLaws: Joi.array().items(Joi.string().trim()),
		timeZone: Joi.string().trim(),
		region: Joi.string().valid('north', 'south', 'east', 'west', 'central', 'northeast', 'central_government').default('north'),
		isActive: Joi.boolean().default(true),
		isPublic: Joi.boolean().default(true),
		metadata: Joi.object({
			seoKeywords: Joi.array().items(Joi.string().trim()),
			searchTags: Joi.array().items(Joi.string().trim()),
			legalRequirements: Joi.array().items(Joi.string().trim()),
			commonIssues: Joi.array().items(Joi.string().trim()),
			bestPractices: Joi.array().items(Joi.string().trim()),
			contactInfo: Joi.object({
				officialWebsite: Joi.string().uri().trim(),
				contactEmail: Joi.string().email().trim(),
				contactPhone: Joi.string().trim()
			})
		})
	})
};

const updateJurisdiction = {
	params: Joi.object().keys({
		jurisdictionId: Joi.string()
			.required()
			.custom((value, helpers) => {
				if (!value.match(/^[0-9a-fA-F]{24}$/)) {
					return helpers.message('params.jurisdictionId must be a valid mongo id');
				}
				return value;
			})
	}),
	body: Joi.object()
		.keys({
			name: Joi.string().trim(),
			displayName: Joi.string().trim(),
			type: Joi.string().valid('state', 'union_territory', 'central'),
			code: Joi.string().trim(),
			capital: Joi.string().trim(),
			highCourt: Joi.string().trim(),
			highCourtLocation: Joi.string().trim(),
			districts: Joi.array().items(Joi.string().trim()),
			officialLanguage: Joi.array().items(Joi.string().trim()),
			additionalLanguages: Joi.array().items(Joi.string().trim()),
			population: Joi.number().positive(),
			area: Joi.number().positive(),
			description: Joi.string().trim(),
			legalSystem: Joi.string().valid('common_law', 'civil_law', 'mixed'),
			specialProvisions: Joi.array().items(Joi.string().trim()),
			applicableLaws: Joi.array().items(Joi.string().trim()),
			timeZone: Joi.string().trim(),
			region: Joi.string().valid('north', 'south', 'east', 'west', 'central', 'northeast', 'central_government'),
			isActive: Joi.boolean(),
			isPublic: Joi.boolean(),
			metadata: Joi.object({
				seoKeywords: Joi.array().items(Joi.string().trim()),
				searchTags: Joi.array().items(Joi.string().trim()),
				legalRequirements: Joi.array().items(Joi.string().trim()),
				commonIssues: Joi.array().items(Joi.string().trim()),
				bestPractices: Joi.array().items(Joi.string().trim()),
				contactInfo: Joi.object({
					officialWebsite: Joi.string().uri().trim(),
					contactEmail: Joi.string().email().trim(),
					contactPhone: Joi.string().trim()
				})
			})
		})
		.min(1)
};

const getJurisdiction = {
	params: Joi.object().keys({
		jurisdictionId: Joi.string()
			.required()
			.custom((value, helpers) => {
				if (!value.match(/^[0-9a-fA-F]{24}$/)) {
					return helpers.message('params.jurisdictionId must be a valid mongo id');
				}
				return value;
			})
	})
};

const deleteJurisdiction = {
	params: Joi.object().keys({
		jurisdictionId: Joi.string()
			.required()
			.custom((value, helpers) => {
				if (!value.match(/^[0-9a-fA-F]{24}$/)) {
					return helpers.message('params.jurisdictionId must be a valid mongo id');
				}
				return value;
			})
	})
};

const searchJurisdictions = {
	query: Joi.object().keys({
		q: Joi.string().trim(),
		type: Joi.string().valid('state', 'union_territory', 'central'),
		region: Joi.string().valid('north', 'south', 'east', 'west', 'central', 'northeast', 'central_government'),
		highCourt: Joi.string().trim(),
		legalSystem: Joi.string().valid('common_law', 'civil_law', 'mixed'),
		isActive: Joi.boolean(),
		...paginationQuery
	})
};

const getJurisdictionsByType = {
	params: Joi.object().keys({
		type: Joi.string().required().valid('state', 'union_territory', 'central')
	}),
	query: Joi.object().keys({
		...paginationQuery
	})
};

const getJurisdictionsByRegion = {
	params: Joi.object().keys({
		region: Joi.string().required().valid('north', 'south', 'east', 'west', 'central', 'northeast', 'central_government')
	}),
	query: Joi.object().keys({
		...paginationQuery
	})
};

const getJurisdictionsByHighCourt = {
	params: Joi.object().keys({
		highCourt: Joi.string().required().trim()
	}),
	query: Joi.object().keys({
		...paginationQuery
	})
};

const getJurisdictionStats = {
	query: Joi.object().keys({
		groupBy: Joi.string().valid('type', 'region', 'legalSystem').default('type')
	})
};

// Search jurisdictions by keyword
const searchJurisdictionsByKeyword = {
	query: Joi.object().keys({
		keyword: Joi.string().required().trim(),
		limit: Joi.number().integer().min(1).max(100).default(10)
	})
};

// Common pagination query schema
const paginationQuery = {
	page: Joi.number().integer().min(1).default(1),
	limit: Joi.number().integer().min(1).max(100).default(10),
	sortBy: Joi.string().valid('name', 'displayName', 'code', 'capital', 'population', 'area', 'createdAt').default('name'),
	sortDirection: Joi.string().valid('asc', 'desc').default('asc')
};

export default {
	createJurisdiction,
	updateJurisdiction,
	getJurisdiction,
	deleteJurisdiction,
	searchJurisdictions,
	getJurisdictionsByType,
	getJurisdictionsByRegion,
	getJurisdictionsByHighCourt,
	getJurisdictionStats,
	searchJurisdictionsByKeyword
};
