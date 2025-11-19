import nodemailer from 'nodemailer';
import logger from '../../config/logger.js';
import template from './template.js';
import config from '../../config/config.js';

// ============================================================================
// EMAIL SERVICE CONFIGURATION
// ============================================================================

/**
 * Create email transport with fallback values
 */
export const transport = nodemailer.createTransport({
	host: config.SMTP_HOST,
	port: config.SMTP_PORT,
	secure: config.SMTP_PORT === 465, // true for 465, false for other ports
	auth: {
		user: config.SMTP_USERNAME || '',
		pass: config.SMTP_PASSWORD || ''
	}
});

// Verify email connection
if (config.NODE_ENV !== 'test') {
	transport
		.verify()
		.then(() => logger.info('SMTP connection verified successfully'))
		.catch((error) => logger.warn('Unable to connect to email server:', error.message));
}

// ============================================================================
// EMAIL SENDING FUNCTIONS
// ============================================================================

/**
 * Send email with proper error handling
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 * @returns {Promise<void>}
 */
export const sendEmail = async (to, subject, html) => {
	try {
		// Validate inputs
		if (!to || !subject || !html) {
			throw new Error('Missing required email parameters');
		}

		const appName = config.APP_NAME || 'LexiFlow';
		const emailFrom = config.EMAIL_FROM || config.SMTP_USERNAME || 'noreply@lexiflow.com';

		const msg = {
			from: `${appName} <${emailFrom}>`,
			to,
			subject,
			html
		};

		await transport.sendMail(msg);
		logger.info(`Email sent successfully to: ${to}`);
	} catch (error) {
		logger.error('Failed to send email:', error.message);
		throw new Error(`Email sending failed: ${error.message}`);
	}
};

/**
 * Send password reset email
 * @param {string} to - Recipient email
 * @param {string} token - Reset token
 * @returns {Promise<void>}
 */
export const sendResetPasswordEmail = async (to, otp) => {
	try {
		const subject = 'Reset Your Password';
		const appName = config.APP_NAME || 'LexiFlow';

		const html = template.resetPassword(otp, appName);
		await sendEmail(to, subject, html);
	} catch (error) {
		logger.error('Failed to send reset password email:', error.message);
		throw error;
	}
};

/**
 * Send email verification email
 * @param {string} to - Recipient email
 * @param {string} token - Verification token
 * @returns {Promise<void>}
 */
export const sendVerificationEmail = async (to, otp) => {
	try {
		const subject = 'Verify Your Email Address';
		const appName = config.APP_NAME || 'LexiFlow';

		const html = template.verifyEmail(otp, appName);
		await sendEmail(to, subject, html);
	} catch (error) {
		logger.error('Failed to send verification email:', error.message);
		throw error;
	}
};

/**
 * Send welcome email
 * @param {string} to - Recipient email
 * @param {string} userName - User's name
 * @returns {Promise<void>}
 */
export const sendWelcomeEmail = async (to, userName) => {
	try {
		const subject = 'Welcome to LexiFlow!';
		const frontendUrl = config.FRONTEND_URL || 'http://localhost:3000';
		const appName = config.APP_NAME || 'LexiFlow';

		const html = template.welcomeEmail(userName, appName, frontendUrl);
		await sendEmail(to, subject, html);
	} catch (error) {
		logger.error('Failed to send welcome email:', error.message);
		throw error;
	}
};

/**
 * Send portal invitation email
 * @param {string} to - Recipient email
 * @param {string} inviteUrl - Invitation URL
 * @param {string} portalTitle - Portal title
 * @returns {Promise<void>}
 */
export const sendPortalInvitationEmail = async (to, inviteUrl, portalTitle) => {
	try {
		const subject = "You've been invited to join a client portal!";
		const appName = config.APP_NAME || 'LexiFlow';

		const html = template.portalInvitation(inviteUrl, appName, portalTitle);
		await sendEmail(to, subject, html);
	} catch (error) {
		logger.error('Failed to send portal invitation email:', error.message);
		throw error;
	}
};

/**
 * Send portal invitation email (alias for compatibility)
 * @param {string} to - Recipient email
 * @param {string} inviteUrl - Invitation URL
 * @param {string} portalTitle - Portal title
 * @returns {Promise<void>}
 */
