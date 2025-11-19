import catchAsync from '~/utils/catchAsync';
import templateService from '~/services/templateService';
import httpStatus from 'http-status';
import APIError from '~/utils/apiError';
import puppeteer from 'puppeteer';
import { uploadToCloudinary } from '~/services/cloudinaryService';
import { v2 as cloudinary } from 'cloudinary';
import _ from 'lodash';
import notificationService from '~/services/notificationService';

const createTemplate = catchAsync(async (req, res) => {
	try {
		const template = await templateService.createTemplate({
			...req.body,
			createdBy: req.user.id
		});

		// Create notification for template creation
		try {
			await notificationService.createNotification({
				userId: req.user.id,
				type: 'template_created',
				title: 'Template Created',
				message: `You created a new template "${template.name || 'Untitled Template'}"`,
				data: {
					templateId: template._id,
					templateName: template.name || 'Untitled Template',
					templateType: template.type,
					createdAt: new Date()
				},
				priority: 'low',
				actionUrl: `/templates/${template._id}`,
				actionText: 'View Template',
				metadata: {
					source: 'user',
					category: 'template',
					relatedEntity: template._id,
					relatedEntityType: 'Template',
					tags: ['creation']
				}
			});
		} catch (notificationError) {
			// Log the error but don't fail the template creation
			console.error('Failed to create template notification:', notificationError);
		}

		res.status(httpStatus.CREATED).json({ success: true, data: template });
	} catch (err) {
		console.error('Error in createTemplate:', err);
		throw err;
	}
});

const updateTemplate = catchAsync(async (req, res) => {
	const template = await templateService.updateTemplate(req.params.templateId, req.body);

	// Create notification for template update
	try {
		await notificationService.createNotification({
			userId: req.user.id,
			type: 'template_updated',
			title: 'Template Updated',
			message: `You updated "${template.name || 'Untitled Template'}"`,
			data: {
				templateId: template._id,
				templateName: template.name || 'Untitled Template',
				updatedFields: Object.keys(req.body).filter((key) => req.body[key] !== undefined),
				updatedAt: new Date()
			},
			priority: 'low',
			actionUrl: `/templates/${template._id}`,
			actionText: 'View Template',
			metadata: {
				source: 'user',
				category: 'template',
				relatedEntity: template._id,
				relatedEntityType: 'Template',
				tags: ['update']
			}
		});
	} catch (notificationError) {
		// Log the error but don't fail the template update
		console.error('Failed to create template update notification:', notificationError);
	}

	res.status(httpStatus.OK).json({ success: true, data: template });
});

const getTemplate = catchAsync(async (req, res) => {
	const template = await templateService.getTemplateById(req.params.templateId);
	res.status(httpStatus.OK).json({ success: true, data: template });
});

const listTemplates = catchAsync(async (req, res) => {
	// Extract pagination options
	const options = _.pick(req.query, ['limit', 'page', 'sortBy', 'sortDirection']);

	const templates = await templateService.searchTemplates(req.query.q, req.query, options);

	// Handle paginated response
	if (templates.results) {
		return res.status(httpStatus.OK).json({
			success: true,
			data: templates.results,
			pagination: {
				total: templates.totalResults
			}
		});
	}

	res.status(httpStatus.OK).json({ success: true, data: templates });
});

const convertTemplateToContract = catchAsync(async (req, res) => {
	const { templateId } = req.params;
	const { parties, startDate, endDate, ...rest } = req.body;
	if (!parties || !startDate || !endDate) {
		return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: 'parties, startDate, and endDate are required' });
	}
	const contract = await templateService.convertToContract(templateId, req.user.id, {
		parties,
		startDate,
		endDate,
		...rest
	});
	res.status(httpStatus.CREATED).json({ success: true, data: contract });
});

const generateTemplatePreview = catchAsync(async (req, res) => {
	const { templateId } = req.params;
	if (!templateId) {
		return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: 'Template ID is required' });
	}
	let browser;
	try {
		const template = await templateService.getTemplateById(templateId);
		if (!template || !template.content) {
			return res.status(httpStatus.NOT_FOUND).json({ success: false, message: 'Template or its content not found' });
		}
		const html = template.content;

		// Check if image already exists in Cloudinary
		try {
			await cloudinary.api.resource(templateId, { resource_type: 'image' });
			// If found, construct the URL and return
			const url = `https://res.cloudinary.com/${cloudinary.config().cloud_name}/image/upload/template_previews/${templateId}.png`;
			return res.status(httpStatus.OK).json({ success: true, data: url });
		} catch (e) {
			// Not found, proceed to upload
		}

		const isProduction = process.env.NODE_ENV === 'production';

		// Try multiple approaches for finding Chrome
		const launchOptions = {
			headless: 'new',
			args: [
				'--no-sandbox',
				'--disable-setuid-sandbox',
				'--disable-dev-shm-usage',
				'--disable-accelerated-2d-canvas',
				'--no-first-run',
				'--no-zygote',
				'--single-process',
				'--disable-gpu'
			]
		};

		if (isProduction) {
			// Try to find Chrome in common locations first
			const fs = await import('fs');
			const chromePaths = [
				'/usr/bin/google-chrome-stable',
				'/usr/bin/google-chrome',
				'/usr/bin/chromium-browser',
				'/usr/bin/chromium',
				'/opt/render/.cache/puppeteer/chrome/linux-137.0.7151.55/chrome-linux64/chrome'
			];

			let executablePath;
			for (const path of chromePaths) {
				if (fs.existsSync(path)) {
					executablePath = path;
					break;
				}
			}

			if (executablePath) {
				launchOptions.executablePath = executablePath;
			}
		}

		// Try launching with the configured options
		try {
			browser = await puppeteer.launch(launchOptions);
		} catch (firstError) {
			console.log('First launch attempt failed, trying without executablePath...');
			// If that fails, try without specifying executablePath (use bundled Chromium)
			delete launchOptions.executablePath;
			browser = await puppeteer.launch(launchOptions);
		}
		const page = await browser.newPage();
		await page.setViewport({ width: 794, height: 1123 });
		await page.setContent(html, { waitUntil: 'networkidle0' });
		const imageBuffer = await page.screenshot({ type: 'png', fullPage: true });
		const imageUrl = await uploadToCloudinary(imageBuffer, 'template_previews', {
			resource_type: 'image',
			format: 'png',
			public_id: `${templateId}`
		});
		res.status(httpStatus.OK).json({ success: true, data: imageUrl });
	} catch (err) {
		console.error('Error generating template preview:', err);
		res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Failed to generate preview' });
	} finally {
		if (browser) await browser.close();
	}
});

