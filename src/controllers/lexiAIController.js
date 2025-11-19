import lexiAIService from '../services/lexiAIService';
import APIError from '~/utils/apiError';
import httpStatus from 'http-status';

class LexiAIController {
	async createConversation(req, res) {
		try {
			const { title, description } = req.body;
			if (!title) {
				throw new APIError('Title is required', httpStatus.BAD_REQUEST);
			}
			const conversation = await lexiAIService.createConversation(req.user.id, title, description);
			res.status(httpStatus.CREATED).json({ conversation });
		} catch (error) {
			if (error instanceof APIError) {
				res.status(error.status).json({ error: error.message });
			} else {
				res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
			}
		}
	}

	async getConversation(req, res) {
		try {
			const conversation = await lexiAIService.getConversation(req.params.conversationId, req.user.id);
			res.status(httpStatus.OK).json({ conversation });
		} catch (error) {
			if (error instanceof APIError) {
				res.status(error.status).json({ error: error.message });
			} else {
				res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
			}
		}
	}

	async getUserConversations(req, res) {
		try {
			const result = await lexiAIService.getUserConversations(req.user.id, req.query);
			res.status(httpStatus.OK).json(result);
		} catch (error) {
			if (error instanceof APIError) {
				res.status(error.status).json({ error: error.message });
			} else {
				res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
			}
		}
	}

	async summarizeText(req, res) {
		try {
			const { text, conversationId } = req.body;
			if (!text) {
				return res.status(400).json({ error: 'Text is required' });
			}
			const summary = await lexiAIService.summarizeText(text, conversationId);
			res.json({ summary });
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	}

	async explainLegalJargon(req, res) {
		try {
			const { text, conversationId } = req.body;
			if (!text) {
				return res.status(400).json({ error: 'Text is required' });
			}
			const explanation = await lexiAIService.explainLegalJargon(text, conversationId);
			res.json({ explanation });
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	}

	async analyzeRisks(req, res) {
		try {
			const { text, conversationId } = req.body;
			if (!text) {
				return res.status(400).json({ error: 'Text is required' });
			}
			const analysis = await lexiAIService.analyzeRisks(text, conversationId);
			res.json({ analysis });
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	}

	async suggestClauses(req, res) {
		try {
			const { context, type, conversationId } = req.body;
			if (!context || !type) {
				return res.status(400).json({ error: 'Context and type are required' });
			}
			const suggestions = await lexiAIService.suggestClauses(context, type, conversationId);
			res.json({ suggestions });
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	}

	async adjustTone(req, res) {
		try {
			const { text, targetTone, conversationId } = req.body;
			if (!text || !targetTone) {
				return res.status(400).json({ error: 'Text and target tone are required' });
			}
			const adjustedText = await lexiAIService.adjustTone(text, targetTone, conversationId);
			res.json({ adjustedText });
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	}

	async archiveConversation(req, res) {
		try {
			const conversation = await lexiAIService.archiveConversation(req.params.conversationId, req.user.id);
			res.status(httpStatus.OK).json({ conversation });
		} catch (error) {
			if (error instanceof APIError) {
				res.status(error.status).json({ error: error.message });
			} else {
				res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
			}
		}
	}

	async restoreConversation(req, res) {
		try {
			const conversation = await lexiAIService.restoreConversation(req.params.conversationId, req.user.id);
			res.status(httpStatus.OK).json({ conversation });
		} catch (error) {
			if (error instanceof APIError) {
				res.status(error.status).json({ error: error.message });
			} else {
				res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
			}
		}
	}

	async handleChat(req, res) {
		try {
			const { message, conversationId, context } = req.body;
			if (!message) {
				throw new APIError('Message is required', httpStatus.BAD_REQUEST);
			}

			const response = await lexiAIService.processLegalQuery(message, {
				conversationId,
				userId: req.user.id,
				documentType: context?.documentType,
				tone: context?.tone
			});

			res.status(httpStatus.OK).json({
				success: true,
				response
			});
		} catch (error) {
			if (error instanceof APIError) {
				res.status(error.status).json({ error: error.message });
			} else {
				res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
			}
		}
	}
}

export default new LexiAIController();
