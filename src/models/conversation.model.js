import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
	_id: {
		type: mongoose.Schema.Types.ObjectId,
		auto: true
	},
	role: {
		type: String,
		enum: ['system', 'user', 'assistant'],
		required: true
	},
	content: {
		type: String,
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
		provider: String,
		responseTime: Number
	},
	timestamp: {
		type: Date,
		default: Date.now
	},
	embeddingGenerated: {
		type: Boolean,
		default: false
	}
});

const conversationSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	title: {
		type: String,
		required: true
	},
	description: {
		type: String,
		default: ''
	},
	messages: [messageSchema],
	status: {
		type: String,
		enum: ['active', 'archived', 'deleted'],
		default: 'active'
	},
	tags: [
		{
			type: String,
			trim: true
		}
	],
	metadata: {
		documentType: String,
		lastActivity: Date,
		messageCount: {
			type: Number,
			default: 0
		},
		averageResponseTime: Number
	},
	createdAt: {
		type: Date,
		default: Date.now
	},
	updatedAt: {
		type: Date,
		default: Date.now
	}
});

// Update the updatedAt timestamp before saving
conversationSchema.pre('save', function (next) {
	this.updatedAt = new Date();
	this.metadata.lastActivity = new Date();
	this.metadata.messageCount = this.messages.length;
	next();
});

// Add indexes for better query performance
conversationSchema.index({ userId: 1, status: 1, createdAt: -1 });
conversationSchema.index({ userId: 1, 'metadata.lastActivity': -1 });
conversationSchema.index({ tags: 1 });

// Add methods to the schema
conversationSchema.methods.addMessage = async function (role, content, metadata = {}) {
	this.messages.push({
		role,
		content,
		metadata,
		timestamp: new Date()
	});
	return this.save();
};

conversationSchema.methods.archive = async function () {
	this.status = 'archived';
	return this.save();
};

conversationSchema.methods.restore = async function () {
	this.status = 'active';
	return this.save();
};

conversationSchema.methods.getRecentMessages = function (limit = 10) {
	return this.messages.slice(-limit);
};

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
