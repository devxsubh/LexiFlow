import mongoose from 'mongoose';
import paginate from './plugins/paginatePlugin.js';
import toJSON from './plugins/toJSONPlugin.js';

const jurisdictionSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true, unique: true },
		displayName: { type: String, required: true, trim: true },
		type: {
			type: String,
			required: true,
			enum: ['state', 'union_territory', 'central'],
			default: 'state'
		},
		code: { type: String, required: true, trim: true, unique: true }, // ISO code or official code
		capital: { type: String, trim: true },
		highCourt: { type: String, trim: true },
		highCourtLocation: { type: String, trim: true },
		districts: [{ type: String, trim: true }],
		officialLanguage: [{ type: String, trim: true }],
		additionalLanguages: [{ type: String, trim: true }],
		population: { type: Number },
		area: { type: Number }, // in square kilometers
		description: { type: String, trim: true },
		legalSystem: {
			type: String,
			enum: ['common_law', 'civil_law', 'mixed'],
			default: 'common_law'
		},
		specialProvisions: [{ type: String, trim: true }],
		applicableLaws: [{ type: String, trim: true }],
		timeZone: { type: String, trim: true },
		region: {
			type: String,
			enum: ['north', 'south', 'east', 'west', 'central', 'northeast', 'central_government'],
			default: 'north'
		},
		isActive: { type: Boolean, default: true },
		isPublic: { type: Boolean, default: true },
		metadata: {
			seoKeywords: [{ type: String, trim: true }],
			searchTags: [{ type: String, trim: true }],
			legalRequirements: [{ type: String, trim: true }],
			commonIssues: [{ type: String, trim: true }],
			bestPractices: [{ type: String, trim: true }],
			contactInfo: {
				officialWebsite: { type: String, trim: true },
				contactEmail: { type: String, trim: true },
				contactPhone: { type: String, trim: true }
			}
		},
		createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
	},
	{ timestamps: true }
);

jurisdictionSchema.plugin(toJSON);
jurisdictionSchema.plugin(paginate);

// Indexes for better query performance
jurisdictionSchema.index({ name: 1 });
jurisdictionSchema.index({ code: 1 });
jurisdictionSchema.index({ type: 1 });
jurisdictionSchema.index({ region: 1 });
jurisdictionSchema.index({ isActive: 1 });
jurisdictionSchema.index({ 'metadata.searchTags': 1 });

// Static methods
jurisdictionSchema.statics.findByType = function (type) {
	return this.find({ type, isActive: true }).sort({ name: 1 });
};

jurisdictionSchema.statics.findByRegion = function (region) {
	return this.find({ region, isActive: true }).sort({ name: 1 });
};

jurisdictionSchema.statics.findByHighCourt = function (highCourt) {
	return this.find({ highCourt, isActive: true }).sort({ name: 1 });
};

// Instance methods
jurisdictionSchema.methods.getFullName = function () {
	return `${this.displayName} (${this.code})`;
};

jurisdictionSchema.methods.getLegalInfo = function () {
	return {
		name: this.name,
		displayName: this.displayName,
		highCourt: this.highCourt,
		highCourtLocation: this.highCourtLocation,
		legalSystem: this.legalSystem,
		applicableLaws: this.applicableLaws
	};
};

export default mongoose.model('Jurisdiction', jurisdictionSchema);
