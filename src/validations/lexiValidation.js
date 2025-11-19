import Joi from 'joi';
import { mongoId } from './customValidation';

export const createConversation = {
	body: Joi.object().keys({
		title: Joi.string().trim().min(2).max(100).required(),
		description: Joi.string().trim().max(500).optional()
	})
};

export const getUserConversations = {
	query: Joi.object().keys({
		status: Joi.string().valid('active', 'archived', 'deleted').default('active'),
		sortBy: Joi.string().valid('createdAt', 'updatedAt', 'title').default('updatedAt'),
		sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
		limit: Joi.number().integer().min(1).max(100).default(10),
		page: Joi.number().integer().min(1).default(1)
	})
};

export const getConversation = {
	params: Joi.object().keys({
		conversationId: Joi.string().custom(mongoId).required()
	})
};

export const summarizeText = {
	body: Joi.object().keys({
		text: Joi.string().trim().min(1).max(10000).required(),
		conversationId: Joi.string().custom(mongoId)
	})
};

export const explainLegalJargon = {
	body: Joi.object().keys({
		text: Joi.string().trim().min(1).max(10000).required(),
		conversationId: Joi.string().custom(mongoId)
	})
};

export const analyzeRisks = {
	body: Joi.object().keys({
		text: Joi.string().trim().min(1).max(10000).required(),
		conversationId: Joi.string().custom(mongoId)
	})
};

export const suggestClauses = {
	body: Joi.object().keys({
		context: Joi.string().trim().min(1).max(10000).required(),
		type: Joi.string().trim().min(2).max(50).required(),
		conversationId: Joi.string().custom(mongoId)
	})
};

export const adjustTone = {
	body: Joi.object().keys({
		text: Joi.string().trim().min(1).max(10000).required(),
		targetTone: Joi.string().valid('friendly', 'strict', 'neutral').required(),
		conversationId: Joi.string().custom(mongoId)
	})
};

export const chat = {
	body: Joi.object().keys({
		message: Joi.string().trim().min(1).max(10000).required(),
		conversationId: Joi.string().custom(mongoId).optional(),
		context: Joi.object()
			.keys({
				documentType: Joi.string().valid('contract', 'agreement', 'clause', 'legal_text').optional(),
				tone: Joi.string().valid('formal', 'friendly', 'strict').optional()
			})
			.optional()
	})
};

export default {
	createConversation,
	getUserConversations,
	getConversation,
	summarizeText,
	explainLegalJargon,
	analyzeRisks,
	suggestClauses,
	adjustTone,
	chat
};
