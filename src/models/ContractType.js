import mongoose from 'mongoose';
import paginate from './plugins/paginatePlugin.js';
import toJSON from './plugins/toJSONPlugin.js';

const contractTypeSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			unique: true
		},
		displayName: {
			type: String,
			required: true,
			trim: true
		},
		category: {
			type: String,
			required: true,
			enum: [
				'Business & Commercial',
				'Employment & HR',
				'Property & Real Estate',
				'Finance & Lending',
				'Technology & IP',
				'Personal & Miscellaneous'
			]
		},
		description: {
			type: String,
			required: true,
			trim: true
		},
		shortDescription: {
			type: String,
			trim: true
		},
		keywords: [
			{
				type: String,
				trim: true
			}
		],
		relatedTypes: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'ContractType'
			}
		],
		commonClauses: [
			{
				type: String,
				trim: true
			}
		],
		requiredParties: [
			{
				type: String,
				trim: true
			}
		],
		typicalDuration: {
			type: String,
			enum: ['short-term', 'medium-term', 'long-term', 'ongoing', 'one-time'],
			default: 'medium-term'
		},
		complexity: {
			type: String,
			enum: ['simple', 'moderate', 'complex'],
			default: 'moderate'
		},
		jurisdictionSpecific: {
			type: Boolean,
			default: false
		},
		supportedJurisdictions: [
			{
				type: String,
				trim: true
			}
		],
		industrySpecific: {
			type: Boolean,
			default: false
		},
		supportedIndustries: [
			{
				type: String,
				trim: true
			}
		],
		templateCount: {
			type: Number,
			default: 0
		},
		usageCount: {
			type: Number,
			default: 0
		},
		popularity: {
			type: Number,
			default: 0
		},
		isActive: {
			type: Boolean,
			default: true
		},
		isPublic: {
			type: Boolean,
			default: true
		},
		metadata: {
			seoKeywords: [String],
			searchTags: [String],
			similarTypes: [String],
			legalRequirements: [String],
			commonIssues: [String],
			bestPractices: [String]
		},
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
		},
		updatedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
		}
	},
	{
		timestamps: true
	}
);

// Add plugins
contractTypeSchema.plugin(toJSON);
contractTypeSchema.plugin(paginate);

// Indexes for better query performance
contractTypeSchema.index({ category: 1, isActive: 1 });
contractTypeSchema.index({ name: 1 });
contractTypeSchema.index({ keywords: 1 });
contractTypeSchema.index({ popularity: -1 });
contractTypeSchema.index({ usageCount: -1 });
contractTypeSchema.index({ 'metadata.searchTags': 1 });

// Update the updatedAt timestamp before saving
contractTypeSchema.pre('save', function (next) {
	this.updatedAt = Date.now();
	next();
});

// Static method to get contract types by category
contractTypeSchema.statics.getByCategory = function (category) {
	return this.find({ category, isActive: true }).sort({ popularity: -1 });
};

// Static method to search contract types
contractTypeSchema.statics.search = function (query, filters = {}) {
	const searchQuery = {
		isActive: true,
		...filters
	};

	if (query) {
		searchQuery.$or = [
			{ name: { $regex: query, $options: 'i' } },
			{ displayName: { $regex: query, $options: 'i' } },
			{ description: { $regex: query, $options: 'i' } },
			{ keywords: { $in: [new RegExp(query, 'i')] } },
			{ 'metadata.searchTags': { $in: [new RegExp(query, 'i')] } }
		];
	}

	return this.find(searchQuery).sort({ popularity: -1 });
};

// Instance method to get similar contract types
contractTypeSchema.methods.getSimilar = function (limit = 5) {
	const ContractType = this.constructor;
	return ContractType.find({
		_id: { $ne: this._id },
		category: this.category,
		isActive: true
	})
		.limit(limit)
		.sort({ popularity: -1 });
};

const ContractType = mongoose.model('ContractType', contractTypeSchema);

export default ContractType;
