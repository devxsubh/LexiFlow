import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '~/models';
import { Role } from '~/models';
import config from '~/config/config';
import logger from '~/config/logger';

// JWT Strategy
passport.use(
	new JwtStrategy(
		{
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: config.JWT_ACCESS_TOKEN_SECRET_PUBLIC,
			algorithms: 'RS256'
		},
		async (jwtPayload, done) => {
			try {
				const user = await User.getUserById(jwtPayload.sub);
				if (!user) {
					return done(null, false);
				}
				return done(null, user);
			} catch (err) {
				return done(err, false);
			}
		}
	)
);

// Google Strategy
passport.use(
	new GoogleStrategy(
		{
			clientID: config.google.clientId,
			clientSecret: config.google.clientSecret,
			callbackURL: config.google.callbackURL,
			proxy: true
		},
		async (accessToken, refreshToken, profile, done) => {
			try {
				logger.info('Received Google profile:', profile);

				if (!profile.emails || !profile.emails[0] || !profile.emails[0].value) {
					logger.error('No email found in Google profile');
					return done(new Error('No email found in Google profile'));
				}

				const email = profile.emails[0].value;
				const existingUser = await User.findOne({ email });

				if (existingUser) {
					logger.info('Existing user found:', existingUser.email);
					return done(null, existingUser);
				}

				// Get default user role
				const userRole = await Role.findOne({ name: 'User' });
				if (!userRole) {
					logger.error('Default User role not found');
					return done(new Error('Default User role not found'));
				}

				// Generate a secure random password that meets validation requirements
				const randomPassword = 'Google' + Math.random().toString(36).slice(-8) + '!@#';
				logger.info('Generated password for new user');

				// Create new user with unhashed password (will be hashed by pre-save middleware)
				const newUser = await User.createUser({
					firstName: profile.name?.givenName || 'Google',
					lastName: profile.name?.familyName || 'User',
					email,
					password: randomPassword, // Let the pre-save middleware hash it
					userName: email.split('@')[0], // Use email prefix as username
					roles: [userRole._id],
					confirmed: true // Email is verified by Google
				});

				logger.info('New user created:', newUser.email);
				return done(null, newUser);
			} catch (error) {
				logger.error('Error in Google strategy:', error);
				return done(error);
			}
		}
	)
);

// Serialize user
passport.serializeUser((user, done) => {
	done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
	try {
		const user = await User.findById(id);
		done(null, user);
	} catch (error) {
		done(error);
	}
});

export default passport;
