import mongoose from 'mongoose';
import toJSON from './plugins/toJSONPlugin';
import paginate from './plugins/paginatePlugin';

const faqSchema = new mongoose.Schema(
	{
		question: {
			type: String,
			required: true,
			trim: true,
			maxlength: 500
		},
		answer: {
			type: String,
			required: true,
			trim: true,
			maxlength: 2000
		},
		category: {
			type: String,
			required: true,
			enum: ['general', 'technical', 'billing', 'consultation', 'contract', 'account', 'features', 'other'],
			default: 'general'
		},
		tags: [
			{
				type: String,
				trim: true
			}
		],
		order: {
			type: Number,
			default: 0
		},
		isActive: {
			type: Boolean,
			default: true
		},
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true
		},
		lastUpdatedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
		},
		viewCount: {
			type: Number,
			default: 0
		},
		helpfulCount: {
			type: Number,
			default: 0
		},
		notHelpfulCount: {
			type: Number,
			default: 0
		}
	},
	{
		timestamps: true
	}
);

// Indexes for better query performance
faqSchema.index({ category: 1 });
faqSchema.index({ isActive: 1 });
faqSchema.index({ order: 1 });
faqSchema.index({ tags: 1 });
faqSchema.index({ createdAt: -1 });

// Add plugins
faqSchema.plugin(toJSON);
faqSchema.plugin(paginate);

// Virtual field to get creator details
faqSchema.virtual('creator', {
	ref: 'User',
	localField: 'createdBy',
	foreignField: '_id',
	justOne: true
});

// Virtual field to get last updater details
faqSchema.virtual('lastUpdater', {
	ref: 'User',
	localField: 'lastUpdatedBy',
	foreignField: '_id',
	justOne: true
});

// Pre-save middleware to update lastUpdatedBy
faqSchema.pre('save', function (next) {
	if (this.isModified() && !this.isNew) {
		this.lastUpdatedBy = this.createdBy; // This will be set by the service
	}
	next();
});

const FAQ = mongoose.model('FAQ', faqSchema);

export default FAQ;