export const sendPortalInvitation = sendPortalInvitationEmail;

/**
 * Send contract access notification email
 * @param {Object} sharedContract - Shared contract object
 * @param {string} accessedByEmail - Email of person who accessed
 * @returns {Promise<void>}
 */
export const sendContractAccessNotification = async (sharedContract, accessedByEmail) => {
	try {
		const subject = 'Contract Access Notification';
		const html = `
			<h2>Contract Access Notification</h2>
			<p>Your shared contract has been accessed by: ${accessedByEmail}</p>
			<p>Details:</p>
			<ul>
				<li>Access Time: ${new Date().toLocaleString()}</li>
				<li>Access Type: ${sharedContract.accessType}</li>
				<li>Total Accesses: ${sharedContract.accessCount}</li>
			</ul>
			<p>If this access was unauthorized, please contact support immediately.</p>
		`;

		await sendEmail(sharedContract.contractId.userId.email, subject, html);
	} catch (error) {
		logger.error('Failed to send contract access notification:', error.message);
		throw error;
	}
};

/**
 * Send contract share notification email
 * @param {Object} sharedContract - Shared contract object
 * @param {string} recipientEmail - Recipient email
 * @returns {Promise<void>}
 */
export const sendContractShareNotification = async (sharedContract, recipientEmail) => {
	try {
		const subject = 'Contract Share Notification';
		const frontendUrl = config.FRONTEND_URL || 'http://localhost:3000';
		const html = `
			<h2>Contract Share Notification</h2>
			<p>You have been granted access to a contract.</p>
			<p>Details:</p>
			<ul>
				<li>Access Type: ${sharedContract.accessType}</li>
				<li>Expires: ${new Date(sharedContract.expiresAt).toLocaleString()}</li>
			</ul>
			<p>Click the link below to access the contract:</p>
			<a href="${frontendUrl}/contracts/shared/${sharedContract.shareToken}">Access Contract</a>
		`;

		await sendEmail(recipientEmail, subject, html);
	} catch (error) {
		logger.error('Failed to send contract share notification:', error.message);
		throw error;
	}
};

/**
 * Send access request notification email
 * @param {string} creatorEmail - Creator's email
 * @param {Object} requestData - Request data object
 * @returns {Promise<void>}
 */
export const sendAccessRequestNotification = async (creatorEmail, requestData) => {
	try {
		const subject = 'New Contract Access Request';
		const frontendUrl = config.FRONTEND_URL || 'http://localhost:3000';
		const html = `
			<h2>New Contract Access Request</h2>
			<p>Someone has requested access to your contract: ${requestData.contractTitle}</p>
			<p>Details:</p>
			<ul>
				<li>Requested By: ${requestData.requestedBy}</li>
				<li>Reason: ${requestData.reason || 'No reason provided'}</li>
				<li>Requested At: ${new Date().toLocaleString()}</li>
			</ul>
			<p>Click the link below to review and respond to this request:</p>
			<a href="${frontendUrl}/contracts/shared/${requestData.shareToken}/requests">Review Request</a>
		`;

		await sendEmail(creatorEmail, subject, html);
	} catch (error) {
		logger.error('Failed to send access request notification:', error.message);
		throw error;
	}
};

/**
 * Send access request response notification email
 * @param {string} requesterEmail - Requester's email
 * @param {Object} responseData - Response data object
 * @returns {Promise<void>}
 */
export const sendAccessRequestResponseNotification = async (requesterEmail, responseData) => {
	try {
		const subject = `Contract Access Request ${responseData.status === 'approved' ? 'Approved' : 'Rejected'}`;
		const frontendUrl = config.FRONTEND_URL || 'http://localhost:3000';
		const html = `
			<h2>Contract Access Request ${responseData.status === 'approved' ? 'Approved' : 'Rejected'}</h2>
			<p>Your request for contract access has been ${responseData.status}.</p>
			${responseData.responseNote ? `<p>Response Note: ${responseData.responseNote}</p>` : ''}
			${
				responseData.status === 'approved'
					? `
				<p>You can now access the contract using the link below:</p>
				<a href="${frontendUrl}/contracts/shared/${responseData.shareToken}">Access Contract</a>
			`
					: ''
			}
		`;

		await sendEmail(requesterEmail, subject, html);
	} catch (error) {
		logger.error('Failed to send access request response notification:', error.message);
		throw error;
	}
};

