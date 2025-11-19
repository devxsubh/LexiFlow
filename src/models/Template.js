import mongoose from 'mongoose';
import paginate from './plugins/paginatePlugin';
import toJSON from './plugins/toJSONPlugin';

const templateSchema = new mongoose.Schema({
	title: { type: String, required: true, trim: true },
	type: { type: String, required: true },
	description: { type: String, required: true },
	category: { type: String, required: true },
	industry: { type: String, required: true },
	jurisdiction: { type: String, required: true },
	content: { type: String, required: true }, // HTML or JSON
	tags: [{ type: String, trim: true }],
	version: { type: String, default: '1.0' },
	createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	isPublic: { type: Boolean, default: true },
	usageCount: { type: Number, default: 0 },
	rating: { type: Number, min: 0, max: 5, default: 0 },
	reviews: [
		{
			user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
			rating: { type: Number, min: 0, max: 5, required: true },
			comment: { type: String, maxlength: 500 },
			createdAt: { type: Date, default: Date.now }
		}
	],
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now }
});

templateSchema.pre('save', function (next) {
	this.updatedAt = Date.now();
	next();
});

// Text search index
templateSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Compound indexes for better query performance
templateSchema.index({ isPublic: 1, category: 1, industry: 1 });
templateSchema.index({ isPublic: 1, jurisdiction: 1 });
templateSchema.index({ isPublic: 1, rating: -1, usageCount: -1 });
templateSchema.index({ isPublic: 1, createdBy: 1 });

// Single field indexes
templateSchema.index({ createdBy: 1 });
templateSchema.index({ category: 1 });
templateSchema.index({ industry: 1 });
templateSchema.index({ jurisdiction: 1 });
templateSchema.index({ tags: 1 });
templateSchema.index({ rating: -1 });
templateSchema.index({ usageCount: -1 });

// Add plugins
templateSchema.plugin(toJSON);
templateSchema.plugin(paginate);

const Template = mongoose.model('Template', templateSchema);

export default Template;
