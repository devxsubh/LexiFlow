import { Router } from 'express';
import authRoute from './authRoute.js';
import userRoute from './userRoute.js';
import imageRoute from './imageRoute.js';
import lexiRoute from './lexiRoute.js';
import contractRoute from './contractRoute.js';
import clauseRoute from './clauseRoute.js';
import templateRoute from './templateRoute.js';
import contractTypeRoute from './contractTypeRoute.js';
import jurisdictionRoute from './jurisdictionRoute.js';
import dashboardRoute from './dashboardRoute.js';
import notificationRoute from './notificationRoute.js';
import helpCenterRoute from './helpCenterRoute.js';
import subscriptionRoute from './subscriptionRoute.js';
import roleRoute from './roleRoute.js';

const router = Router();

router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/images', imageRoute);
router.use('/lexi', lexiRoute);
router.use('/contracts', contractRoute);
router.use('/clauses', clauseRoute);
router.use('/templates', templateRoute);
router.use('/contract-types', contractTypeRoute);
router.use('/jurisdictions', jurisdictionRoute);
router.use('/dashboard', dashboardRoute);
router.use('/notifications', notificationRoute);
router.use('/help-center', helpCenterRoute);
router.use('/subscriptions', subscriptionRoute);
router.use('/roles', roleRoute);

export default router;