/**
 * Send help center ticket notification email
 * @param {string} userEmail - User's email
 * @param {Object} ticketData - Ticket data object
 * @returns {Promise<void>}
 */
export const sendHelpCenterTicketNotification = async (userEmail, ticketData) => {
	try {
		const subject = 'Help Center Ticket Created';
		const html = `
			<h2>Help Center Ticket Created</h2>
			<p>Your help center ticket has been created successfully.</p>
			<p>Ticket Details:</p>
			<ul>
				<li>Ticket ID: ${ticketData._id}</li>
				<li>Subject: ${ticketData.subject}</li>
				<li>Category: ${ticketData.category}</li>
				<li>Priority: ${ticketData.priority}</li>
				<li>Status: ${ticketData.status}</li>
				<li>Created At: ${new Date(ticketData.createdAt).toLocaleString()}</li>
			</ul>
			<p>Our support team will review your ticket and respond as soon as possible.</p>
			<p>You can track your ticket status through your account dashboard.</p>
		`;

		await sendEmail(userEmail, subject, html);
	} catch (error) {
		logger.error('Failed to send help center ticket notification:', error.message);
		throw error;
	}
};

/**
 * Send help center response notification email
 * @param {string} userEmail - User's email
 * @param {Object} ticketData - Ticket data object
 * @param {Object} responseData - Response data object
 * @returns {Promise<void>}
 */
export const sendHelpCenterResponseNotification = async (userEmail, ticketData, responseData) => {
	try {
		const subject = 'Response to Your Help Center Ticket';
		const html = `
			<h2>Response to Your Help Center Ticket</h2>
			<p>You have received a response to your help center ticket.</p>
			<p>Ticket Details:</p>
			<ul>
				<li>Ticket ID: ${ticketData._id}</li>
				<li>Subject: ${ticketData.subject}</li>
				<li>Status: ${ticketData.status}</li>
			</ul>
			<p>Response:</p>
			<div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #007bff; margin: 15px 0;">
				${responseData.message}
			</div>
			<p>If you have any further questions, please reply to this ticket.</p>
		`;

		await sendEmail(userEmail, subject, html);
	} catch (error) {
		logger.error('Failed to send help center response notification:', error.message);
		throw error;
	}
};

/**
 * Send help center ticket assigned notification email
 * @param {string} adminEmail - Admin's email
 * @param {Object} ticketData - Ticket data object
 * @param {Object} assignedToUser - Assigned user object
 * @returns {Promise<void>}
 */
export const sendHelpCenterTicketAssignedNotification = async (adminEmail, ticketData) => {
	try {
		const subject = 'Help Center Ticket Assigned';
		const html = `
			<h2>Help Center Ticket Assigned</h2>
			<p>A help center ticket has been assigned to you.</p>
			<p>Ticket Details:</p>
			<ul>
				<li>Ticket ID: ${ticketData._id}</li>
				<li>Subject: ${ticketData.subject}</li>
				<li>Category: ${ticketData.category}</li>
				<li>Priority: ${ticketData.priority}</li>
				<li>Status: ${ticketData.status}</li>
				<li>Created By: ${ticketData.userId.firstName} ${ticketData.userId.lastName}</li>
				<li>Created At: ${new Date(ticketData.createdAt).toLocaleString()}</li>
			</ul>
			<p>Please review and respond to this ticket as soon as possible.</p>
		`;

		await sendEmail(adminEmail, subject, html);
	} catch (error) {
		logger.error('Failed to send help center ticket assigned notification:', error.message);
		throw error;
	}
};

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

export default {
	sendEmail,
	sendResetPasswordEmail,
	sendVerificationEmail,
	sendWelcomeEmail,
	sendPortalInvitationEmail,
	sendPortalInvitation,
	sendContractAccessNotification,
	sendContractShareNotification,
	sendAccessRequestNotification,
	sendAccessRequestResponseNotification,
	sendHelpCenterTicketNotification,
	sendHelpCenterResponseNotification,
	sendHelpCenterTicketAssignedNotification
};
