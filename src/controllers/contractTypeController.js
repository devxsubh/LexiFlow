import contractTypeService from '../services/contractTypeService.js';
import catchAsync from '../utils/catchAsync.js';
import httpStatus from 'http-status';
import _ from 'lodash';
import ContractType from '../models/ContractType.js';

// Create a new contract type
export const createContractType = catchAsync(async (req, res) => {
	const contractType = await contractTypeService.createContractType(req.body, req.user.id);
	res.status(httpStatus.CREATED).json({
		success: true,
		data: contractType
	});
});

// Update a contract type
export const updateContractType = catchAsync(async (req, res) => {
	const { contractTypeId } = req.params;
	const contractType = await contractTypeService.updateContractType(contractTypeId, req.body, req.user.id);
	res.json({
		success: true,
		data: contractType
	});
});

// Get a single contract type by ID
export const getContractType = catchAsync(async (req, res) => {
	const { contractTypeId } = req.params;
	const contractType = await contractTypeService.getContractTypeById(contractTypeId);

	// Increment usage count
	await contractTypeService.incrementUsageCount(contractTypeId);

	res.json({
		success: true,
		data: contractType
	});
});

// Delete a contract type
export const deleteContractType = catchAsync(async (req, res) => {
	const { contractTypeId } = req.params;
	const result = await contractTypeService.deleteContractType(contractTypeId);
	res.json({
		success: true,
		message: result.message
	});
});

// Search contract types
export const searchContractTypes = catchAsync(async (req, res) => {
	const { q, ...filters } = req.query;
	const options = _.pick(req.query, ['limit', 'page', 'sortBy', 'sortDirection']);

	const result = await contractTypeService.searchContractTypes(q, filters, options);

	// Handle paginated response
	if (result.results) {
		return res.json({
			success: true,
			data: result.results,
			pagination: {
				total: result.totalResults,
				page: result.page,
				limit: result.limit,
				pages: result.pages
			}
		});
	}

	res.json({
		success: true,
		data: result
	});
});

// Get contract types by category
export const getContractTypesByCategory = catchAsync(async (req, res) => {
	const { category } = req.params;
	const options = _.pick(req.query, ['limit', 'page', 'sortBy', 'sortDirection']);

	const result = await contractTypeService.getContractTypesByCategory(category, options);

	// Handle paginated response
	if (result.results) {
		return res.json({
			success: true,
			data: result.results,
			pagination: {
				total: result.totalResults,
				page: result.page,
				limit: result.limit,
				pages: result.pages
			}
		});
	}

	res.json({
		success: true,
		data: result
	});
});

// Get similar contract types
export const getSimilarContractTypes = catchAsync(async (req, res) => {
	const { contractTypeId } = req.params;
	const { limit = 5 } = req.query;

	const similarTypes = await contractTypeService.getSimilarContractTypes(contractTypeId, parseInt(limit));

	res.json({
		success: true,
		data: similarTypes
	});
});

// Get popular contract types
export const getPopularContractTypes = catchAsync(async (req, res) => {
	const { limit = 10, category } = req.query;

	const popularTypes = await contractTypeService.getPopularContractTypes(parseInt(limit), category);

	res.json({
		success: true,
		data: popularTypes
	});
});

// Get all categories
export const getAllCategories = catchAsync(async (req, res) => {
	const categories = await contractTypeService.getAllCategories();

	res.json({
		success: true,
		data: categories
	});
});

// Recommend contract types based on context
export const recommendContractTypes = catchAsync(async (req, res) => {
	const { context, industry, jurisdiction, parties, requirements, limit = 5 } = req.body;

	const filters = {
		industry,
		jurisdiction,
		parties,
		requirements
	};

	const recommendations = await contractTypeService.recommendContractTypes(context, filters, parseInt(limit));

	res.json({
		success: true,
		data: recommendations
	});
});

// Get contract type statistics
export const getContractTypeStats = catchAsync(async (req, res) => {
	const stats = await ContractType.aggregate([
		{ $match: { isActive: true } },
		{
			$group: {
				_id: '$category',
				count: { $sum: 1 },
				totalUsage: { $sum: '$usageCount' },
				avgPopularity: { $avg: '$popularity' }
			}
		},
		{ $sort: { count: -1 } }
	]);

	const totalTypes = await ContractType.countDocuments({ isActive: true });
	const totalUsage = await ContractType.aggregate([
		{ $match: { isActive: true } },
		{ $group: { _id: null, total: { $sum: '$usageCount' } } }
	]);

	res.json({
		success: true,
		data: {
			totalTypes,
			totalUsage: totalUsage[0]?.total || 0,
			categoryStats: stats
		}
	});
});

export default {
	createContractType,
	updateContractType,
	getContractType,
	deleteContractType,
	searchContractTypes,
	getContractTypesByCategory,
	getSimilarContractTypes,
	getPopularContractTypes,
	getAllCategories,
	recommendContractTypes,
	getContractTypeStats
};
