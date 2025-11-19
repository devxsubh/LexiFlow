import jurisdictionService from '../services/jurisdictionService.js';
import catchAsync from '../utils/catchAsync.js';
import httpStatus from 'http-status';
import _ from 'lodash';

// Create a new jurisdiction
export const createJurisdiction = catchAsync(async (req, res) => {
	const jurisdiction = await jurisdictionService.createJurisdiction(req.body, req.user.id);
	res.status(httpStatus.CREATED).json({
		success: true,
		data: jurisdiction
	});
});

// Update a jurisdiction
export const updateJurisdiction = catchAsync(async (req, res) => {
	const { jurisdictionId } = req.params;
	const jurisdiction = await jurisdictionService.updateJurisdiction(jurisdictionId, req.body, req.user.id);
	res.json({
		success: true,
		data: jurisdiction
	});
});

// Get a single jurisdiction by ID
export const getJurisdiction = catchAsync(async (req, res) => {
	const { jurisdictionId } = req.params;
	const jurisdiction = await jurisdictionService.getJurisdictionById(jurisdictionId);

	res.json({
		success: true,
		data: jurisdiction
	});
});

// Delete a jurisdiction
export const deleteJurisdiction = catchAsync(async (req, res) => {
	const { jurisdictionId } = req.params;
	const result = await jurisdictionService.deleteJurisdiction(jurisdictionId);
	res.json({
		success: true,
		message: result.message
	});
});

// Search jurisdictions
export const searchJurisdictions = catchAsync(async (req, res) => {
	const { q, ...filters } = req.query;
	const options = _.pick(req.query, ['limit', 'page', 'sortBy', 'sortDirection']);

	const result = await jurisdictionService.searchJurisdictions(q, filters, options);

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

// Get jurisdictions by type
export const getJurisdictionsByType = catchAsync(async (req, res) => {
	const { type } = req.params;
	const options = _.pick(req.query, ['limit', 'page', 'sortBy', 'sortDirection']);

	const result = await jurisdictionService.getJurisdictionsByType(type, options);

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

// Get jurisdictions by region
export const getJurisdictionsByRegion = catchAsync(async (req, res) => {
	const { region } = req.params;
	const options = _.pick(req.query, ['limit', 'page', 'sortBy', 'sortDirection']);

	const result = await jurisdictionService.getJurisdictionsByRegion(region, options);

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

// Get jurisdictions by high court
export const getJurisdictionsByHighCourt = catchAsync(async (req, res) => {
	const { highCourt } = req.params;
	const options = _.pick(req.query, ['limit', 'page', 'sortBy', 'sortDirection']);

	const result = await jurisdictionService.getJurisdictionsByHighCourt(highCourt, options);

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

// Get all types
export const getAllTypes = catchAsync(async (req, res) => {
	const types = await jurisdictionService.getAllTypes();

	res.json({
		success: true,
		data: types
	});
});

// Get all regions
export const getAllRegions = catchAsync(async (req, res) => {
	const regions = await jurisdictionService.getAllRegions();

	res.json({
		success: true,
		data: regions
	});
});

// Get all high courts
export const getAllHighCourts = catchAsync(async (req, res) => {
	const highCourts = await jurisdictionService.getAllHighCourts();

	res.json({
		success: true,
		data: highCourts
	});
});

// Get jurisdiction statistics
export const getJurisdictionStats = catchAsync(async (req, res) => {
	const { groupBy = 'type' } = req.query;
	const stats = await jurisdictionService.getJurisdictionStats(groupBy);

	res.json({
		success: true,
		data: stats
	});
});

// Search jurisdictions by keyword
export const searchJurisdictionsByKeyword = catchAsync(async (req, res) => {
	const { keyword, limit = 10 } = req.query;
	const jurisdictions = await jurisdictionService.getJurisdictionsByKeyword(keyword, parseInt(limit));

	res.json({
		success: true,
		data: jurisdictions
	});
});

export default {
	createJurisdiction,
	updateJurisdiction,
	getJurisdiction,
	deleteJurisdiction,
	searchJurisdictions,
	getJurisdictionsByType,
	getJurisdictionsByRegion,
	getJurisdictionsByHighCourt,
	getAllTypes,
	getAllRegions,
	getAllHighCourts,
	getJurisdictionStats,
	searchJurisdictionsByKeyword
};
