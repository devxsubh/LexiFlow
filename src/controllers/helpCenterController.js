import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import helpCenterService from '../services/helpCenterService';
import { hasRole } from '../middlewares/authenticate';

const createTicket = catchAsync(async (req, res) => {
	const ticket = await helpCenterService.createTicket(req.user.id, req.body);
	res.status(httpStatus.CREATED).send({
		status: 'success',
		message: 'Help center ticket created successfully',
		data: ticket
	});
});

const getTicketById = catchAsync(async (req, res) => {
	const isAdmin = hasRole(req.user, ['Admin', 'SuperAdmin']);
	const ticket = await helpCenterService.getTicketById(req.params.ticketId, req.user.id, isAdmin);
	res.status(httpStatus.OK).send({
		status: 'success',
		data: ticket
	});
});

const getMyTickets = catchAsync(async (req, res) => {
	const filters = {
		status: req.query.status,
		category: req.query.category,
		priority: req.query.priority
	};

	const options = {
		page: req.query.page,
		limit: req.query.limit,
		sortBy: req.query.sortBy,
		sortOrder: req.query.sortOrder
	};

	const result = await helpCenterService.getMyTickets(req.user.id, filters, options);
	res.status(httpStatus.OK).send({
		status: 'success',
		data: result.tickets,
		pagination: result.pagination
	});
});

const getAllTickets = catchAsync(async (req, res) => {
	const isAdmin = hasRole(req.user, ['Admin', 'SuperAdmin']);

	const filters = {
		status: req.query.status,
		category: req.query.category,
		priority: req.query.priority,
		assignedTo: req.query.assignedTo,
		userId: req.query.userId,
		escalated: req.query.escalated
	};

	const options = {
		page: req.query.page,
		limit: req.query.limit,
		sortBy: req.query.sortBy,
		sortOrder: req.query.sortOrder
	};

	const result = await helpCenterService.getAllTickets(filters, options, isAdmin);
	res.status(httpStatus.OK).send({
		status: 'success',
		data: result.tickets,
		pagination: result.pagination
	});
});

const updateTicket = catchAsync(async (req, res) => {
	const isAdmin = hasRole(req.user, ['Admin', 'SuperAdmin']);
	const ticket = await helpCenterService.updateTicket(req.params.ticketId, req.user.id, req.body, isAdmin);
	res.status(httpStatus.OK).send({
		status: 'success',
		message: 'Ticket updated successfully',
		data: ticket
	});
});

const respondToTicket = catchAsync(async (req, res) => {
	const isAdmin = hasRole(req.user, ['Admin', 'SuperAdmin']);
	if (!isAdmin) {
		return res.status(httpStatus.FORBIDDEN).send({
			status: 'error',
			message: 'Admin access required to respond to tickets'
		});
	}

	const ticket = await helpCenterService.respondToTicket(req.params.ticketId, req.user.id, req.body);
	res.status(httpStatus.OK).send({
		status: 'success',
		message: 'Response added successfully',
		data: ticket
	});
});

const deleteTicket = catchAsync(async (req, res) => {
	const isAdmin = hasRole(req.user, ['Admin', 'SuperAdmin']);
	const result = await helpCenterService.deleteTicket(req.params.ticketId, req.user.id, isAdmin);
	res.status(httpStatus.OK).send({
		status: 'success',
		message: result.message
	});
});

const getTicketStats = catchAsync(async (req, res) => {
	const isAdmin = hasRole(req.user, ['Admin', 'SuperAdmin']);
	const stats = await helpCenterService.getTicketStats(req.user.id, isAdmin);
	res.status(httpStatus.OK).send({
		status: 'success',
		data: stats
	});
});

const assignTicket = catchAsync(async (req, res) => {
	const isAdmin = hasRole(req.user, ['Admin', 'SuperAdmin']);
	if (!isAdmin) {
		return res.status(httpStatus.FORBIDDEN).send({
			status: 'error',
			message: 'Admin access required to assign tickets'
		});
	}

	const ticket = await helpCenterService.assignTicket(req.params.ticketId, req.user.id, req.body.assignedTo);
	res.status(httpStatus.OK).send({
		status: 'success',
		message: 'Ticket assigned successfully',
		data: ticket
	});
});

export default {
	createTicket,
	getTicketById,
	getMyTickets,
	getAllTickets,
	updateTicket,
	respondToTicket,
	deleteTicket,
	getTicketStats,
	assignTicket
};
