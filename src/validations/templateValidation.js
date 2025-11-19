import Joi from 'joi';
import { mongoId } from './customValidation';

const reviewSchema = Joi.object({
	rating: Joi.number().min(0).max(5).required(),
	comment: Joi.string().max(500)
});

const templateSchema = Joi.object({
	title: Joi.string().required().min(3).max(200),
	type: Joi.string().required(),
	description: Joi.string().required().min(10).max(1000),
	category: Joi.string().required(),
	industry: Joi.string().required(),
	jurisdiction: Joi.string().required(),
	content: Joi.string().required(),
	tags: Joi.array().items(Joi.string()),
	version: Joi.string().default('1.0'),
	isPublic: Joi.boolean().default(true),
	usageCount: Joi.number().default(0),
	rating: Joi.number().min(0).max(5).default(0),
	reviews: Joi.array().items(reviewSchema).default([])
});

const validateTemplate = (data) => {
	const { error, value } = templateSchema.validate(data, {
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

// Common pagination validation
const paginationQuery = Joi.object().keys({
	page: Joi.number().integer().min(1).default(1),
	limit: Joi.number().integer().min(1).max(100).default(10),
	sortBy: Joi.string(),
	sortDirection: Joi.string().valid('asc', 'desc')
});

const searchTemplates = {
	query: Joi.object()
		.keys({
			q: Joi.string().min(1),
			category: Joi.string(),
			industry: Joi.string(),
			enforceability: Joi.string().valid('High', 'Medium', 'Low')
		})
		.concat(paginationQuery)
};

const getTemplatesByCategory = {
	params: Joi.object().keys({
		category: Joi.string().required()
	}),
	query: paginationQuery
};

const getTemplatesByIndustry = {
	params: Joi.object().keys({
		industry: Joi.string().required()
	}),
	query: paginationQuery
};

const createTemplate = {
	body: templateSchema
};

const updateTemplate = {
	params: Joi.object().keys({
		templateId: Joi.string().custom(mongoId).required()
	}),
	body: templateSchema.min(1)
};

const getTemplateById = {
	params: Joi.object().keys({
		templateId: Joi.string().custom(mongoId).required()
	})
};

const deleteTemplate = {
	params: Joi.object().keys({
		id: Joi.string().custom(mongoId).required()
	})
};

const addReview = {
	params: Joi.object().keys({
		id: Joi.string().custom(mongoId).required()
	}),
	body: reviewSchema
};

const getPopularTemplates = {
	query: paginationQuery
};

const getTemplatesByEnforceability = {
	params: Joi.object().keys({
		enforceability: Joi.string().valid('High', 'Medium', 'Low').required()
	}),
	query: paginationQuery
};

const convertToContract = {
	params: Joi.object().keys({
		templateId: Joi.string().custom(mongoId).required()
	}),
	body: Joi.object().keys({
		title: Joi.string().min(3).max(200),
		type: Joi.string(),
		description: Joi.string().min(10).max(1000),
		parties: Joi.array().items(
			Joi.object({
				name: Joi.string().required(),
				role: Joi.string().required(),
				email: Joi.string().email(),
				aadhaar: Joi.string()
			})
		),
		jurisdiction: Joi.string(),
		startDate: Joi.date(),
		endDate: Joi.date().min(Joi.ref('startDate'))
	})
};

// Rating validation schemas
const addRating = {
	params: Joi.object().keys({
		templateId: Joi.string().custom(mongoId).required()
	}),
	body: Joi.object().keys({
		rating: Joi.number().min(1).max(5).required().messages({
			'number.min': 'Rating must be at least 1',
			'number.max': 'Rating cannot exceed 5',
			'any.required': 'Rating is required'
		})
	})
};

const updateRating = {
	params: Joi.object().keys({
		templateId: Joi.string().custom(mongoId).required()
	}),
	body: Joi.object().keys({
		rating: Joi.number().min(1).max(5).required().messages({
			'number.min': 'Rating must be at least 1',
			'number.max': 'Rating cannot exceed 5',
			'any.required': 'Rating is required'
		})
	})
};

const deleteRating = {
	params: Joi.object().keys({
		templateId: Joi.string().custom(mongoId).required()
	})
};

const getTemplateRatings = {
	params: Joi.object().keys({
		templateId: Joi.string().custom(mongoId).required()
	}),
	query: paginationQuery
};

const getUserRating = {
	params: Joi.object().keys({
		templateId: Joi.string().custom(mongoId).required()
	})
};

const getMyRatings = {
	query: paginationQuery
};

const getSimilarTemplates = {
	params: Joi.object().keys({
		templateId: Joi.string().custom(mongoId).required()
	}),
	query: Joi.object().keys({
		limit: Joi.number().integer().min(1).max(50).default(10),
		excludeCurrent: Joi.boolean().default(true)
	})
};

const getTemplateSuggestions = {
	params: Joi.object().keys({
		templateId: Joi.string().custom(mongoId).required()
	}),
	query: Joi.object().keys({
		limit: Joi.number().integer().min(1).max(50).default(10),
		excludeCurrent: Joi.boolean().default(true),
		includeSimilar: Joi.boolean().default(true),
		includePopular: Joi.boolean().default(true)
	})
};

export default {
	validateTemplate,
	searchTemplates,
	getTemplatesByCategory,
	getTemplatesByIndustry,
	createTemplate,
	updateTemplate,
	getTemplateById,
	deleteTemplate,
	addReview,
	getPopularTemplates,
	getTemplatesByEnforceability,
	convertToContract,
	addRating,
	updateRating,
	deleteRating,
	getTemplateRatings,
	getUserRating,
	getMyRatings,
	getSimilarTemplates,
	getTemplateSuggestions
};
