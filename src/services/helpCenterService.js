import HelpCenter from '../models/HelpCenter';
import User from '../models/userModel';
import APIError from '../utils/apiError';
import logger from '../config/logger';
import httpStatus from 'http-status';
import emailService from './emailService/index';

class HelpCenterService {
	/**
	 * Get priority based on category
	 * @param {string} category - The ticket category
	 * @returns {string} - The priority level
	 */
	getPriorityByCategory(category) {
		const priorityMap = {
			billing: 'urgent', // Payment issues are critical
			technical: 'high', // Technical issues need quick resolution
			bug_report: 'high', // Bug reports need immediate attention
			general: 'medium', // General inquiries
			consultation: 'medium', // Consultation requests
			contract: 'medium', // Contract-related issues
			account: 'medium', // Account management
			feature_request: 'low', // Enhancement requests
			other: 'low' // Miscellaneous
		};

		return priorityMap[category] || 'medium';
	}

	async createTicket(userId, ticketData) {
		try {
			// Auto-set priority based on category if not provided
			if (!ticketData.priority && ticketData.category) {
				ticketData.priority = this.getPriorityByCategory(ticketData.category);
			}

			// Create the help center ticket
			const ticket = await HelpCenter.create({
				userId,
				...ticketData
			});

			// Populate user details
			await ticket.populate('userId', 'firstName lastName email userName');

			// Send email notification to user
			try {
				await emailService.sendHelpCenterTicketNotification(ticket.userId.email, ticket);
			} catch (error) {
				logger.error('Failed to send help center ticket notification email:', error);
			}

			logger.info(`Help center ticket created: ${ticket._id} by user: ${userId}`);
			return ticket;
		} catch (error) {
			logger.error('Error creating help center ticket:', error);
			throw new APIError('Failed to create help center ticket', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async getTicketById(ticketId, userId, isAdmin = false) {
		try {
			const ticket = await HelpCenter.findById(ticketId)
				.populate('userId', 'firstName lastName email userName')
				.populate('assignedTo', 'firstName lastName email userName')
				.populate('response.respondedBy', 'firstName lastName email userName');

			if (!ticket) {
				throw new APIError('Help center ticket not found', httpStatus.NOT_FOUND);
			}

			// Check authorization - users can only view their own tickets, admins can view all
			if (!isAdmin && ticket.userId._id.toString() !== userId.toString()) {
				throw new APIError('Unauthorized to view this ticket', httpStatus.FORBIDDEN);
			}

			return ticket;
		} catch (error) {
			if (error instanceof APIError) throw error;
			logger.error('Error fetching help center ticket:', error);
			throw new APIError('Failed to fetch help center ticket', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async getMyTickets(userId, filters = {}, options = {}) {
		try {
			const query = { userId };

			// Apply filters
			if (filters.status) {
				query.status = filters.status;
			}
			if (filters.category) {
				query.category = filters.category;
			}
			if (filters.priority) {
				query.priority = filters.priority;
			}

			// Apply sorting
			const sortOptions = {};
			if (options.sortBy) {
				sortOptions[options.sortBy] = options.sortOrder === 'asc' ? 1 : -1;
			} else {
				sortOptions.createdAt = -1; // Default sort by creation date
			}

			// Apply pagination
			const page = parseInt(options.page) || 1;
			const limit = parseInt(options.limit) || 20;
			const skip = (page - 1) * limit;

			const tickets = await HelpCenter.find(query)
				.sort(sortOptions)
				.skip(skip)
				.limit(limit)
				.populate('assignedTo', 'firstName lastName');

			const total = await HelpCenter.countDocuments(query);

			return {
				tickets,
				pagination: {
					page,
					limit,
					total,
					pages: Math.ceil(total / limit)
				}
			};
		} catch (error) {
			logger.error('Error fetching user tickets:', error);
			throw new APIError('Failed to fetch tickets', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async getAllTickets(filters = {}, options = {}, isAdmin = false) {
		try {
			if (!isAdmin) {
				throw new APIError('Admin access required', httpStatus.FORBIDDEN);
			}

			const query = {};

			// Apply filters
			if (filters.status) {
				query.status = filters.status;
			}
			if (filters.category) {
				query.category = filters.category;
			}
			if (filters.priority) {
				query.priority = filters.priority;
			}
			if (filters.assignedTo) {
				query.assignedTo = filters.assignedTo;
			}
			if (filters.userId) {
				query.userId = filters.userId;
			}
			if (filters.escalated !== undefined) {
				query.escalated = filters.escalated;
			}

			// Apply sorting
			const sortOptions = {};
			if (options.sortBy) {
				sortOptions[options.sortBy] = options.sortOrder === 'asc' ? 1 : -1;
			} else {
				sortOptions.createdAt = -1; // Default sort by creation date
			}

			// Apply pagination
			const page = parseInt(options.page) || 1;
			const limit = parseInt(options.limit) || 20;
			const skip = (page - 1) * limit;

			const tickets = await HelpCenter.find(query)
				.sort(sortOptions)
				.skip(skip)
				.limit(limit)
				.populate('userId', 'firstName lastName email userName')
				.populate('assignedTo', 'firstName lastName email userName');

			const total = await HelpCenter.countDocuments(query);

			return {
				tickets,
				pagination: {
					page,
					limit,
					total,
					pages: Math.ceil(total / limit)
				}
			};
		} catch (error) {
			if (error instanceof APIError) throw error;
			logger.error('Error fetching all tickets:', error);
			throw new APIError('Failed to fetch tickets', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async updateTicket(ticketId, userId, updateData, isAdmin = false) {
		try {
			const ticket = await HelpCenter.findById(ticketId);
			if (!ticket) {
				throw new APIError('Help center ticket not found', httpStatus.NOT_FOUND);
			}

			// Check authorization - users can only update their own tickets, admins can update any
			if (!isAdmin && ticket.userId.toString() !== userId.toString()) {
				throw new APIError('Unauthorized to update this ticket', httpStatus.FORBIDDEN);
			}

			// Users can only update certain fields
			if (!isAdmin) {
				const allowedFields = ['subject', 'message', 'category', 'priority'];
				Object.keys(updateData).forEach((key) => {
					if (!allowedFields.includes(key)) {
						delete updateData[key];
					}
				});
			}

			// Auto-update priority if category is changed and priority is not explicitly set
			if (updateData.category && !updateData.priority) {
				updateData.priority = this.getPriorityByCategory(updateData.category);
			}

			Object.assign(ticket, updateData);
			await ticket.save();

			// Populate and return updated ticket
			await ticket.populate('userId', 'firstName lastName email userName');
			await ticket.populate('assignedTo', 'firstName lastName email userName');

			logger.info(`Help center ticket updated: ${ticketId} by user: ${userId}`);
			return ticket;
		} catch (error) {
			if (error instanceof APIError) throw error;
			logger.error('Error updating help center ticket:', error);
			throw new APIError('Failed to update help center ticket', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async respondToTicket(ticketId, adminId, responseData) {
		try {
			const ticket = await HelpCenter.findById(ticketId);
			if (!ticket) {
				throw new APIError('Help center ticket not found', httpStatus.NOT_FOUND);
			}

			// Update ticket with response
			ticket.response = {
				message: responseData.response,
				respondedBy: adminId,
				respondedAt: new Date()
			};

			// Update status if provided
			if (responseData.status) {
				ticket.status = responseData.status;
			}

			// Assign to staff if provided
			if (responseData.assignedTo) {
				ticket.assignedTo = responseData.assignedTo;
			}

			// Escalate if requested
			if (responseData.escalated) {
				ticket.escalated = true;
				ticket.escalatedAt = new Date();
			}

			await ticket.save();

			// Populate and return updated ticket
			await ticket.populate('userId', 'firstName lastName email userName');
			await ticket.populate('assignedTo', 'firstName lastName email userName');
			await ticket.populate('response.respondedBy', 'firstName lastName email userName');

			// Send email notification to user about the response
			try {
				await emailService.sendHelpCenterResponseNotification(ticket.userId.email, ticket, { message: responseData.response });
			} catch (error) {
				logger.error('Failed to send help center response notification email:', error);
			}

			logger.info(`Response added to ticket: ${ticketId} by admin: ${adminId}`);
			return ticket;
		} catch (error) {
			if (error instanceof APIError) throw error;
			logger.error('Error responding to ticket:', error);
			throw new APIError('Failed to respond to ticket', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async deleteTicket(ticketId, userId, isAdmin = false) {
		try {
			const ticket = await HelpCenter.findById(ticketId);
			if (!ticket) {
				throw new APIError('Help center ticket not found', httpStatus.NOT_FOUND);
			}

			// Check authorization - users can only delete their own tickets, admins can delete any
			if (!isAdmin && ticket.userId.toString() !== userId.toString()) {
				throw new APIError('Unauthorized to delete this ticket', httpStatus.FORBIDDEN);
			}

			// Only allow deletion of open tickets
			if (ticket.status !== 'open') {
				throw new APIError('Only open tickets can be deleted', httpStatus.BAD_REQUEST);
			}

			await HelpCenter.findByIdAndDelete(ticketId);

			logger.info(`Help center ticket deleted: ${ticketId} by user: ${userId}`);
			return { message: 'Ticket deleted successfully' };
		} catch (error) {
			if (error instanceof APIError) throw error;
			logger.error('Error deleting help center ticket:', error);
			throw new APIError('Failed to delete help center ticket', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async getTicketStats(userId, isAdmin = false) {
		try {
			let query = {};

			// Users can only see stats for their own tickets
			if (!isAdmin) {
				query.userId = userId;
			}

			const stats = await HelpCenter.aggregate([
				{ $match: query },
				{
					$group: {
						_id: '$status',
						count: { $sum: 1 }
					}
				}
			]);

			// Get category distribution
			const categoryStats = await HelpCenter.aggregate([
				{ $match: query },
				{
					$group: {
						_id: '$category',
						count: { $sum: 1 }
					}
				}
			]);

			// Get priority distribution
			const priorityStats = await HelpCenter.aggregate([
				{ $match: query },
				{
					$group: {
						_id: '$priority',
						count: { $sum: 1 }
					}
				}
			]);

			// Get total count
			const totalCount = await HelpCenter.countDocuments(query);

			return {
				total: totalCount,
				byStatus: stats,
				byCategory: categoryStats,
				byPriority: priorityStats
			};
		} catch (error) {
			logger.error('Error fetching ticket stats:', error);
			throw new APIError('Failed to fetch ticket statistics', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async assignTicket(ticketId, adminId, assignedToUserId) {
		try {
			const ticket = await HelpCenter.findById(ticketId);
			if (!ticket) {
				throw new APIError('Help center ticket not found', httpStatus.NOT_FOUND);
			}

			// Verify the assigned user exists
			const assignedUser = await User.findById(assignedToUserId);
			if (!assignedUser) {
				throw new APIError('Assigned user not found', httpStatus.NOT_FOUND);
			}

			ticket.assignedTo = assignedToUserId;
			await ticket.save();

			// Populate and return updated ticket
			await ticket.populate('assignedTo', 'firstName lastName email userName');

			// Send email notification to assigned staff member
			try {
				await emailService.sendHelpCenterTicketAssignedNotification(assignedUser.email, ticket, assignedUser);
			} catch (error) {
				logger.error('Failed to send help center ticket assignment notification email:', error);
			}

			logger.info(`Ticket ${ticketId} assigned to user ${assignedToUserId} by admin ${adminId}`);
			return ticket;
		} catch (error) {
			if (error instanceof APIError) throw error;
			logger.error('Error assigning ticket:', error);
			throw new APIError('Failed to assign ticket', httpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}

export default new HelpCenterService();