const getPopularTemplates = catchAsync(async (req, res) => {
	const { limit = 10, category, industry, jurisdiction } = req.query;

	// Build filters object
	const filters = {};
	if (category) filters.category = category;
	if (industry) filters.industry = industry;
	if (jurisdiction) filters.jurisdiction = jurisdiction;

	const templates = await templateService.getPopularTemplates(parseInt(limit), filters);

	res.status(httpStatus.OK).json({
		success: true,
		message: `Retrieved ${templates.length} popular templates with ratings and usage data`,
		data: templates
	});
});

// Rating-related controllers
const addRating = catchAsync(async (req, res) => {
	const { templateId } = req.params;
	const { rating } = req.body;

	// Ensure user is authenticated
	if (!req.user || !req.user.id) {
		throw new APIError(httpStatus.UNAUTHORIZED, 'Authentication required');
	}

	const template = await templateService.addRating(templateId, req.user.id, { rating });

	res.status(httpStatus.CREATED).json({
		success: true,
		message: 'Rating added successfully',
		data: template
	});
});

const updateRating = catchAsync(async (req, res) => {
	const { templateId } = req.params;
	const { rating } = req.body;

	// Ensure user is authenticated
	if (!req.user || !req.user.id) {
		throw new APIError(httpStatus.UNAUTHORIZED, 'Authentication required');
	}

	const template = await templateService.updateRating(templateId, req.user.id, { rating });

	res.status(httpStatus.OK).json({
		success: true,
		message: 'Rating updated successfully',
		data: template
	});
});

const deleteRating = catchAsync(async (req, res) => {
	const { templateId } = req.params;

	// Ensure user is authenticated
	if (!req.user || !req.user.id) {
		throw new APIError(httpStatus.UNAUTHORIZED, 'Authentication required');
	}

	const template = await templateService.deleteRating(templateId, req.user.id);

	res.status(httpStatus.OK).json({
		success: true,
		message: 'Rating deleted successfully',
		data: template
	});
});

const getTemplateRatings = catchAsync(async (req, res) => {
	const { templateId } = req.params;
	const { page, limit, sortBy, sortDirection } = req.query;

	const options = { page, limit, sortBy, sortDirection };
	const result = await templateService.getTemplateRatings(templateId, options);

	res.status(httpStatus.OK).json({
		success: true,
		message: 'Template ratings retrieved successfully',
		data: result
	});
});

const getUserRating = catchAsync(async (req, res) => {
	const { templateId } = req.params;

	// Ensure user is authenticated
	if (!req.user || !req.user.id) {
		throw new APIError(httpStatus.UNAUTHORIZED, 'Authentication required');
	}

	const rating = await templateService.getUserRating(templateId, req.user.id);

	res.status(httpStatus.OK).json({
		success: true,
		message: 'User rating retrieved successfully',
		data: rating
	});
});

const getMyRatings = catchAsync(async (req, res) => {
	const { page, limit, sortBy, sortDirection } = req.query;

	// Ensure user is authenticated
	if (!req.user || !req.user.id) {
		throw new APIError(httpStatus.UNAUTHORIZED, 'Authentication required');
	}

	const options = { page, limit, sortBy, sortDirection };
	const result = await templateService.getMyRatings(req.user.id, options);

	res.status(httpStatus.OK).json({
		success: true,
		message: 'Your ratings retrieved successfully',
		data: result
	});
});

const getSimilarTemplates = catchAsync(async (req, res) => {
	const { templateId } = req.params;
	const options = {
		limit: parseInt(req.query.limit) || 10,
		excludeCurrent: req.query.excludeCurrent !== 'false'
	};

	const similarTemplates = await templateService.getSimilarTemplates(templateId, options);
	res.status(httpStatus.OK).json({
		success: true,
		data: similarTemplates,
		message: 'Similar templates retrieved successfully'
	});
});

const getTemplateSuggestions = catchAsync(async (req, res) => {
	const { templateId } = req.params;
	const { limit, excludeCurrent, includeSimilar, includePopular } = req.query;

	const options = {
		limit: parseInt(limit) || 10,
		excludeCurrent: excludeCurrent !== 'false',
		includeSimilar: includeSimilar !== 'false',
		includePopular: includePopular !== 'false'
	};

	const suggestions = await templateService.getTemplateSuggestions(templateId, options);
	res.status(httpStatus.OK).json({
		success: true,
		data: suggestions,
		message: 'Template suggestions retrieved successfully'
	});
});

export default {
	createTemplate,
	updateTemplate,
	getTemplate,
	listTemplates,
	convertTemplateToContract,
	generateTemplatePreview,
	getPopularTemplates,
	addRating,
	updateRating,
	deleteRating,
	getTemplateRatings,
	getUserRating,
	getMyRatings,
	getSimilarTemplates,
	getTemplateSuggestions
};
