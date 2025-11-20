/* eslint-disable prettier/prettier */
import User from '~/models/userModel';
import logger from './logger';
import Plan from '~/models/Plan';
import Role from '~/models/roleModel';
import config from './config';
import crypto from 'crypto';

async function initialData() {
	try {
		// Seed roles
		const countRoles = await Role.estimatedDocumentCount();
		if (countRoles === 0) {
			await Role.create([
				{
					name: 'User',
					description: 'Regular user with standard access',
					isActive: true
				},
				{
					name: 'Admin',
					description: 'Administrator with elevated permissions',
					isActive: true
				},
				{
					name: 'SuperAdmin',
					description: 'Super administrator with full system access',
					isActive: true
				}
			]);
			logger.info('Roles seeded successfully');
		}

		// Seed subscription plans
		const countPlans = await Plan.estimatedDocumentCount();
		if (countPlans === 0) {
			await Plan.create([
				{
					name: 'Monthly Plan',
					description: 'Unlimited contracts per month',
					price: 499,
					currency: 'INR',
					interval: 'monthly',
					features: [
						'Unlimited contracts',
						'AI-powered contract generation',
						'Template library access',
						'Priority support'
					],
					contractLimit: null, // Unlimited
					isActive: true,
					sortOrder: 1
				},
				{
					name: 'Yearly Plan',
					description: 'Unlimited contracts per year - Best Value',
					price: 4999,
					currency: 'INR',
					interval: 'yearly',
					features: [
						'Unlimited contracts',
						'AI-powered contract generation',
						'Template library access',
						'Priority support',
						'2 months free (save ₹999)'
					],
					contractLimit: null, // Unlimited
					isActive: true,
					sortOrder: 2
				}
			]);
			logger.info('Subscription plans seeded successfully');
		}

		// Only create default users in development/test environments
		// In production, users should be created through proper signup/admin processes
		const shouldSeedUsers = config.NODE_ENV !== 'production' && process.env.SEED_DEFAULT_USERS !== 'false';
		
		if (shouldSeedUsers) {
			const countUsers = await User.estimatedDocumentCount();
			if (countUsers === 0) {
				const userRole = await Role.findOne({ name: 'User' });
				const adminRole = await Role.findOne({ name: 'Admin' });
				const superAdminRole = await Role.findOne({ name: 'SuperAdmin' });

				// Use environment variables for passwords, or generate random ones
				// WARNING: These are for development only. Change passwords immediately in production!
				const defaultUserPassword = process.env.DEFAULT_USER_PASSWORD || crypto.randomBytes(16).toString('hex');
				const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || crypto.randomBytes(16).toString('hex');
				const defaultSuperAdminPassword = process.env.DEFAULT_SUPERADMIN_PASSWORD || crypto.randomBytes(16).toString('hex');

				await User.create([
					{
						userName: process.env.DEFAULT_USER_USERNAME || 'johndoe',
						email: process.env.DEFAULT_USER_EMAIL || 'john.doe@example.com',
						password: defaultUserPassword,
						confirmed: true,
						contractCount: 0,
						subscriptionStatus: 'free',
						roles: [userRole._id]
					},
					{
						userName: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
						email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@lexiflow.com',
						password: defaultAdminPassword,
						confirmed: true,
						contractCount: 0,
						subscriptionStatus: 'free',
						roles: [adminRole._id]
					},
					{
						userName: process.env.DEFAULT_SUPERADMIN_USERNAME || 'superadmin',
						email: process.env.DEFAULT_SUPERADMIN_EMAIL || 'superadmin@lexiflow.com',
						password: defaultSuperAdminPassword,
						confirmed: true,
						contractCount: 0,
						subscriptionStatus: 'free',
						roles: [superAdminRole._id]
					}
				]);
				
				logger.warn('⚠️  SECURITY WARNING: Default users created for development/testing');
				logger.warn('⚠️  These accounts should NOT exist in production environments');
				logger.warn('⚠️  Passwords are set via environment variables or randomly generated');
				logger.info('Default users created successfully');
				
				// Log credentials only in development (never in production)
				if (config.NODE_ENV === 'development') {
					logger.info('Development user credentials:');
					logger.info(`  User: ${process.env.DEFAULT_USER_USERNAME || 'johndoe'} / ${process.env.DEFAULT_USER_EMAIL || 'john.doe@example.com'} / ${defaultUserPassword}`);
					logger.info(`  Admin: ${process.env.DEFAULT_ADMIN_USERNAME || 'admin'} / ${process.env.DEFAULT_ADMIN_EMAIL || 'admin@lexiflow.com'} / ${defaultAdminPassword}`);
					logger.info(`  SuperAdmin: ${process.env.DEFAULT_SUPERADMIN_USERNAME || 'superadmin'} / ${process.env.DEFAULT_SUPERADMIN_EMAIL || 'superadmin@lexiflow.com'} / ${defaultSuperAdminPassword}`);
				}
			}
		} else if (config.NODE_ENV === 'production') {
			logger.info('Skipping default user creation in production environment');
		}
	} catch (err) {
		logger.error(err);
	}
}

export default initialData;
