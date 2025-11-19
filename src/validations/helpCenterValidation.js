import Joi from 'joi';
import { mongoId } from './customValidation';

const createHelpCenterTicket = {
	body: Joi.object().keys({
		subject: Joi.string().required().trim().max(200).messages({
			'string.empty': 'Subject is required',
			'string.max': 'Subject cannot exceed 200 characters'
		}),
		message: Joi.string().required().trim().max(2000).messages({
			'string.empty': 'Message is required',
			'string.max': 'Message cannot exceed 2000 characters'
		}),
		category: Joi.string()
			.valid('general', 'technical', 'billing', 'consultation', 'contract', 'account', 'feature_request', 'bug_report', 'other')
			.default('general'),
		priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional()
	})
};

const updateHelpCenterTicket = {
	params: Joi.object().keys({
		ticketId: Joi.string().custom(mongoId).required()
	}),
	body: Joi.object().keys({
		subject: Joi.string().trim().max(200).optional(),
		message: Joi.string().trim().max(2000).optional(),
		category: Joi.string()
			.valid('general', 'technical', 'billing', 'consultation', 'contract', 'account', 'feature_request', 'bug_report', 'other')
			.optional(),
		priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
		status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed').optional()
	})
};

const respondToTicket = {
	params: Joi.object().keys({
		ticketId: Joi.string().custom(mongoId).required()
	}),
	body: Joi.object().keys({
		response: Joi.string().required().trim().max(2000).messages({
			'string.empty': 'Response message is required',
			'string.max': 'Response cannot exceed 2000 characters'
		}),
		status: Joi.string().valid('in_progress', 'resolved', 'closed').optional(),
		assignedTo: Joi.string().custom(mongoId).optional(),
		escalated: Joi.boolean().optional()
	})
};

const getHelpCenterTicket = {
	params: Joi.object().keys({
		ticketId: Joi.string().custom(mongoId).required()
	})
};

const getMyTickets = {
	query: Joi.object().keys({
		status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed').optional(),
		category: Joi.string()
			.valid('general', 'technical', 'billing', 'consultation', 'contract', 'account', 'feature_request', 'bug_report', 'other')
			.optional(),
		priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
		page: Joi.number().integer().min(1).optional(),
		limit: Joi.number().integer().min(1).max(100).optional(),
		sortBy: Joi.string().valid('createdAt', 'updatedAt', 'priority', 'status').optional(),
		sortOrder: Joi.string().valid('asc', 'desc').optional()
	})
};

const getAllTickets = {
	query: Joi.object().keys({
		status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed').optional(),
		category: Joi.string()
			.valid('general', 'technical', 'billing', 'consultation', 'contract', 'account', 'feature_request', 'bug_report', 'other')
			.optional(),
		priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
		assignedTo: Joi.string().custom(mongoId).optional(),
		userId: Joi.string().custom(mongoId).optional(),
		escalated: Joi.boolean().optional(),
		page: Joi.number().integer().min(1).optional(),
		limit: Joi.number().integer().min(1).max(100).optional(),
		sortBy: Joi.string().valid('createdAt', 'updatedAt', 'priority', 'status').optional(),
		sortOrder: Joi.string().valid('asc', 'desc').optional()
	})
};

const deleteHelpCenterTicket = {
	params: Joi.object().keys({
		ticketId: Joi.string().custom(mongoId).required()
	})
};

export default {
	createHelpCenterTicket,
	updateHelpCenterTicket,
	respondToTicket,
	getHelpCenterTicket,
	getMyTickets,
	getAllTickets,
	deleteHelpCenterTicket
};
