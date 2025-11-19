import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import passport from '~/config/passport';
import routes from '~/routes/v1';
import error from '~/middlewares/error';
import rateLimiter from '~/middlewares/rateLimiter';
import config from '~/config/config';
import morgan from '~/config/morgan';
import http from 'http';

const app = express();

if (config.NODE_ENV !== 'test') {
	app.use(morgan);
}

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration for SSE
app.use(
	cors({
		origin: [
			'http://localhost:5173',
			'http://localhost:3000',
			'https://lexiflow-frontend.vercel.app',
			'https://lexiflow.in',
			'https://www.lexiflow.in'
		],
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control']
	})
);

// Disable compression for SSE routes
app.use((req, res, next) => {
	if (req.path === '/api/v1/notifications/connect') {
		return next();
	}
	compression()(req, res, next);
});

app.use(rateLimiter);
app.use(passport.initialize());
app.use(express.static('public'));
app.use('/api/v1', routes);

// Add raw body parser for Razorpay webhook
app.use('/api/v1/subscriptions/webhook/razorpay', express.raw({ type: 'application/json' }), (req, res, next) => {
	req.rawBody = req.body;
	try {
		req.body = JSON.parse(req.body.toString());
	} catch (e) {
		req.body = {};
	}
	next();
});

app.use(error.converter);
app.use(error.notFound);
app.use(error.handler);

const server = http.createServer(app);

export { app, server };
