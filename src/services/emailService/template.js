// ============================================================================
// EMAIL TEMPLATE UTILITIES
// ============================================================================

/**
 * Safely get a value with fallback
 * @param {any} value - The value to check
 * @param {any} fallback - Fallback value if undefined/null
 * @returns {any} - Safe value
 */
const safeValue = (value, fallback = '') => {
	return value !== undefined && value !== null ? value : fallback;
};

/**
 * Get current date in a readable format
 * @returns {string} - Formatted date
 */
const getCurrentDate = () => {
	return new Date().toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
};

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

/**
 * Email verification template
 * @param {string} otp - 6-digit OTP code
 * @param {string} appName - Application name
 * @returns {string} - HTML email template
 */
export const verifyEmail = (otp, appName) => {
	const safeOtp = safeValue(otp, '000000');
	const safeAppName = safeValue(appName, 'LexiFlow');

	return `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Verify your email address - ${safeAppName}</title>
    <style type="text/css" rel="stylesheet" media="all">
        *:not(br):not(tr):not(html) {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            -webkit-box-sizing: border-box;
            box-sizing: border-box;
        }

        body {
            width: 100% !important;
            height: 100%;
            margin: 0;
            line-height: 1.4;
            background-color: #f8fafc;
            color: #475569;
            -webkit-text-size-adjust: none;
        }

        a {
            color: #3b82f6;
            text-decoration: none;
        }

        .email-wrapper {
            width: 100%;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
        }

        .email-content {
            width: 100%;
            margin: 0;
            padding: 0;
        }

        .email-masthead {
            padding: 30px 0;
            text-align: center;
            background-color: #ffffff;
            border-bottom: 1px solid #e2e8f0;
        }

        .email-masthead_name {
            font-size: 24px;
            font-weight: 700;
            color: #1e293b;
            text-decoration: none;
            letter-spacing: -0.025em;
        }

        .email-body {
            width: 100%;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
        }

        .email-body_inner {
            width: 570px;
            margin: 0 auto;
            padding: 0;
        }

        .email-footer {
            width: 570px;
            margin: 0 auto;
            padding: 0;
            text-align: center;
            background-color: #f8fafc;
        }

        .email-footer p {
            color: #64748b;
        }

        .body-action {
            width: 100%;
            margin: 30px auto;
            padding: 0;
            text-align: center;
        }

        .body-sub {
            margin-top: 25px;
            padding-top: 25px;
            border-top: 1px solid #e2e8f0;
        }

        .content-cell {
            padding: 40px;
        }

        h1 {
            margin-top: 0;
            color: #1e293b;
            font-size: 24px;
            font-weight: 700;
            text-align: left;
            line-height: 1.3;
        }

        h2 {
            margin-top: 0;
            color: #1e293b;
            font-size: 20px;
            font-weight: 600;
            text-align: left;
            line-height: 1.3;
        }

        p {
            margin-top: 0;
            color: #475569;
            font-size: 16px;
            line-height: 1.6;
            text-align: left;
        }

        p.sub {
            font-size: 14px;
            color: #64748b;
        }

        p.center {
            text-align: center;
        }

        ul {
            margin: 20px 0;
            padding-left: 20px;
        }

        li {
            color: #475569;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 8px;
        }

        .button {
            display: inline-block;
            width: 200px;
            background-color: #3b82f6;
            border-radius: 8px;
            color: #ffffff !important;
            font-size: 16px;
            font-weight: 600;
            line-height: 50px;
            text-align: center;
            text-decoration: none;
            -webkit-text-size-adjust: none;
            mso-hide: all;
            transition: background-color 0.2s ease;
        }

        .button:hover {
            background-color: #2563eb !important;
        }

        .button--green {
            background-color: #10b981;
        }

        .button--green:hover {
            background-color: #059669 !important;
        }

        .button--blue {
            background-color: #3b82f6;
        }

        .button--blue:hover {
            background-color: #2563eb !important;
        }

        @media only screen and (max-width: 600px) {
            .email-body_inner,
            .email-footer {
                width: 100% !important;
            }
            
            .content-cell {
                padding: 20px !important;
            }
        }

        @media only screen and (max-width: 500px) {
            .button {
                width: 100% !important;
            }
        }
    </style>
</head>

<body>
    <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center">
                <table class="email-content" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td class="email-masthead">
                            <a class="email-masthead_name">${safeAppName}</a>
                        </td>
                    </tr>
                    <tr>
                        <td class="email-body" width="100%">
                            <table class="email-body_inner" align="center" width="570" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td class="content-cell">
                                        <h1>Verify your email address</h1>
                                        <p>Thanks for signing up for ${safeAppName}! We're excited to have you as an early user.</p>
                                        
                                        <p>To complete your registration and start using our platform, please verify your email address using the 6-digit code below:</p>
                                        
                                        <table class="body-action" align="center" width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center">
                                                    <div style="background-color: #f1f5f9; border-radius: 12px; padding: 30px; display: inline-block; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1e293b; font-family: 'Courier New', monospace;">
                                                        ${safeOtp}
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="text-align: center; margin-top: 20px;">Enter this code in the verification page to complete your email verification.</p>
                                        
                                        <p>This verification code will expire in 60 minutes for security reasons.</p>
                                        
                                        <p>If you didn't request this code, please ignore this email.</p>
                                        
                                        <p>Thanks,<br>The ${safeAppName} Team</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <table class="email-footer" align="center" width="570" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td class="content-cell">
                                        <p class="sub center">
                                            © ${new Date().getFullYear()} ${safeAppName}. All rights reserved.
                                        </p>
                                        <p class="sub center">
                                            If you didn't create an account with ${safeAppName}, you can safely ignore this email.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
};

/**
 * Password reset template
 * @param {string} otp - 6-digit OTP code
 * @param {string} appName - Application name
 * @returns {string} - HTML email template
 */
export const resetPassword = (otp, appName) => {
	const safeOtp = safeValue(otp, '000000');
	const safeAppName = safeValue(appName, 'LexiFlow');

	return `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Reset Your Password - ${safeAppName}</title>
    <style type="text/css" rel="stylesheet" media="all">
        *:not(br):not(tr):not(html) {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            -webkit-box-sizing: border-box;
            box-sizing: border-box;
        }

        body {
            width: 100% !important;
            height: 100%;
            margin: 0;
            line-height: 1.4;
            background-color: #f8fafc;
            color: #475569;
            -webkit-text-size-adjust: none;
        }

        a {
            color: #3b82f6;
            text-decoration: none;
        }

        .email-wrapper {
            width: 100%;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
        }

        .email-content {
            width: 100%;
            margin: 0;
            padding: 0;
        }

        .email-masthead {
            padding: 30px 0;
            text-align: center;
            background-color: #ffffff;
            border-bottom: 1px solid #e2e8f0;
        }

        .email-masthead_name {
            font-size: 24px;
            font-weight: 700;
            color: #1e293b;
            text-decoration: none;
            letter-spacing: -0.025em;
        }

        .email-body {
            width: 100%;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
        }

        .email-body_inner {
            width: 570px;
            margin: 0 auto;
            padding: 0;
        }

        .email-footer {
            width: 570px;
            margin: 0 auto;
            padding: 0;
            text-align: center;
            background-color: #f8fafc;
        }

        .email-footer p {
            color: #64748b;
        }

        .body-action {
            width: 100%;
            margin: 30px auto;
            padding: 0;
            text-align: center;
        }

        .body-sub {
            margin-top: 25px;
            padding-top: 25px;
            border-top: 1px solid #e2e8f0;
        }

        .content-cell {
            padding: 40px;
        }

        h1 {
            margin-top: 0;
            color: #1e293b;
            font-size: 24px;
            font-weight: 700;
            text-align: left;
            line-height: 1.3;
        }

        h2 {
            margin-top: 0;
            color: #1e293b;
            font-size: 20px;
            font-weight: 600;
            text-align: left;
            line-height: 1.3;
        }

        p {
            margin-top: 0;
            color: #475569;
            font-size: 16px;
            line-height: 1.6;
            text-align: left;
        }

        p.sub {
            font-size: 14px;
            color: #64748b;
        }

        p.center {
            text-align: center;
        }

        ul {
            margin: 20px 0;
            padding-left: 20px;
        }

        li {
            color: #475569;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 8px;
        }

        .button {
            display: inline-block;
            width: 200px;
            background-color: #3b82f6;
            border-radius: 8px;
            color: #ffffff !important;
            font-size: 16px;
            font-weight: 600;
            line-height: 50px;
            text-align: center;
            text-decoration: none;
            -webkit-text-size-adjust: none;
            mso-hide: all;
            transition: background-color 0.2s ease;
        }

        .button:hover {
            background-color: #2563eb !important;
        }

        .button--green {
            background-color: #10b981;
        }

        .button--green:hover {
            background-color: #059669 !important;
        }

        .button--blue {
            background-color: #3b82f6;
        }

        .button--blue:hover {
            background-color: #2563eb !important;
        }

        @media only screen and (max-width: 600px) {
            .email-body_inner,
            .email-footer {
                width: 100% !important;
            }
            
            .content-cell {
                padding: 20px !important;
            }
        }

        @media only screen and (max-width: 500px) {
            .button {
                width: 100% !important;
            }
        }
    </style>
</head>

<body>
    <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center">
                <table class="email-content" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td class="email-masthead">
                            <a class="email-masthead_name">${safeAppName}</a>
                        </td>
                    </tr>
                    <tr>
                        <td class="email-body" width="100%">
                            <table class="email-body_inner" align="center" width="570" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td class="content-cell">
                                        <h1>Reset Your Password</h1>
                                        <p>We received a request to reset your password for your ${safeAppName} account.</p>
                                        
                                        <p>Use the following verification code to reset your password:</p>
                                        
                                        <table class="body-action" align="center" width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center">
                                                    <div style="background-color: #f1f5f9; border-radius: 12px; padding: 30px; margin: 30px 0; border: 2px solid #e2e8f0;">
                                                        <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1e293b; font-family: 'Courier New', monospace; text-align: center;">
                                                            ${safeOtp}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p><strong>Important:</strong></p>
                                        <ul>
                                            <li>This code will expire in 30 minutes for security reasons</li>
                                            <li>Never share this code with anyone</li>
                                            <li>If you didn't request a password reset, you can safely ignore this email</li>
                                        </ul>
                                        
                                        <p>Enter this code in the password reset form to complete the process.</p>
                                        
                                        <p>Thanks,<br>The ${safeAppName} Team</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <table class="email-footer" align="center" width="570" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td class="content-cell">
                                        <p class="sub center">
                                            © ${new Date().getFullYear()} ${safeAppName}. All rights reserved.
                                        </p>
                                        <p class="sub center">
                                            If you didn't request a password reset, please contact our support team immediately.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
};

