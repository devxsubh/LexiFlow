import express from 'express';
import validate from '../../middlewares/validate.js';
import jurisdictionValidation from '../../validations/jurisdictionValidation.js';
import jurisdictionController from '../../controllers/jurisdictionController.js';
import authenticate from '../../middlewares/authenticate.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/', validate(jurisdictionValidation.searchJurisdictions), jurisdictionController.searchJurisdictions);
router.get('/types', jurisdictionController.getAllTypes);
router.get('/regions', jurisdictionController.getAllRegions);
router.get('/high-courts', jurisdictionController.getAllHighCourts);
router.get('/stats', validate(jurisdictionValidation.getJurisdictionStats), jurisdictionController.getJurisdictionStats);
router.get(
	'/search',
	validate(jurisdictionValidation.searchJurisdictionsByKeyword),
	jurisdictionController.searchJurisdictionsByKeyword
);

// Get jurisdictions by type
router.get('/type/:type', validate(jurisdictionValidation.getJurisdictionsByType), jurisdictionController.getJurisdictionsByType);

// Get jurisdictions by region
router.get(
	'/region/:region',
	validate(jurisdictionValidation.getJurisdictionsByRegion),
	jurisdictionController.getJurisdictionsByRegion
);

// Get jurisdictions by high court
router.get(
	'/high-court/:highCourt',
	validate(jurisdictionValidation.getJurisdictionsByHighCourt),
	jurisdictionController.getJurisdictionsByHighCourt
);

// Get specific jurisdiction
router.get('/:jurisdictionId', validate(jurisdictionValidation.getJurisdiction), jurisdictionController.getJurisdiction);

// Protected routes (authentication required)
router.use(authenticate);

// Create jurisdiction
router.post('/', validate(jurisdictionValidation.createJurisdiction), jurisdictionController.createJurisdiction);

// Update jurisdiction
router.put('/:jurisdictionId', validate(jurisdictionValidation.updateJurisdiction), jurisdictionController.updateJurisdiction);

// Delete jurisdiction
router.delete('/:jurisdictionId', validate(jurisdictionValidation.deleteJurisdiction), jurisdictionController.deleteJurisdiction);

export default router;
