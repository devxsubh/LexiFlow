import mongoose from 'mongoose';

const contractCommentSchema = new mongoose.Schema(
	{
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
		content: {
			type: String,
			required: true,
			trim: true
		},
		// Refactored context to be a simple string
		context: {
			type: String,
			default: 'General'
		},
		parentCommentId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'ContractComment',
			default: null
		},
		isResolved: {
			type: Boolean,
			default: false
		},
		resolvedAt: {
			type: Date
		},
		resolvedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
		}
	},
	{
		timestamps: true
	}
);

// Index for efficient querying
contractCommentSchema.index({ contractId: 1, createdAt: -1 });
contractCommentSchema.index({ parentCommentId: 1 });

const ContractComment = mongoose.model('ContractComment', contractCommentSchema);

export default ContractComment;
