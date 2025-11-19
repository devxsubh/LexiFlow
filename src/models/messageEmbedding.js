import mongoose from 'mongoose';
import paginate from './plugins/paginatePlugin.js';
import toJSON from './plugins/toJSONPlugin.js';

const messageEmbeddingSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true
		},
		conversationId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Conversation',
			required: true,
			index: true
		},
		messageId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			index: true
		},
		role: {
			type: String,
			enum: ['user', 'assistant'],
			required: true
		},
		content: {
			type: String,
			required: true
		},
		embedding: {
			type: [Number],
			required: true
		},
		metadata: {
			type: {
				type: String,
				enum: ['system', 'chat', 'summarize', 'explain', 'analyze', 'suggest', 'adjust'],
				default: 'chat'
			},
			documentType: String,
			tone: String,
			references: [String],
			suggestions: [String],
			provider: String
		},
		timestamp: {
			type: Date,
			default: Date.now,
			index: true
		}
	},
	{
		timestamps: true
	}
);

// Compound indexes for efficient queries
messageEmbeddingSchema.index({ userId: 1, conversationId: 1, timestamp: -1 });
messageEmbeddingSchema.index({ userId: 1, 'metadata.type': 1, timestamp: -1 });
messageEmbeddingSchema.index({ conversationId: 1, timestamp: -1 });

// Plugin for pagination and JSON transformation
messageEmbeddingSchema.plugin(toJSON);
messageEmbeddingSchema.plugin(paginate);

// Method to calculate similarity with another embedding
messageEmbeddingSchema.methods.calculateSimilarity = function (otherEmbedding) {
	if (!otherEmbedding || !Array.isArray(otherEmbedding) || otherEmbedding.length !== this.embedding.length) {
		return 0;
	}

	let dotProduct = 0;
	let norm1 = 0;
	let norm2 = 0;

	for (let i = 0; i < this.embedding.length; i++) {
		dotProduct += this.embedding[i] * otherEmbedding[i];
		norm1 += this.embedding[i] * this.embedding[i];
		norm2 += otherEmbedding[i] * otherEmbedding[i];
	}

	const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
	if (denominator === 0) return 0;

	return dotProduct / denominator;
};

// Static method to find similar messages using MongoDB Atlas Vector Search
messageEmbeddingSchema.statics.findSimilar = async function (queryEmbedding, options = {}) {
	const {
		userId,
		conversationId,
		limit = 10,
		threshold = 0.7,
		excludeMessageIds = [],
		metadataFilter = {}
	} = options;

	try {
		// Build filter for metadata
		const filter = { userId };
		if (conversationId) {
			filter.conversationId = conversationId;
		}
		if (excludeMessageIds.length > 0) {
			filter.messageId = { $nin: excludeMessageIds };
		}
		if (Object.keys(metadataFilter).length > 0) {
			Object.keys(metadataFilter).forEach(key => {
				filter[`metadata.${key}`] = metadataFilter[key];
			});
		}

		// Use MongoDB Atlas Vector Search aggregation pipeline
		const pipeline = [
			{
				$vectorSearch: {
					index: 'vector_index', // Name of your vector search index in Atlas
					path: 'embedding',
					queryVector: queryEmbedding,
					numCandidates: limit * 10, // Search more candidates for better results
					limit: limit * 2, // Get more results for filtering
					filter: filter
				}
			},
			{
				$addFields: {
					similarity: { $meta: 'vectorSearchScore' }
				}
			},
			{
				$match: {
					similarity: { $gte: threshold }
				}
			},
			{
				$sort: { similarity: -1 }
			},
			{
				$limit: limit
			},
			{
				$project: {
					messageId: 1,
					conversationId: 1,
					content: 1,
					role: 1,
					metadata: 1,
					timestamp: 1,
					similarity: 1
				}
			}
		];

		// Execute aggregation
		const results = await this.aggregate(pipeline);

		return results;
	} catch (error) {
		// Fallback to JavaScript-based similarity if vector search fails
		// (e.g., index not created yet, or not using Atlas)
		console.warn('MongoDB Vector Search failed, falling back to JavaScript similarity:', error.message);
		
		// Build query for fallback
		const query = { userId };
		if (conversationId) {
			query.conversationId = conversationId;
		}
		if (excludeMessageIds.length > 0) {
			query.messageId = { $nin: excludeMessageIds };
		}
		if (Object.keys(metadataFilter).length > 0) {
			Object.keys(metadataFilter).forEach(key => {
				query[`metadata.${key}`] = metadataFilter[key];
			});
		}

		// Get all candidate embeddings
		const candidates = await this.find(query).limit(limit * 3);

		// Calculate similarity for each candidate
		const scored = candidates.map(doc => ({
			doc,
			similarity: doc.calculateSimilarity(queryEmbedding)
		}));

		// Filter by threshold and sort by similarity
		const filtered = scored
			.filter(item => item.similarity >= threshold)
			.sort((a, b) => b.similarity - a.similarity)
			.slice(0, limit);

		return filtered.map(item => ({
			messageId: item.doc.messageId,
			conversationId: item.doc.conversationId,
			content: item.doc.content,
			role: item.doc.role,
			metadata: item.doc.metadata,
			timestamp: item.doc.timestamp,
			similarity: item.similarity
		}));
	}
};

const MessageEmbedding = mongoose.model('MessageEmbedding', messageEmbeddingSchema);

export default MessageEmbedding;

