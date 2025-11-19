const Joi = require('joi');

// Common pagination validation
const paginationQuery = Joi.object({
	page: Joi.number().integer().min(1),
	limit: Joi.number().integer().min(1).max(100),
	sortBy: Joi.string(),
	sortDirection: Joi.string().valid('asc', 'desc')
});

const clauseSchema = Joi.object({
	title: Joi.string().required().min(3).max(200),
	content: Joi.string().required().min(10),
	category: Joi.string()
		.required()
		.valid('IP', 'Liability', 'Termination', 'Confidentiality', 'General', 'Payment', 'Warranty', 'Indemnification'),
	jurisdiction: Joi.string().required(),
	useCases: Joi.array().items(Joi.string()),
	keywords: Joi.array().items(Joi.string()),
	isMustHave: Joi.boolean(),
	contractTypes: Joi.array().items(Joi.string()),
	tone: Joi.string().valid('Formal', 'Neutral', 'Friendly', 'Strict'),
	version: Joi.string(),
	isPublic: Joi.boolean()
});

const validateClause = (data) => {
	const { error, value } = clauseSchema.validate(data, {
		abortEarly: false,
		stripUnknown: true
	});

	if (error) {
		return {
			success: false,
			error: error.details.map((detail) => detail.message).join(', ')
		};
	}

	return { success: true, value };
};

const searchClauses = {
	query: Joi.object({
		query: Joi.string().allow(''),
		category: Joi.string().valid(
			'IP',
			'Liability',
			'Termination',
			'Confidentiality',
			'General',
			'Payment',
			'Warranty',
			'Indemnification'
		),
		jurisdiction: Joi.string(),
		contractType: Joi.string()
	}).concat(paginationQuery)
};

const getClausesByCategory = {
	params: Joi.object({
		category: Joi.string()
			.valid('IP', 'Liability', 'Termination', 'Confidentiality', 'General', 'Payment', 'Warranty', 'Indemnification')
			.required()
	}),
	query: Joi.object({
		jurisdiction: Joi.string(),
		contractType: Joi.string()
	}).concat(paginationQuery)
};

const getMustHaveClauses = {
	params: Joi.object({
		contractType: Joi.string().required()
	}),
	query: paginationQuery
};

const createClause = { body: clauseSchema };
const updateClause = { body: clauseSchema, params: Joi.object({ id: Joi.string().required() }) };
const deleteClause = { params: Joi.object({ id: Joi.string().required() }) };
const rewriteClause = {
	params: Joi.object({ id: Joi.string().required() }),
	body: Joi.object({
		contractId: Joi.string().required(),
		tone: Joi.string().valid('Formal', 'Neutral', 'Friendly', 'Strict')
	})
};
const getAllClauses = { query: paginationQuery };
const getClauseById = { params: Joi.object({ id: Joi.string().required() }) };

module.exports = {
	validateClause,
	searchClauses,
	getClausesByCategory,
	getMustHaveClauses,
	createClause,
	updateClause,
	deleteClause,
	rewriteClause,
	getAllClauses,
	getClauseById
};
