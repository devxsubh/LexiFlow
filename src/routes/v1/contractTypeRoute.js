import { Router } from 'express';
import authenticate from '../../middlewares/authenticate';
import validate from '../../middlewares/validate';
import contractTypeValidation from '../../validations/contractTypeValidation';
import contractTypeController from '../../controllers/contractTypeController';

const router = Router();

// Create a new contract type (Admin only)
router.post('/', authenticate(), validate(contractTypeValidation.createContractType), contractTypeController.createContractType);

// Get all contract types (search with filters)
router.get('/', validate(contractTypeValidation.searchContractTypes), contractTypeController.searchContractTypes);

// Get popular contract types
router.get('/popular', validate(contractTypeValidation.getPopularContractTypes), contractTypeController.getPopularContractTypes);

// Get all categories
router.get('/categories', contractTypeController.getAllCategories);

// Get contract type statistics
router.get('/stats', contractTypeController.getContractTypeStats);

// Get contract types by category
router.get(
	'/category/:category',
	validate(contractTypeValidation.getContractTypesByCategory),
	contractTypeController.getContractTypesByCategory
);

// Get a single contract type by ID
router.get('/:contractTypeId', validate(contractTypeValidation.getContractType), contractTypeController.getContractType);

// Get similar contract types
router.get(
	'/:contractTypeId/similar',
	validate(contractTypeValidation.getSimilarContractTypes),
	contractTypeController.getSimilarContractTypes
);

// Update a contract type (Admin only)
router.put(
	'/:contractTypeId',
	authenticate(),
	validate(contractTypeValidation.updateContractType),
	contractTypeController.updateContractType
);

// Delete a contract type (Admin only)
router.delete(
	'/:contractTypeId',
	authenticate(),
	validate(contractTypeValidation.deleteContractType),
	contractTypeController.deleteContractType
);

// Recommend contract types based on context
router.post('/recommend', validate(contractTypeValidation.recommendContractTypes), contractTypeController.recommendContractTypes);

export default router;