/**
 * Portal invitation template
 * @param {string} inviteUrl - Invitation URL
 * @param {string} appName - Application name
 * @param {string} portalTitle - Portal title
 * @returns {string} - HTML email template
 */
export const portalInvitation = (inviteUrl, appName, portalTitle) => {
	const safeInviteUrl = safeValue(inviteUrl, '#');
	const safeAppName = safeValue(appName, 'LexiFlow');
	const safePortalTitle = safeValue(portalTitle, 'Client Portal');

	return `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Portal Invitation - ${safeAppName}</title>
    <style type="text/css" rel="stylesheet" media="all">
        *:not(br):not(tr):not(html) {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            -webkit-box-sizing: border-box;
            box-sizing: border-box;
        }

        body {
            width: 100% !important;
            height: 100%;
            margin: 0;
            line-height: 1.4;
            background-color: #f8fafc;
            color: #475569;
            -webkit-text-size-adjust: none;
        }

        a {
            color: #3b82f6;
            text-decoration: none;
        }

        .email-wrapper {
            width: 100%;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
        }

        .email-content {
            width: 100%;
            margin: 0;
            padding: 0;
        }

        .email-masthead {
            padding: 30px 0;
            text-align: center;
            background-color: #ffffff;
            border-bottom: 1px solid #e2e8f0;
        }

        .email-masthead_name {
            font-size: 24px;
            font-weight: 700;
            color: #1e293b;
            text-decoration: none;
            letter-spacing: -0.025em;
        }

        .email-body {
            width: 100%;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
        }

        .email-body_inner {
            width: 570px;
            margin: 0 auto;
            padding: 0;
        }

        .email-footer {
            width: 570px;
            margin: 0 auto;
            padding: 0;
            text-align: center;
            background-color: #f8fafc;
        }

        .email-footer p {
            color: #64748b;
        }

        .body-action {
            width: 100%;
            margin: 30px auto;
            padding: 0;
            text-align: center;
        }

        .content-cell {
            padding: 40px;
        }

        .portal-details {
            background-color: #f1f5f9;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }

        .portal-details p {
            margin: 8px 0;
        }

        h1 {
            margin-top: 0;
            color: #1e293b;
            font-size: 24px;
            font-weight: 700;
            text-align: left;
            line-height: 1.3;
        }

        h2 {
            margin-top: 0;
            color: #1e293b;
            font-size: 20px;
            font-weight: 600;
            text-align: left;
            line-height: 1.3;
        }

        p {
            margin-top: 0;
            color: #475569;
            font-size: 16px;
            line-height: 1.6;
            text-align: left;
        }

        ul {
            margin: 20px 0;
            padding-left: 20px;
        }

        li {
            color: #475569;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 8px;
        }

        .button {
            display: inline-block;
            width: 200px;
            background-color: #10b981;
            border-radius: 8px;
            color: #ffffff !important;
            font-size: 16px;
            font-weight: 600;
            line-height: 50px;
            text-align: center;
            text-decoration: none;
            -webkit-text-size-adjust: none;
            mso-hide: all;
            transition: background-color 0.2s ease;
        }

        .button:hover {
            background-color: #059669 !important;
        }

        .button--green {
            background-color: #10b981;
        }

        .button--green:hover {
            background-color: #059669 !important;
        }

        @media only screen and (max-width: 600px) {
            .email-body_inner,
            .email-footer {
                width: 100% !important;
            }
            
            .content-cell {
                padding: 20px !important;
            }
        }

        @media only screen and (max-width: 500px) {
            .button {
                width: 100% !important;
            }
        }
    </style>
</head>

<body>
    <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center">
                <table class="email-content" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td class="email-masthead">
                            <a class="email-masthead_name">${safeAppName}</a>
                        </td>
                    </tr>
                    <tr>
                        <td class="email-body" width="100%">
                            <table class="email-body_inner" align="center" width="570" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td class="content-cell">
                                        <h1>You've been invited to join a client portal! 🎉</h1>
                                        <p>You have been invited to participate in a client portal on ${safeAppName}.</p>
                                        
                                        <div class="portal-details">
                                            <h2>Portal Details:</h2>
                                            <p><strong>Portal Name:</strong> ${safePortalTitle}</p>
                                            <p><strong>Invitation Date:</strong> ${getCurrentDate()}</p>
                                        </div>
                                        
                                        <p>This portal will allow you to collaborate on important documents and participate in the review process.</p>
                                        
                                        <table class="body-action" align="center" width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center">
                                                    <div>
                                                        <a href="${safeInviteUrl}" class="button button--green">Join Portal</a>
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <h2>What happens next?</h2>
                                        <ul>
                                            <li>Click the "Join Portal" button above</li>
                                            <li>If you already have an account, simply log in</li>
                                            <li>If you don't have an account, you can register using this email address</li>
                                            <li>Once logged in, you'll have access to the portal and its documents</li>
                                        </ul>
                                        
                                        <p>If you have any questions or need assistance, please don't hesitate to contact the portal owner.</p>
                                        
                                        <p>Best regards,<br>The ${safeAppName} Team</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <table class="email-footer" align="center" width="570" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td class="content-cell">
                                        <p class="sub center">
                                            © ${new Date().getFullYear()} ${safeAppName}. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
};

/**
 * Welcome email template
 * @param {string} userName - User's name
 * @param {string} appName - Application name
 * @param {string} frontendUrl - Frontend URL
 * @returns {string} - HTML email template
 */
export const welcomeEmail = (userName, appName, frontendUrl) => {
	const safeUserName = safeValue(userName, 'User');
	const safeAppName = safeValue(appName, 'LexiFlow');
	const safeFrontendUrl = safeValue(frontendUrl, '#');

	return `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Welcome to ${safeAppName}</title>
    <style type="text/css" rel="stylesheet" media="all">
        *:not(br):not(tr):not(html) {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            -webkit-box-sizing: border-box;
            box-sizing: border-box;
        }

        body {
            width: 100% !important;
            height: 100%;
            margin: 0;
            line-height: 1.4;
            background-color: #f8fafc;
            color: #475569;
            -webkit-text-size-adjust: none;
        }

        a {
            color: #3b82f6;
            text-decoration: none;
        }

        .email-wrapper {
            width: 100%;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
        }

        .email-content {
            width: 100%;
            margin: 0;
            padding: 0;
        }

        .email-masthead {
            padding: 30px 0;
            text-align: center;
            background-color: #ffffff;
            border-bottom: 1px solid #e2e8f0;
        }

        .email-masthead_name {
            font-size: 24px;
            font-weight: 700;
            color: #1e293b;
            text-decoration: none;
            letter-spacing: -0.025em;
        }

        .email-body {
            width: 100%;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
        }

        .email-body_inner {
            width: 570px;
            margin: 0 auto;
            padding: 0;
        }

        .email-footer {
            width: 570px;
            margin: 0 auto;
            padding: 0;
            text-align: center;
            background-color: #f8fafc;
        }

        .email-footer p {
            color: #64748b;
        }

        .body-action {
            width: 100%;
            margin: 30px auto;
            padding: 0;
            text-align: center;
        }

        .body-sub {
            margin-top: 25px;
            padding-top: 25px;
            border-top: 1px solid #e2e8f0;
        }

        .content-cell {
            padding: 40px;
        }

        .align-right {
            text-align: right;
        }

        h1 {
            margin-top: 0;
            color: #1e293b;
            font-size: 24px;
            font-weight: 700;
            text-align: left;
            line-height: 1.3;
        }

        h2 {
            margin-top: 0;
            color: #1e293b;
            font-size: 20px;
            font-weight: 600;
            text-align: left;
            line-height: 1.3;
        }

        h3 {
            margin-top: 0;
            color: #1e293b;
            font-size: 18px;
            font-weight: 600;
            text-align: left;
            line-height: 1.3;
        }

        p {
            margin-top: 0;
            color: #475569;
            font-size: 16px;
            line-height: 1.6;
            text-align: left;
        }

        p.sub {
            font-size: 14px;
            color: #64748b;
        }

        p.center {
            text-align: center;
        }

        ul {
            margin: 20px 0;
            padding-left: 20px;
        }

        li {
            color: #475569;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 8px;
        }

        .button {
            display: inline-block;
            width: 200px;
            background-color: #10b981;
            border-radius: 8px;
            color: #ffffff !important;
            font-size: 16px;
            font-weight: 600;
            line-height: 50px;
            text-align: center;
            text-decoration: none;
            -webkit-text-size-adjust: none;
            mso-hide: all;
            transition: background-color 0.2s ease;
        }

        .button:hover {
            background-color: #059669 !important;
        }

        .button--green {
            background-color: #10b981;
        }

        .button--green:hover {
            background-color: #059669 !important;
        }

        .button--blue {
            background-color: #3b82f6;
        }

        .button--blue:hover {
            background-color: #2563eb !important;
        }

        @media only screen and (max-width: 600px) {
            .email-body_inner,
            .email-footer {
                width: 100% !important;
            }
            
            .content-cell {
                padding: 20px !important;
            }
        }

        @media only screen and (max-width: 500px) {
            .button {
                width: 100% !important;
            }
        }
    </style>
</head>

<body>
    <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center">
                <table class="email-content" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td class="email-masthead">
                            <a class="email-masthead_name">${safeAppName}</a>
                        </td>
                    </tr>
                    <tr>
                        <td class="email-body" width="100%">
                            <table class="email-body_inner" align="center" width="570" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td class="content-cell">
                                        <h1>Welcome to ${safeAppName}! 🎉</h1>
                                        <p>Hi ${safeUserName},</p>
                                        <p>Congratulations! Your email has been successfully verified. You're now officially part of the ${safeAppName} community!</p>
                                        
                                        <h2>What's Next?</h2>
                                        <p>Here are some things you can do to get started:</p>
                                        <ul>
                                            <li>Complete your profile</li>
                                            <li>Explore our services</li>
                                            <li>Connect with lawyers</li>
                                            <li>Start your first consultation</li>
                                        </ul>
                                        
                                        <table class="body-action" align="center" width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center">
                                                    <div>
                                                        <a href="${safeFrontendUrl}/dashboard" class="button button--blue">Get Started</a>
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p>We're excited to have you on board and can't wait to see what you'll accomplish with ${safeAppName}!</p>
                                        <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>
                                        
                                        <p>Best regards,<br>The ${safeAppName} Team</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <table class="email-footer" align="center" width="570" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td class="content-cell">
                                        <p class="sub center">
                                            © ${new Date().getFullYear()} ${safeAppName}. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
};

// ============================================================================
// EXPORT ALL TEMPLATES
// ============================================================================

export default {
	verifyEmail,
	resetPassword,
	portalInvitation,
	welcomeEmail
};
