import mongoose from 'mongoose';

const conversationActionSchema = new mongoose.Schema({
	contractId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Contract',
		required: true
	},
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	actionType: {
		type: String,
		required: true
	},
	actionData: {
		type: mongoose.Schema.Types.Mixed,
		required: true
	},
	createdAt: {
		type: Date,
		default: Date.now
	}
});

const ConversationAction = mongoose.model('ConversationAction', conversationActionSchema);

export default ConversationAction;
