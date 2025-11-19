import express from 'express';
import validate from '../../middlewares/validate.js';
import dashboardValidation from '../../validations/dashboardValidation.js';
import dashboardController from '../../controllers/dashboardController.js';
import authenticate from '../../middlewares/authenticate.js';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticate(), validate(dashboardValidation.getDashboardStats), dashboardController.getDashboardStats);

// Get activity overview (for dashboard cards)
router.get('/activity', authenticate(), validate(dashboardValidation.getDashboardStats), dashboardController.getActivityOverview);

// Get dashboard summary
router.get('/summary', authenticate(), dashboardController.getDashboardSummary);

// Get trend data for charts
router.get('/trends', authenticate(), validate(dashboardValidation.getDashboardStats), dashboardController.getTrendData);

// Get dashboard statistics history
router.get('/history', authenticate(), validate(dashboardValidation.getStatsHistory), dashboardController.getStatsHistory);

// Get detailed information for a specific metric
router.get(
	'/metric/:metric',
	authenticate(),
	validate(dashboardValidation.getMetricDetails),
	dashboardController.getMetricDetails
);

// Refresh dashboard statistics
router.post('/refresh', authenticate(), dashboardController.refreshDashboardStats);

export default router;
