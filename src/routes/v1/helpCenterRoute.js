import express from 'express';
import auth from '../../middlewares/authenticate';
import validate from '../../middlewares/validate';
import helpCenterValidation from '../../validations/helpCenterValidation';
import helpCenterController from '../../controllers/helpCenterController';
import faqService from '../../services/faqService';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth());

// User routes (authenticated users)
router.post('/', validate(helpCenterValidation.createHelpCenterTicket), helpCenterController.createTicket);

router.get('/my', validate(helpCenterValidation.getMyTickets), helpCenterController.getMyTickets);

router.get('/my/stats', helpCenterController.getTicketStats);

router.get('/:ticketId', validate(helpCenterValidation.getHelpCenterTicket), helpCenterController.getTicketById);

router.put('/:ticketId', validate(helpCenterValidation.updateHelpCenterTicket), helpCenterController.updateTicket);

router.delete('/:ticketId', validate(helpCenterValidation.deleteHelpCenterTicket), helpCenterController.deleteTicket);

// Admin routes (admin and support staff only)
router.get('/admin/all', validate(helpCenterValidation.getAllTickets), helpCenterController.getAllTickets);

router.post('/:ticketId/respond', validate(helpCenterValidation.respondToTicket), helpCenterController.respondToTicket);

router.post('/:ticketId/assign', helpCenterController.assignTicket);

// FAQ routes (public access)
router.get('/faqs', async (req, res) => {
	try {
		const filters = {
			category: req.query.category,
			tags: req.query.tags ? req.query.tags.split(',') : undefined,
			search: req.query.search
		};

		const options = {
			page: req.query.page,
			limit: req.query.limit
		};

		const result = await faqService.getFAQs(filters, options);
		res.status(200).json({
			status: 'success',
			data: result.faqs,
			pagination: result.pagination
		});
	} catch (error) {
		res.status(500).json({
			status: 'error',
			message: error.message || 'Failed to fetch FAQs'
		});
	}
});

router.get('/faqs/:faqId', async (req, res) => {
	try {
		const faq = await faqService.getFAQById(req.params.faqId);
		res.status(200).json({
			status: 'success',
			data: faq
		});
	} catch (error) {
		res.status(404).json({
			status: 'error',
			message: error.message || 'FAQ not found'
		});
	}
});

router.post('/faqs/:faqId/helpful', async (req, res) => {
	try {
		const { isHelpful } = req.body;
		const faq = await faqService.markFAQHelpful(req.params.faqId, isHelpful);
		res.status(200).json({
			status: 'success',
			message: 'Feedback recorded successfully',
			data: faq
		});
	} catch (error) {
		res.status(500).json({
			status: 'error',
			message: error.message || 'Failed to record feedback'
		});
	}
});

export default router;
