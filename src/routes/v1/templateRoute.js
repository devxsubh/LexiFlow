import express from 'express';
import templateController from '~/controllers/templateController';
import authenticate from '~/middlewares/authenticate';
import validate from '~/middlewares/validate';
import templateValidation from '~/validations/templateValidation';

const router = express.Router();

// Create a new template
router.post('/', authenticate(), validate(templateValidation.createTemplate), templateController.createTemplate);

// Update a template
router.put('/:templateId', authenticate(), validate(templateValidation.updateTemplate), templateController.updateTemplate);

// Get popular templates (must come before /:templateId route)
router.get('/popular', templateController.getPopularTemplates);

// Get a single template
router.get('/:templateId', authenticate(), validate(templateValidation.getTemplateById), templateController.getTemplate);

// List/search templates
router.get('/', authenticate(), templateController.listTemplates);

// Convert a template to a contract
router.post(
	'/:templateId/convert',
	authenticate(),
	validate(templateValidation.convertToContract),
	templateController.convertTemplateToContract
);

// Generate a preview image from templateId
router.post('/:templateId/preview', templateController.generateTemplatePreview);

// Rating routes
// Add rating to a template
router.post('/:templateId/ratings', authenticate(), validate(templateValidation.addRating), templateController.addRating);

// Update user's rating for a template
router.put('/:templateId/ratings', authenticate(), validate(templateValidation.updateRating), templateController.updateRating);

// Delete user's rating for a template
router.delete('/:templateId/ratings', authenticate(), validate(templateValidation.deleteRating), templateController.deleteRating);

// Get all ratings for a template
router.get(
	'/:templateId/ratings',
	authenticate(),
	validate(templateValidation.getTemplateRatings),
	templateController.getTemplateRatings
);

// Get current user's rating for a specific template
router.get(
	'/:templateId/my-rating',
	authenticate(),
	validate(templateValidation.getUserRating),
	templateController.getUserRating
);

// Get all ratings by current user
router.get('/my-ratings', authenticate(), validate(templateValidation.getMyRatings), templateController.getMyRatings);

// Template suggestion routes
// Get similar templates based on a specific template
router.get(
	'/:templateId/similar',
	authenticate(),
	validate(templateValidation.getSimilarTemplates),
	templateController.getSimilarTemplates
);

// Get template suggestions based on a specific template
router.get(
	'/:templateId/suggestions',
	authenticate(),
	validate(templateValidation.getTemplateSuggestions),
	templateController.getTemplateSuggestions
);

export default router;
